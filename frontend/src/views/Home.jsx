import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = ({ socket }) => {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [salaIdUnirse, setSalaIdUnirse] = useState('');
  const [maxRondas, setMaxRondas] = useState(5);

  const handleCrearPartida = () => {
    if (!nombre.trim()) return alert("Ingresa tu nombre primero.");
    socket.emit('crear_partida', { nombreLider: nombre, maxRondas }, (response) => {
      if (response.success) {
        // Guardamos info básica en local storage (opcional, para persistir recargas)
        localStorage.setItem('jugadorId', response.jugador.id);
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
        localStorage.setItem('jugadorId', response.jugador.id);
        navigate(`/sala/${response.salaId}/jugador`, { state: { salaId: response.salaId, jugador: response.jugador, partida: response.partida, jugadoresEnSala: response.jugadoresEnSala }});
      } else {
        alert(response.error);
      }
    });
  };

  return (
    <div className="card table-card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <h2>Bienvenido a la Taberna</h2>
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
    </div>
  );
};

export default Home;