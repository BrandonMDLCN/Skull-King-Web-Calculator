import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';
import RulesModal from '../components/RulesModal';

const LiderBoard = ({ socket }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [salaId] = useState(location.state?.salaId || '');
  const [jugador] = useState(location.state?.jugador || null);
  const [maxRondas, setMaxRondas] = useState(5); // Lo dejaremos estático al principio o lo traeremos de DB
  
  const [jugadoresEnSala, setJugadoresEnSala] = useState([]);
  const [estadoJuego, setEstadoJuego] = useState('ESPERANDO');
  const [rondaActual, setRondaActual] = useState(0);
  const [estadoRonda, setEstadoRonda] = useState([]);

  // Variables temporales para la captura de resultados
  const [capturaResultados, setCapturaResultados] = useState({});
  const [miApuestaHecha, setMiApuestaHecha] = useState(0);
  const [yoYaAposte, setYoYaAposte] = useState(false);
  const [historialCompleto, setHistorialCompleto] = useState([]);
  const [modalHistorialOpen, setModalHistorialOpen] = useState(false);
  const [editandoHistorial, setEditandoHistorial] = useState(null);
  const [modalGanadorAbierto, setModalGanadorAbierto] = useState(true);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  useEffect(() => {
    if (!salaId || !jugador) {
      navigate('/');
      return;
    }

    socket.on('jugadores_actualizados', (listaJugadores) => {
      setJugadoresEnSala(listaJugadores);
    });

    socket.on('juego_iniciado', (data) => {
      setEstadoJuego('JUGANDO');
      setRondaActual(data.rondaActual);
      if (data.maxRondas) setMaxRondas(data.maxRondas);
      inicializarCaptura(jugadoresEnSala);
    });

    socket.on('estado_ronda_actualizado', (historialRonda) => {
      setEstadoRonda(historialRonda);
      
      // Actualizar la captura con las apuestas que van llegando
      setCapturaResultados(prev => {
          const nuevaCaptura = { ...prev };
          historialRonda.forEach(hr => {
              if (nuevaCaptura[hr.jugador_id] && hr.estado_apuesta !== 'PENDIENTE') {
                  nuevaCaptura[hr.jugador_id].apuestaHecha = hr.apuesta_hecha;
              }
          });
          return nuevaCaptura;
      });
      
      // Verificar si yo (líder) ya aposté en esta ronda
      const miEstado = historialRonda.find(hr => hr.jugador_id === jugador.id);
      if (miEstado && miEstado.estado_apuesta !== 'PENDIENTE') {
          setYoYaAposte(true);
          setMiApuestaHecha(miEstado.apuesta_hecha);
      }
    });

    socket.on('ronda_avanzada', (data) => {
      setRondaActual(data.rondaActual);
      if (data.maxRondas) setMaxRondas(data.maxRondas);
      setJugadoresEnSala(data.jugadores);
      setEstadoRonda(data.estadoRonda);
      inicializarCaptura(data.jugadores);
      setYoYaAposte(false);
      setMiApuestaHecha(0);
    });

    socket.on('juego_finalizado', (data) => {
      setEstadoJuego('FINALIZADA');
      setJugadoresEnSala(data.jugadores);
    });

    socket.on('historial_completo_actualizado', (historial) => {
      setHistorialCompleto(historial);
    });

    return () => {
      socket.off('jugadores_actualizados');
      socket.off('juego_iniciado');
      socket.off('estado_ronda_actualizado');
      socket.off('ronda_avanzada');
      socket.off('juego_finalizado');
      socket.off('historial_completo_actualizado');
    };
  }, [socket, salaId, jugador, navigate, jugadoresEnSala]);

  const cargarHistorialCompleto = () => {
    socket.emit('obtener_historial', { salaId }, (res) => {
        if (res.success) {
            setHistorialCompleto(res.historial);
            setModalHistorialOpen(true);
        }
    });
  };

  const inicializarCaptura = (jugadores) => {
      const inicial = {};
      jugadores.forEach(j => {
          inicial[j.id] = {
              apuestaHecha: 0,
              apuestaGanada: 0,
              puntosExtra: 0,
              efectoPirata: 0
          };
      });
      setCapturaResultados(inicial);
  };

  const iniciarJuego = () => {
    // Definimos maxRondas leyendo de location state si estuviera, por ahora default 5
    socket.emit('iniciar_juego', { salaId });
  };

  const enviarMiApuesta = () => {
    socket.emit('enviar_apuesta', {
      salaId,
      jugadorId: jugador.id,
      rondaNumero: rondaActual,
      apuestaHecha: Number.parseInt(miApuestaHecha)
    }, (res) => {
        if(res.success) {
            setYoYaAposte(true);
        }
    });
  };

  const manejarCambioCaptura = (jugadorId, campo, valor) => {
      let numVal = Number.parseInt(valor);
      if (isNaN(numVal)) numVal = 0;
      setCapturaResultados(prev => ({
          ...prev,
          [jugadorId]: {
              ...prev[jugadorId],
              [campo]: numVal
          }
      }));
  };

  const renderControlesCaptura = (jugadorId, campo, valor, min = -Infinity, max = Infinity) => (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
          <button className="btn-pirate" style={{ padding: '2px 8px', minWidth: '30px', fontSize: '16px' }} onClick={() => manejarCambioCaptura(jugadorId, campo, Math.max(min, valor - 1))}>-</button>
          <input 
              type="number" 
              className="input-number" 
              min={min} 
              max={max}
              value={valor} 
              onChange={(e) => manejarCambioCaptura(jugadorId, campo, e.target.value)} 
              style={{ width: '50px', textAlign: 'center', padding: '5px' }} 
          />
          <button className="btn-pirate" style={{ padding: '2px 8px', minWidth: '30px', fontSize: '16px' }} onClick={() => manejarCambioCaptura(jugadorId, campo, Math.min(max, valor + 1))}>+</button>
      </div>
  );

  const calcularPuntosRonda = (apuesta, ganada, extra, efecto, rondaNum) => {
    let puntosDeRonda = 0;
    
    // Multiplicador
    let multiplicadorRonda = 1;
    if (rondaNum === maxRondas) multiplicadorRonda = 3;
    else if (rondaNum === maxRondas - 1) multiplicadorRonda = 2;

    if (apuesta === ganada) {
      if (apuesta === 0) puntosDeRonda = 1 + extra;
      else puntosDeRonda = apuesta + extra;
      puntosDeRonda += efecto;
    } else {
      let diferencia = Math.abs(apuesta - ganada);
      puntosDeRonda = -diferencia;
      
      if (efecto < 0) puntosDeRonda += Math.abs(efecto);
      else puntosDeRonda -= efecto;
    }

    return puntosDeRonda * multiplicadorRonda;
  };

  const calificarRonda = () => {
    // Validar que todos hayan apostado
    const todosApostaron = jugadoresEnSala.every(j => {
        const estado = estadoRonda.find(er => er.jugador_id === j.id);
        return estado && estado.estado_apuesta !== 'PENDIENTE';
    });

    if (!todosApostaron) {
        return alert("¡Aún hay piratas que no han sellado su apuesta!");
    }

    // Armar el payload de resultados
    const resultados = jugadoresEnSala.map(j => {
        const cap = capturaResultados[j.id];
        const puntosCalculados = calcularPuntosRonda(
            cap.apuestaHecha, cap.apuestaGanada, cap.puntosExtra, cap.efectoPirata, rondaActual
        );

        return {
            jugadorId: j.id,
            apuestaHecha: cap.apuestaHecha,
            apuestaGanada: cap.apuestaGanada,
            puntosExtra: cap.puntosExtra,
            efectoPirata: cap.efectoPirata,
            puntosCalculados
        };
    });

    socket.emit('calificar_ronda', {
        salaId,
        rondaNumero: rondaActual,
        resultados,
        maxRondas
    }, (res) => {
        if(!res.success) alert(res.error);
    });
  };

  const guardarEdicionHistorial = () => {
      const { ronda_numero, jugador_id, apuesta_hecha, apuesta_ganada, puntos_extra, efecto_pirata } = editandoHistorial;
      
      const puntosCalculados = calcularPuntosRonda(
          Number.parseInt(apuesta_hecha),
          Number.parseInt(apuesta_ganada),
          Number.parseInt(puntos_extra),
          Number.parseInt(efecto_pirata),
          ronda_numero
      );

      socket.emit('editar_ronda_pasada', {
          salaId,
          rondaNumero: ronda_numero,
          jugadorId: jugador_id,
          apuestaHecha: Number.parseInt(apuesta_hecha),
          apuestaGanada: Number.parseInt(apuesta_ganada),
          puntosExtra: Number.parseInt(puntos_extra),
          efectoPirata: Number.parseInt(efecto_pirata),
          puntosCalculados
      }, (res) => {
          if (res.success) {
              setEditandoHistorial(null);
          } else {
              alert(res.error);
          }
      });
  };

  if (estadoJuego === 'ESPERANDO') {
    return (
      <div className="card table-card">
        <h2>Sala de Espera - Eres el Capitán</h2>
        <p>Código para unirse: <strong style={{fontSize:'24px', color: 'var(--pirate-red)'}}>{salaId}</strong></p>
        
        <h3>Tripulación en Sala:</h3>
        <ul>
          {jugadoresEnSala.map(j => <li key={j.id}>{j.nombre} {j.is_lider ? '(Tú)' : ''}</li>)}
        </ul>

        {jugadoresEnSala.length > 0 && (
          <button className="btn-pirate gold" onClick={iniciarJuego} style={{marginTop:'20px'}}>
            ¡Levar Anclas! (Iniciar)
          </button>
        )}
      </div>
    );
  }

  if (estadoJuego === 'FINALIZADA') {
    const clasificacion = [...jugadoresEnSala].sort((a,b) => b.puntos - a.puntos);
    const maxPuntos = clasificacion[0]?.puntos;
    const empatados = clasificacion.filter(j => j.puntos === maxPuntos);

    return (
        <div className="card table-card" style={{textAlign:'center'}}>
            {modalGanadorAbierto && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
                    backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, 
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={500} />
                    <div className="card table-card" style={{ width: '90%', maxWidth: '500px', backgroundColor: 'var(--paper)', color: 'var(--ink)' }}>
                        <h2>¡Juego Finalizado!</h2>
                        {empatados.length > 1 ? (
                            <>
                                <h3>⚔️ ¡Tenemos un empate! ⚔️</h3>
                                <h4>Los ganadores son:</h4>
                                {empatados.map(emp => <h3 key={emp.id}>🏆 <strong>{emp.nombre}</strong> con {emp.puntos * 10} puntos</h3>)}
                            </>
                        ) : (
                            <h3>🏆 El ganador es <strong>{clasificacion[0]?.nombre}</strong> con {clasificacion[0]?.puntos * 10} puntos 🏆</h3>
                        )}
                        <button className="btn-pirate gold" style={{marginTop:'20px'}} onClick={() => setModalGanadorAbierto(false)}>Ver Resultados</button>
                    </div>
                </div>
            )}
            
            <h2>Tabla Final de Puntuaciones</h2>
            <div className="table-responsive-container">
                <table style={{ margin: '0 auto', maxWidth: '600px', marginBottom: '20px' }}>
                    <thead>
                        <tr>
                            <th>Posición</th>
                            <th>Pirata</th>
                            <th>Puntos Totales</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clasificacion.map((j, index) => (
                            <tr key={j.id}>
                                <td>{index + 1}</td>
                                <td>{j.nombre} {empatados.find(e => e.id === j.id) ? '👑' : ''}</td>
                                <td><strong>{j.puntos * 10}</strong></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <button className="btn-pirate" onClick={() => navigate('/')}>Volver a la Taberna</button>
        </div>
    )
  }

  const todosApostaron = estadoJuego === 'JUGANDO' && jugadoresEnSala.every(j => {
      const estado = estadoRonda.find(er => er.jugador_id === j.id);
      return estado && estado.estado_apuesta !== 'PENDIENTE';
  });

  return (
    <div className="card table-card" style={{ width: '100%' }}>
      <div className="table-header">
        <h2>Panel del Capitán - Ronda {rondaActual}</h2>
        <div>
          <button className="btn-pirate blue" onClick={() => setIsRulesModalOpen(true)} style={{marginRight: '10px'}}>📜 Reglas y Poderes</button>
          <button className="btn-pirate" onClick={cargarHistorialCompleto} style={{marginRight: '10px'}}>Historial</button>
          <button className="btn-pirate gold" onClick={calificarRonda}>Calificar y Avanzar</button>
        </div>
      </div>
      
      {rondaActual === maxRondas - 1 && <div className="multiplicador-aviso animar">¡Atención! En esta ronda los puntos valen x2</div>}
      {rondaActual === maxRondas && <div className="multiplicador-aviso animar">¡Atención! En esta última ronda los puntos valen x3</div>}

      {!yoYaAposte && (
          <div style={{ padding: '20px', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '10px', marginBottom: '20px' }}>
              <h3>Capitán, ¿Cuántas bazas vas a ganar?</h3>
              <input 
                type="number" 
                className="input-number" 
                min="0" 
                value={miApuestaHecha} 
                onChange={(e) => setMiApuestaHecha(e.target.value)}
                style={{ fontSize: '24px', padding: '10px', width: '100px', marginRight: '15px' }}
              />
              <button className="btn-pirate gold" onClick={enviarMiApuesta}>Sellar mi Apuesta</button>
          </div>
      )}

      <div className="table-responsive-container">
        <table>
          <thead>
            <tr>
              <th>Pirata</th>
              <th>Puntos Totales</th>
              <th>Apuesta</th>
              <th>Ganadas</th>
              <th>Extra</th>
              <th>Efecto</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {jugadoresEnSala.map(j => {
                const statusRonda = estadoRonda.find(er => er.jugador_id === j.id);
                const cap = capturaResultados[j.id] || { apuestaHecha:0, apuestaGanada:0, puntosExtra:0, efectoPirata:0 };
                
                return (
                  <tr key={j.id}>
                    <td>{j.nombre}</td>
                    <td>{j.puntos * 10}</td>
                    
                    <td style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>
                        {statusRonda?.estado_apuesta !== 'PENDIENTE' 
                            ? (todosApostaron ? statusRonda?.apuesta_hecha : '❓') 
                            : '-'}
                    </td>
                    
                    <td>
                        {renderControlesCaptura(j.id, 'apuestaGanada', cap.apuestaGanada, 0)}
                    </td>
                    
                    <td>
                        {renderControlesCaptura(j.id, 'puntosExtra', cap.puntosExtra, 0)}
                    </td>

                    <td>
                        {renderControlesCaptura(j.id, 'efectoPirata', cap.efectoPirata, -2, 2)}
                    </td>

                    <td style={{ color: statusRonda?.estado_apuesta === 'APOSTADO' ? '#4CAF50' : '#FFC107' }}>
                        {statusRonda?.estado_apuesta === 'APOSTADO' ? 'Listo' : 'Pensando'}
                    </td>
                  </tr>
                );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL HISTORIAL Y EDICIÓN */}
      {modalHistorialOpen && (
          <div style={{
              position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
              backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, 
              display: 'flex', justifyContent: 'center', alignItems: 'center'
          }}>
              <div className="card table-card" style={{ width: '90%', maxWidth: '800px', maxHeight: '80%', overflowY: 'auto' }}>
                  <div className="table-header">
                      <h2>Historial de Rondas</h2>
                      <button className="btn-pirate" onClick={() => setModalHistorialOpen(false)}>Cerrar</button>
                  </div>
                  
                  {editandoHistorial ? (
                      <div style={{ padding: '20px', border: '1px solid #ffd700', borderRadius: '10px', marginBottom: '20px' }}>
                          <h3>Editando Ronda {editandoHistorial.ronda_numero} - Jugador ID: {editandoHistorial.jugador_id}</h3>
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                              <div>
                                  <label>Apuesta:</label><br/>
                                  <input type="number" className="input-number" value={editandoHistorial.apuesta_hecha} onChange={e => setEditandoHistorial({...editandoHistorial, apuesta_hecha: e.target.value})} />
                              </div>
                              {editandoHistorial.estado_apuesta === 'CALIFICADO' && (
                                <>
                                  <div>
                                      <label>Ganadas:</label><br/>
                                      <input type="number" className="input-number" value={editandoHistorial.apuesta_ganada} onChange={e => setEditandoHistorial({...editandoHistorial, apuesta_ganada: e.target.value})} />
                                  </div>
                                  <div>
                                      <label>Extra:</label><br/>
                                      <input type="number" className="input-number" value={editandoHistorial.puntos_extra} onChange={e => setEditandoHistorial({...editandoHistorial, puntos_extra: e.target.value})} />
                                  </div>
                                  <div>
                                      <label>Efecto:</label><br/>
                                      <input type="number" className="input-number" value={editandoHistorial.efecto_pirata} onChange={e => setEditandoHistorial({...editandoHistorial, efecto_pirata: e.target.value})} />
                                  </div>
                                </>
                              )}
                          </div>
                          <div style={{ marginTop: '20px' }}>
                              <button className="btn-pirate gold" onClick={guardarEdicionHistorial} style={{marginRight:'10px'}}>Guardar Cambios</button>
                              <button className="btn-pirate" onClick={() => setEditandoHistorial(null)}>Cancelar</button>
                          </div>
                      </div>
                  ) : null}

                  <div className="table-responsive-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Ronda</th>
                                <th>Jugador</th>
                                <th>Apuesta</th>
                                <th>Ganadas</th>
                                <th>Extra</th>
                                <th>Efecto</th>
                                <th>Puntos</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historialCompleto.map((h, i) => {
                                const jug = jugadoresEnSala.find(j => j.id === h.jugador_id);
                                const isNewRound = i > 0 && h.ronda_numero !== historialCompleto[i - 1].ronda_numero;
                                const rowStyle = isNewRound ? { borderTop: '3px solid #ffd700' } : {};
                                return (
                                    <tr key={i} style={rowStyle}>
                                        <td>{h.ronda_numero}</td>
                                        <td>{jug ? `${jug.nombre} (${jug.puntos * 10} pts)` : h.jugador_id}</td>
                                        <td>{h.estado_apuesta !== 'PENDIENTE' ? h.apuesta_hecha : '-'}</td>
                                        <td>{h.estado_apuesta === 'CALIFICADO' ? h.apuesta_ganada : '-'}</td>
                                        <td>{h.estado_apuesta === 'CALIFICADO' ? h.puntos_extra : '-'}</td>
                                        <td>{h.estado_apuesta === 'CALIFICADO' ? h.efecto_pirata : '-'}</td>
                                        <td>{h.estado_apuesta === 'CALIFICADO' ? h.puntos_obtenidos * 10 : '-'}</td>
                                        <td>
                                            {h.estado_apuesta !== 'PENDIENTE' && (
                                                <button className="btn-pirate" style={{padding: '5px'}} onClick={() => setEditandoHistorial(h)}>Editar</button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                  </div>
              </div>
          </div>
      )}

      <RulesModal isOpen={isRulesModalOpen} onClose={() => setIsRulesModalOpen(false)} />
    </div>
  );
};

export default LiderBoard;
