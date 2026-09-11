const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { initDB, query } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Utilidad para generar ID de sala alfanumérico
const generarIdSala = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado:', socket.id);

  // 1. CREAR PARTIDA (Líder)
  socket.on('crear_partida', async (data, callback) => {
    try {
      const { nombreLider, maxRondas } = data;
      const salaId = generarIdSala();
      
      // Insertar partida
      await query('INSERT INTO partidas (id, max_rondas) VALUES ($1, $2)', [salaId, maxRondas || 5]);
      
      // Insertar líder
      const resJugador = await query(
        'INSERT INTO jugadores (partida_id, nombre, is_lider) VALUES ($1, $2, $3) RETURNING *',
        [salaId, nombreLider, true]
      );
      const lider = resJugador.rows[0];

      socket.join(salaId);
      
      callback({
        success: true,
        salaId,
        jugador: lider
      });
      
      // Emitir actualización a la sala (por ahora solo está el líder, pero por consistencia)
      io.to(salaId).emit('jugadores_actualizados', [lider]);

    } catch (error) {
      console.error(error);
      callback({ success: false, error: error.message });
    }
  });

  // 2. UNIRSE A PARTIDA (Jugador normal)
  socket.on('unirse_partida', async (data, callback) => {
    try {
      const { salaId, nombreJugador } = data;
      const salaCode = salaId.toUpperCase();

      // Verificar si existe la partida
      const resPartida = await query('SELECT * FROM partidas WHERE id = $1', [salaCode]);
      if (resPartida.rows.length === 0) {
        return callback({ success: false, error: 'La sala no existe.' });
      }

      const partida = resPartida.rows[0];
      if (partida.estado !== 'ESPERANDO') {
        return callback({ success: false, error: 'La partida ya ha comenzado o finalizado.' });
      }

      // Eliminar al jugador inactivo si existe con el mismo nombre para permitir reconexión o reuso del nombre
      await query("DELETE FROM jugadores WHERE partida_id = $1 AND nombre = $2 AND activo = FALSE", [salaCode, nombreJugador]);

      // Insertar jugador
      let jugador;
      try {
        const resJugador = await query(
            'INSERT INTO jugadores (partida_id, nombre) VALUES ($1, $2) RETURNING *',
            [salaCode, nombreJugador]
        );
        jugador = resJugador.rows[0];
      } catch (err) {
        if (err.code === '23505') { // Violación de unicidad (nombre repetido en la sala)
            return callback({ success: false, error: 'Ya hay un pirata con ese nombre en esta sala.' });
        }
        throw err;
      }

      socket.join(salaCode);

      // Obtener todos los jugadores actuales
      const resJugadores = await query('SELECT * FROM jugadores WHERE partida_id = $1 ORDER BY id ASC', [salaCode]);
      
      callback({ success: true, salaId: salaCode, jugador, partida, jugadoresEnSala: resJugadores.rows });
      
      // Notificar a todos en la sala del nuevo jugador
      io.to(salaCode).emit('jugadores_actualizados', resJugadores.rows);

    } catch (error) {
      console.error(error);
      callback({ success: false, error: error.message });
    }
  });

  // 3. INICIAR JUEGO (Solo Líder)
  socket.on('iniciar_juego', async (data) => {
    try {
      const { salaId } = data;

      // Limpiar historial previo por si es un reinicio forzado
      await query("DELETE FROM historial_rondas WHERE partida_id = $1", [salaId]);
      // Reiniciar puntos por si quedaron puntos de una partida anterior
      await query("UPDATE jugadores SET puntos = 0 WHERE partida_id = $1", [salaId]);

      await query("UPDATE partidas SET estado = 'JUGANDO', ronda_actual = 1 WHERE id = $1", [salaId]);
      
      const resPartida = await query('SELECT max_rondas FROM partidas WHERE id = $1', [salaId]);
      const maxRondas = resPartida.rows.length > 0 ? resPartida.rows[0].max_rondas : 5;

      // Inicializar el historial (apuestas) para la primera ronda para todos los jugadores
      const resJugadores = await query('SELECT id FROM jugadores WHERE partida_id = $1', [salaId]);
      
      for(const jug of resJugadores.rows) {
          await query(
              'INSERT INTO historial_rondas (partida_id, ronda_numero, jugador_id) VALUES ($1, $2, $3)',
              [salaId, 1, jug.id]
          );
      }

      // Obtener la lista de jugadores actualizada con los puntos en 0
      const resJugadoresActualizados = await query('SELECT * FROM jugadores WHERE partida_id = $1 ORDER BY id ASC', [salaId]);

      io.to(salaId).emit('juego_iniciado', { 
        rondaActual: 1, 
        maxRondas,
        jugadores: resJugadoresActualizados.rows 
      });
      
      // Emitir el estado de la ronda para que todos vean quién falta de apostar
      const resHistorial = await query('SELECT * FROM historial_rondas WHERE partida_id = $1 AND ronda_numero = 1', [salaId]);
      io.to(salaId).emit('estado_ronda_actualizado', resHistorial.rows);

    } catch (error) {
      console.error(error);
    }
  });

  // 4. JUGADOR ENVIA APUESTA
  socket.on('enviar_apuesta', async (data, callback) => {
    try {
      const { salaId, jugadorId, rondaNumero, apuestaHecha } = data;
      
      await query(
          "UPDATE historial_rondas SET apuesta_hecha = $1, estado_apuesta = 'APOSTADO' WHERE partida_id = $2 AND ronda_numero = $3 AND jugador_id = $4",
          [apuestaHecha, salaId, rondaNumero, jugadorId]
      );

      if (callback) callback({ success: true });

      // Notificar a todos que este jugador ya apostó
      const resHistorial = await query('SELECT * FROM historial_rondas WHERE partida_id = $1 AND ronda_numero = $2', [salaId, rondaNumero]);
      io.to(salaId).emit('estado_ronda_actualizado', resHistorial.rows);

    } catch (error) {
      console.error(error);
      if (callback) callback({ success: false, error: error.message });
    }
  });

  // 5. LIDER CALIFICA RESULTADOS Y AVANZA RONDA
  socket.on('calificar_ronda', async (data, callback) => {
      // data.resultados es un array de objetos con: jugadorId, apuestaHecha, apuestaGanada, puntosExtra, efectoPirata, y los puntos calculados
    try {
      const { salaId, rondaNumero, resultados, maxRondas } = data;

      // 5.1 Guardar los resultados en el historial de esta ronda
      for(const res of resultados) {
          await query(
              `UPDATE historial_rondas 
               SET apuesta_hecha = $1, apuesta_ganada = $2, puntos_extra = $3, efecto_pirata = $4, puntos_obtenidos = $5, estado_apuesta = 'CALIFICADO'
               WHERE partida_id = $6 AND ronda_numero = $7 AND jugador_id = $8`,
              [res.apuestaHecha, res.apuestaGanada, res.puntosExtra, res.efectoPirata, res.puntosCalculados, salaId, rondaNumero, res.jugadorId]
          );

          // 5.2 Sumar puntos al jugador
          await query(
              `UPDATE jugadores SET puntos = puntos + $1 WHERE id = $2`,
              [res.puntosCalculados, res.jugadorId]
          );
      }

      // Obtener jugadores actualizados
      const resJugadores = await query('SELECT * FROM jugadores WHERE partida_id = $1 ORDER BY id ASC', [salaId]);
      
      // 5.3 Evaluar si el juego terminó o avanza de ronda
      let nuevoEstado = 'JUGANDO';
      let proximaRonda = rondaNumero + 1;

      if (rondaNumero >= maxRondas) {
          nuevoEstado = 'FINALIZADA';
          await query("UPDATE partidas SET estado = $1 WHERE id = $2", [nuevoEstado, salaId]);
          
      // Al finalizar, eliminar a los inactivos y resetear en_lobby a false para los activos
      await query("DELETE FROM jugadores WHERE partida_id = $1 AND activo = FALSE", [salaId]);
      await query("UPDATE jugadores SET en_lobby = FALSE WHERE partida_id = $1 AND activo = TRUE", [salaId]);
          
          // Obtener lista final
          const resJugadoresFinal = await query('SELECT * FROM jugadores WHERE partida_id = $1 ORDER BY id ASC', [salaId]);

          io.to(salaId).emit('juego_finalizado', { 
            jugadores: resJugadoresFinal.rows 
          });

      } else {
          await query("UPDATE partidas SET ronda_actual = $1 WHERE id = $2", [proximaRonda, salaId]);
          
          // Crear placeholders para la nueva ronda
          for(const jug of resJugadores.rows) {
              await query(
                  'INSERT INTO historial_rondas (partida_id, ronda_numero, jugador_id) VALUES ($1, $2, $3)',
                  [salaId, proximaRonda, jug.id]
              );
          }

          const resNuevoHistorial = await query('SELECT * FROM historial_rondas WHERE partida_id = $1 AND ronda_numero = $2', [salaId, proximaRonda]);
          
          io.to(salaId).emit('ronda_avanzada', { 
              rondaActual: proximaRonda,
              maxRondas: maxRondas,
              jugadores: resJugadores.rows,
              estadoRonda: resNuevoHistorial.rows
          });
      }

      if (callback) callback({ success: true });

    } catch (error) {
      console.error(error);
      if (callback) callback({ success: false, error: error.message });
    }
  });

  // 6. OBTENER HISTORIAL COMPLETO
  socket.on('obtener_historial', async (data, callback) => {
    try {
      const { salaId } = data;
      const resTodoHistorial = await query('SELECT * FROM historial_rondas WHERE partida_id = $1 ORDER BY ronda_numero DESC', [salaId]);
      if (callback) callback({ success: true, historial: resTodoHistorial.rows });
    } catch (error) {
      console.error(error);
      if (callback) callback({ success: false, error: error.message });
    }
  });

  // 7. EDITAR RONDA PASADA
  socket.on('editar_ronda_pasada', async (data, callback) => {
    try {
      const { salaId, rondaNumero, jugadorId, apuestaHecha, apuestaGanada, puntosExtra, efectoPirata, puntosCalculados } = data;
      
      const resHistorial = await query(
        'SELECT puntos_obtenidos, estado_apuesta FROM historial_rondas WHERE partida_id = $1 AND ronda_numero = $2 AND jugador_id = $3',
        [salaId, rondaNumero, jugadorId]
      );
      
      if (resHistorial.rows.length === 0) return callback({ success: false, error: 'Historial no encontrado' });
      
      const estado = resHistorial.rows[0].estado_apuesta;

      if (estado !== 'CALIFICADO') {
         // Es una ronda activa, solo modificamos la apuesta
         await query(
           `UPDATE historial_rondas SET apuesta_hecha = $1 WHERE partida_id = $2 AND ronda_numero = $3 AND jugador_id = $4`,
           [apuestaHecha, salaId, rondaNumero, jugadorId]
         );
         
         const resNuevoHistorial = await query('SELECT * FROM historial_rondas WHERE partida_id = $1 AND ronda_numero = $2', [salaId, rondaNumero]);
         io.to(salaId).emit('estado_ronda_actualizado', resNuevoHistorial.rows);

         const resTodoHistorial = await query('SELECT * FROM historial_rondas WHERE partida_id = $1 ORDER BY ronda_numero DESC', [salaId]);
         io.to(salaId).emit('historial_completo_actualizado', resTodoHistorial.rows);

         return callback({ success: true });
      }

      const puntosViejos = resHistorial.rows[0].puntos_obtenidos;
      const diferencia = puntosCalculados - puntosViejos;

      await query(
        `UPDATE historial_rondas 
         SET apuesta_hecha = $1, apuesta_ganada = $2, puntos_extra = $3, efecto_pirata = $4, puntos_obtenidos = $5
         WHERE partida_id = $6 AND ronda_numero = $7 AND jugador_id = $8`,
        [apuestaHecha, apuestaGanada, puntosExtra, efectoPirata, puntosCalculados, salaId, rondaNumero, jugadorId]
      );

      await query(
        'UPDATE jugadores SET puntos = puntos + $1 WHERE id = $2',
        [diferencia, jugadorId]
      );

      const resJugadores = await query('SELECT * FROM jugadores WHERE partida_id = $1 ORDER BY id ASC', [salaId]);
      const resTodoHistorial = await query('SELECT * FROM historial_rondas WHERE partida_id = $1 ORDER BY ronda_numero DESC', [salaId]);

      io.to(salaId).emit('jugadores_actualizados', resJugadores.rows);
      io.to(salaId).emit('historial_completo_actualizado', resTodoHistorial.rows);

      if (callback) callback({ success: true });
    } catch (error) {
      console.error(error);
      if (callback) callback({ success: false, error: error.message });
    }
  });

  // 8. RECONEXIÓN (Unirse a la sala y recuperar estado)
  socket.on('reunirse_sala', async (data, callback) => {
    try {
      const { salaId, jugadorId } = data;
      if (!salaId) return;
      const salaCode = salaId.toUpperCase();
      
      socket.join(salaCode);

      // Obtener datos actuales de la partida
      const resPartida = await query('SELECT * FROM partidas WHERE id = $1', [salaCode]);
      if (resPartida.rows.length === 0) {
        if (callback) return callback({ success: false, error: 'La partida no existe' });
        return;
      }
      
      const partida = resPartida.rows[0];
      const resJugadores = await query('SELECT * FROM jugadores WHERE partida_id = $1 ORDER BY id ASC', [salaCode]);
      
      // Obtener estado de la ronda actual
      let estadoRonda = [];
      if (partida.estado === 'JUGANDO') {
          const resHistorial = await query('SELECT * FROM historial_rondas WHERE partida_id = $1 AND ronda_numero = $2', [salaCode, partida.ronda_actual]);
          estadoRonda = resHistorial.rows;
      }
      
      if (callback) callback({
        success: true,
        partida,
        jugadores: resJugadores.rows,
        estadoRonda
      });

    } catch (error) {
      console.error(error);
      if (callback) callback({ success: false, error: error.message });
    }
  });

  // 9. REINICIAR PARTIDA EN LA MISMA SALA
  socket.on('reiniciar_partida', async (data, callback) => {
    try {
      const { salaId } = data;
      const salaCode = salaId.toUpperCase();

      // Eliminar definitivamente a los jugadores que abandonaron (inactivos) antes de reiniciar
      await query("DELETE FROM jugadores WHERE partida_id = $1 AND activo = FALSE", [salaCode]);

      // Forzar que todos los jugadores activos estén en el lobby
      await query("UPDATE jugadores SET en_lobby = TRUE WHERE partida_id = $1 AND activo = TRUE", [salaCode]);

      // Resetear estado de la partida a ESPERANDO y ronda a 0
      await query("UPDATE partidas SET estado = 'ESPERANDO', ronda_actual = 0 WHERE id = $1", [salaCode]);

      // Resetear puntos de los jugadores a 0
      await query("UPDATE jugadores SET puntos = 0, en_lobby = TRUE WHERE partida_id = $1", [salaCode]);

      // Eliminar el historial de la sala
      await query("DELETE FROM historial_rondas WHERE partida_id = $1", [salaCode]);

      // Obtener la lista actualizada de jugadores con puntos en 0
      const resJugadores = await query('SELECT * FROM jugadores WHERE partida_id = $1 AND activo = TRUE ORDER BY id ASC', [salaCode]);

      // Emitir a todos que el juego volvió a la sala de espera
      io.to(salaCode).emit('reunirse_sala_response', {
          success: true,
          partida: { estado: 'ESPERANDO', ronda_actual: 0 },
          jugadores: resJugadores.rows,
          estadoRonda: []
      });

      // Reforzar que vuelvan a ESPERANDO enviando actualización de jugadores y estado
      io.to(salaCode).emit('juego_reiniciado', { jugadores: resJugadores.rows });
      
      if (callback) callback({ success: true });
    } catch (error) {
      console.error(error);
      if (callback) callback({ success: false, error: error.message });
    }
  });

  // 10. FINALIZAR PARTIDA ANTICIPADAMENTE
  socket.on('finalizar_partida_anticipadamente', async (data) => {
    try {
      const { salaId } = data;
      const salaCode = salaId.toUpperCase();

      await query("UPDATE partidas SET estado = 'FINALIZADA' WHERE id = $1", [salaCode]);

      // Al finalizar, eliminar inactivos y resetear en_lobby a false para todos los jugadores activos
      await query("DELETE FROM jugadores WHERE partida_id = $1 AND activo = FALSE", [salaCode]);
      await query("UPDATE jugadores SET en_lobby = FALSE WHERE partida_id = $1 AND activo = TRUE", [salaCode]);

      const resJugadores = await query('SELECT * FROM jugadores WHERE partida_id = $1 ORDER BY id ASC', [salaCode]);

      io.to(salaCode).emit('juego_finalizado', { 
        jugadores: resJugadores.rows 
      });

    } catch (error) {
      console.error(error);
    }
  });

  // 11. ABANDONAR PARTIDA / EXPULSAR JUGADOR
  socket.on('abandonar_partida', async (data, callback) => {
      try {
          const { salaId, jugadorId } = data;
          const salaCode = salaId.toUpperCase();
          
          const resJugador = await query('SELECT is_lider FROM jugadores WHERE id = $1 AND partida_id = $2', [jugadorId, salaCode]);
          if (resJugador.rows.length === 0) return;
          
          const isLider = resJugador.rows[0].is_lider;
          
          if (isLider) {
              // Si el capitán abandona, se destruye la partida
              await query("DELETE FROM partidas WHERE id = $1", [salaCode]);
              io.to(salaCode).emit('partida_destruida');
          } else {
              // Si es un jugador normal
              const resPartida = await query('SELECT estado FROM partidas WHERE id = $1', [salaCode]);
              if (resPartida.rows.length === 0) return;
              
              if (resPartida.rows[0].estado === 'ESPERANDO') {
                  // Si están en lobby, se elimina de la BD
                  await query('DELETE FROM jugadores WHERE id = $1', [jugadorId]);
              } else {
                  // Si ya empezó o finalizó, solo se congela
                  await query('UPDATE jugadores SET activo = FALSE WHERE id = $1', [jugadorId]);
              }
              
              const resJugadores = await query('SELECT * FROM jugadores WHERE partida_id = $1 ORDER BY id ASC', [salaCode]);
              io.to(salaCode).emit('jugadores_actualizados', resJugadores.rows);
          }
          if (callback) callback({ success: true });
      } catch (error) {
          console.error(error);
          if (callback) callback({ success: false, error: error.message });
      }
  });

  socket.on('expulsar_jugador', async (data, callback) => {
      try {
          const { salaId, jugadorId } = data;
          const salaCode = salaId.toUpperCase();
          
          // Solo se puede expulsar en ESPERANDO
          await query('DELETE FROM jugadores WHERE id = $1', [jugadorId]);
          
          const resJugadores = await query('SELECT * FROM jugadores WHERE partida_id = $1 ORDER BY id ASC', [salaCode]);
          io.to(salaCode).emit('jugadores_actualizados', resJugadores.rows);
          io.to(salaCode).emit('jugador_expulsado', { jugadorId }); // Enviar el ID del jugador expulsado
          
          if (callback) callback({ success: true });
      } catch (error) {
          console.error(error);
          if (callback) callback({ success: false, error: error.message });
      }
  });

  // 12. VOLVER AL LOBBY
  socket.on('volver_al_lobby', async (data, callback) => {
      try {
          const { salaId, jugadorId } = data;
          const salaCode = salaId.toUpperCase();
          
          // Eliminar a los jugadores inactivos antes de volver al lobby
          await query("DELETE FROM jugadores WHERE partida_id = $1 AND activo = FALSE", [salaCode]);
          
          await query('UPDATE jugadores SET en_lobby = TRUE WHERE id = $1', [jugadorId]);

          // Si el jugador es líder, también pasamos la partida a estado ESPERANDO
          const resJugador = await query('SELECT is_lider FROM jugadores WHERE id = $1', [jugadorId]);
          if (resJugador.rows.length > 0 && resJugador.rows[0].is_lider) {
              await query("UPDATE partidas SET estado = 'ESPERANDO' WHERE id = $1", [salaCode]);
          }
          
          const resJugadores = await query('SELECT * FROM jugadores WHERE partida_id = $1 ORDER BY id ASC', [salaCode]);
          io.to(salaCode).emit('jugadores_actualizados', resJugadores.rows);
          
          if (callback) callback({ success: true });
      } catch (error) {
          console.error(error);
          if (callback) callback({ success: false, error: error.message });
      }
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 4000;

// Inicializar DB y luego arrancar servidor
initDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Servidor Backend corriendo en puerto ${PORT}`);
  });
}).catch(err => {
  console.error("Fallo al arrancar debido a error en BD:", err);
});
