import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';

const JugadorBoard = ({ socket }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [salaId, setSalaId] = useState(location.state?.salaId || '');
  const [jugador, setJugador] = useState(location.state?.jugador || null);
  
  const [jugadoresEnSala, setJugadoresEnSala] = useState([]);
  const [estadoJuego, setEstadoJuego] = useState('ESPERANDO'); // ESPERANDO, JUGANDO, FINALIZADA
  const [rondaActual, setRondaActual] = useState(0);
  
  const [apuestaHecha, setApuestaHecha] = useState(0);
  const [yaAposto, setYaAposto] = useState(false);
  const [estadoRonda, setEstadoRonda] = useState([]); // Quien ya apostó
  const [historialCompleto, setHistorialCompleto] = useState([]);

  useEffect(() => {
    if (!salaId || !jugador) {
      navigate('/');
      return;
    }

    // Escuchar actualizaciones de la sala
    socket.on('jugadores_actualizados', (listaJugadores) => {
      setJugadoresEnSala(listaJugadores);
      const yo = listaJugadores.find(j => j.id === jugador.id);
      if(yo) setJugador(yo);
    });

    socket.on('juego_iniciado', (data) => {
      setEstadoJuego('JUGANDO');
      setRondaActual(data.rondaActual);
      setYaAposto(false);
      setApuestaHecha(0);
    });

    socket.on('estado_ronda_actualizado', (historialRonda) => {
       setEstadoRonda(historialRonda);
       const miApuesta = historialRonda.find(h => h.jugador_id === jugador.id);
       if(miApuesta && miApuesta.estado_apuesta !== 'PENDIENTE') {
           setYaAposto(true);
           setApuestaHecha(miApuesta.apuesta_hecha);
       }
    });

    socket.on('ronda_avanzada', (data) => {
      setRondaActual(data.rondaActual);
      setJugadoresEnSala(data.jugadores);
      setEstadoRonda(data.estadoRonda);
      setYaAposto(false);
      setApuestaHecha(0);
      const yo = data.jugadores.find(j => j.id === jugador.id);
      if(yo) setJugador(yo);
      
      // Actualizar el historial automáticamente al avanzar de ronda
      cargarHistorialCompleto();
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
  }, [socket, salaId, jugador, navigate]);

  const cargarHistorialCompleto = () => {
    socket.emit('obtener_historial', { salaId }, (res) => {
        if (res.success) {
            setHistorialCompleto(res.historial);
        }
    });
  };

  useEffect(() => {
      if (salaId && estadoJuego !== 'ESPERANDO') {
          cargarHistorialCompleto();
      }
  }, [salaId, estadoJuego]);

  const enviarApuesta = () => {
    socket.emit('enviar_apuesta', {
      salaId,
      jugadorId: jugador.id,
      rondaNumero: rondaActual,
      apuestaHecha: Number.parseInt(apuestaHecha)
    }, (res) => {
        if(res.success) {
            setYaAposto(true);
        }
    });
  };

  if (estadoJuego === 'ESPERANDO') {
    return (
      <div className="card table-card">
        <h2>Esperando al Capitán para iniciar...</h2>
        <p>Sala: <strong>{salaId}</strong></p>
        <h3>Tripulación Actual:</h3>
        <ul>
          {jugadoresEnSala.map(j => (
            <li key={j.id}>{j.nombre} {j.is_lider ? '(Capitán)' : ''}</li>
          ))}
        </ul>
      </div>
    );
  }

  if (estadoJuego === 'FINALIZADA') {
      // Ordenar por puntos
      const ganadores = [...jugadoresEnSala].sort((a,b) => b.puntos - a.puntos);
      return (
          <div className="card table-card" style={{textAlign:'center'}}>
              <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={500} />
              <h2>¡Juego Finalizado!</h2>
              <h3>El ganador es {ganadores[0]?.nombre} con {ganadores[0]?.puntos * 10} puntos</h3>
              <button className="btn-pirate" onClick={() => navigate('/')}>Volver a la Taberna</button>
          </div>
      )
  }

  return (
    <div className="card table-card">
      <div className="table-header">
        <h2>Ronda {rondaActual}</h2>
        <span className="ronda-badge">Mis Puntos: {jugador.puntos * 10}</span>
      </div>

      <div style={{ padding: '20px', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '10px' }}>
        {!yaAposto ? (
          <>
            <h3>¿Cuántas bazas vas a ganar, {jugador.nombre}?</h3>
            <br/>
            <input 
              type="number" 
              className="input-number" 
              min="0" 
              value={apuestaHecha} 
              onChange={(e) => setApuestaHecha(e.target.value)}
              style={{ fontSize: '24px', padding: '10px', width: '100px' }}
            />
            <br/><br/>
            <button className="btn-pirate gold" onClick={enviarApuesta}>Sellar Apuesta</button>
          </>
        ) : (
          <div>
            <h3>Apuesta Sellada: {apuestaHecha} bazas.</h3>
            <p>Esperando que termine la ronda y el capitán capture los resultados...</p>
          </div>
        )}
      </div>

      <h3 style={{ marginTop: '30px' }}>Estado de la Tripulación</h3>
      <table style={{ width: '100%', marginTop: '10px' }}>
        <thead>
          <tr>
            <th>Pirata</th>
            <th>Puntos (x10)</th>
            <th>Estado Ronda</th>
          </tr>
        </thead>
        <tbody>
          {jugadoresEnSala.map(j => {
            const statusRonda = estadoRonda.find(er => er.jugador_id === j.id);
            let textoEstado = "Pensando...";
            if(statusRonda && statusRonda.estado_apuesta === 'APOSTADO') textoEstado = "¡Apostó!";
            if(statusRonda && statusRonda.estado_apuesta === 'CALIFICADO') textoEstado = "Calificado";
            
            return (
              <tr key={j.id}>
                <td>{j.nombre}</td>
                <td style={{textAlign:'center'}}>{j.puntos * 10}</td>
                <td style={{textAlign:'center', color: statusRonda?.estado_apuesta === 'APOSTADO' ? '#4CAF50' : '#FFC107'}}>
                    {textoEstado}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {historialCompleto.length > 0 && (
          <div style={{ marginTop: '40px' }}>
              <h3>Historial de Partida</h3>
              <div className="table-responsive-container">
                <table style={{ width: '100%', marginTop: '10px' }}>
                    <thead>
                        <tr>
                            <th>Ronda</th>
                            <th>Jugador</th>
                            <th>Apuesta</th>
                            <th>Ganadas</th>
                            <th>Extra</th>
                            <th>Efecto</th>
                            <th>Puntos (x10)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {historialCompleto.map((h, i) => {
                            if(h.estado_apuesta !== 'CALIFICADO') return null; // Solo mostrar los calificados

                            const jug = jugadoresEnSala.find(j => j.id === h.jugador_id);
                            const isNewRound = i > 0 && h.ronda_numero !== historialCompleto[i - 1].ronda_numero;
                            const bgColor = h.jugador_id === jugador.id ? 'rgba(255, 215, 0, 0.1)' : 'transparent';
                            const borderTop = isNewRound ? '3px solid #ffd700' : 'none';
                            
                            return (
                                <tr key={i} style={{ backgroundColor: bgColor, borderTop: borderTop }}>
                                    <td>{h.ronda_numero}</td>
                                    <td>{jug ? jug.nombre : h.jugador_id} {h.jugador_id === jugador.id ? '(Tú)' : ''}</td>
                                    <td style={{textAlign:'center'}}>{h.apuesta_hecha}</td>
                                    <td style={{textAlign:'center'}}>{h.apuesta_ganada}</td>
                                    <td style={{textAlign:'center'}}>{h.puntos_extra}</td>
                                    <td style={{textAlign:'center'}}>{h.efecto_pirata}</td>
                                    <td style={{textAlign:'center'}}>{h.puntos_obtenidos * 10}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
              </div>
          </div>
      )}
    </div>
  );
};

export default JugadorBoard;