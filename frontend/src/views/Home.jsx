import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RulesModal from '../components/RulesModal';

const Home = ({ socket }) => {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [salaIdUnirse, setSalaIdUnirse] = useState('');
  const [maxRondas, setMaxRondas] = useState(5);
  const [sesionActiva, setSesionActiva] = useState(null);

  React.useEffect(() => {
    const salaId = sessionStorage.getItem('salaId');
    const jugadorId = sessionStorage.getItem('jugadorId');
    const isLider = sessionStorage.getItem('isLider') === 'true';
    const nombreLocal = sessionStorage.getItem('nombre');

    if (salaId && jugadorId) {
      setSesionActiva({ salaId, jugadorId: Number(jugadorId), isLider, nombre: nombreLocal });
    }
  }, []);

  const handleReconectar = () => {
    if (sesionActiva) {
      socket.emit('reunirse_sala', { salaId: sesionActiva.salaId, jugadorId: sesionActiva.jugadorId }, (res) => {
        if (res.success) {
          const route = sesionActiva.isLider ? `/sala/${sesionActiva.salaId}/lider` : `/sala/${sesionActiva.salaId}/jugador`;
          const jugador = res.jugadores.find(j => j.id === sesionActiva.jugadorId);
          navigate(route, { state: { salaId: sesionActiva.salaId, jugador, partida: res.partida, jugadoresEnSala: res.jugadores }});
        } else {
          alert('La partida ya no existe o ha caducado.');
          sessionStorage.removeItem('salaId');
          sessionStorage.removeItem('jugadorId');
          sessionStorage.removeItem('isLider');
          sessionStorage.removeItem('nombre');
          setSesionActiva(null);
        }
      });
    }
  };

  const handleCrearPartida = () => {
    if (!nombre.trim()) return alert("Ingresa tu nombre primero.");
    socket.emit('crear_partida', { nombreLider: nombre, maxRondas }, (response) => {
      if (response.success) {
        // Guardamos info básica en session storage
        sessionStorage.setItem('jugadorId', response.jugador.id);
        sessionStorage.setItem('salaId', response.salaId);
        sessionStorage.setItem('isLider', 'true');
        sessionStorage.setItem('nombre', response.jugador.nombre);
        navigate(`/sala/${response.salaId}/lider`, { state: { salaId: response.salaId, jugador: response.jugador }});
      } else {
        alert(response.error);
      }
    });
  };

  const handleUnirsePartida = () => {
    if (!nombre.trim()) return alert("Ingresa tu nombre primero.");
    if (!salaIdUnirse.trim()) return alert("Ingresa el código de la sala.");
    
    socket.emit('unirse_partida', { salaId: salaIdUnirse, nombreJugador: nombre }, (response) => {
      if (response.success) {
        sessionStorage.setItem('jugadorId', response.jugador.id);
        sessionStorage.setItem('salaId', response.salaId);
        sessionStorage.setItem('isLider', 'false');
        sessionStorage.setItem('nombre', response.jugador.nombre);
        navigate(`/sala/${response.salaId}/jugador`, { state: { salaId: response.salaId, jugador: response.jugador, partida: response.partida, jugadoresEnSala: response.jugadoresEnSala }});
      } else {
        alert(response.error);
      }
    });
  };

  return (
    <div style={{ width: '100%' }}>
    <header className="main-header">
      <h1>SKULL KING ⚓ MULTIPLAYER</h1>
    </header>
    <div className="card table-card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <div style={{ textAlign: 'right', marginBottom: '10px' }}>
        <button 
          className="btn-pirate blue" 
          style={{ padding: '5px 15px', fontSize: '14px' }}
          onClick={() => setIsRulesModalOpen(true)}
        >
          📖 ¿Cómo jugar?
        </button>
      </div>

      <h2 style={{ marginTop: '0' }}>Bienvenido a la Taberna</h2>
      <br/>
      <div>
        <input 
          type="text" 
          className="input-pirate" 
          placeholder="Tu Nombre Pirata..." 
          value={nombre} 
          onChange={(e) => setNombre(e.target.value)} 
          style={{ width: '80%', marginBottom: '20px' }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '20px' }}>
        {/* SECCIÓN CREAR */}
        <div style={{ border: '1px solid #444', padding: '20px', borderRadius: '10px', width: '45%' }}>
          <h3>Crear Partida</h3>
          <div style={{ marginBottom: '15px' }}>
            <label>
              <input type="radio" value={5} checked={maxRondas === 5} onChange={() => setMaxRondas(5)} /> 5 Rondas
            </label>
            <br/>
            <label>
              <input type="radio" value={10} checked={maxRondas === 10} onChange={() => setMaxRondas(10)} /> 10 Rondas
            </label>
          </div>
          <button className="btn-pirate gold" onClick={handleCrearPartida}>Ser el Capitán</button>
        </div>

        {/* SECCIÓN UNIRSE */}
        <div style={{ border: '1px solid #444', padding: '20px', borderRadius: '10px', width: '45%' }}>
          <h3>Unirse a Partida</h3>
          <input 
            type="text" 
            className="input-pirate" 
            placeholder="Código de Sala" 
            value={salaIdUnirse} 
            onChange={(e) => setSalaIdUnirse(e.target.value.toUpperCase())}
            style={{ width: '100%', marginBottom: '15px', textTransform: 'uppercase' }}
          />
          <button className="btn-pirate" onClick={handleUnirsePartida}>Unirse a Tripulación</button>
        </div>
      </div>

      {sesionActiva && (
        <div style={{ marginTop: '30px', padding: '15px', backgroundColor: 'rgba(0, 0, 0, 0.2)', borderRadius: '10px' }}>
          <h3>Tienes una partida en curso</h3>
          <p>Pirata: <strong>{sesionActiva.nombre}</strong> | Sala: <strong>{sesionActiva.salaId}</strong></p>
          <button className="btn-pirate blue" onClick={handleReconectar}>Volver a la Partida</button>
          <br/>
          <button 
              className="btn-pirate red" 
              style={{ marginTop: '10px' }} 
              onClick={() => {
                  socket.emit('abandonar_partida', { salaId: sesionActiva.salaId, jugadorId: sesionActiva.jugadorId }, () => {
                      sessionStorage.removeItem('salaId');
                      sessionStorage.removeItem('jugadorId');
                      sessionStorage.removeItem('isLider');
                      sessionStorage.removeItem('nombre');
                      setSesionActiva(null);
                  });
              }}>
              Abandonar
          </button>
        </div>
      )}

      <RulesModal isOpen={isRulesModalOpen} onClose={() => setIsRulesModalOpen(false)} />
    </div>
    </div>
  );
};

export default Home;
