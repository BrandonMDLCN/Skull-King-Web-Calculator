import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import io from 'socket.io-client';

// Componentes (Se crearán a continuación)
import Home from './views/Home';
import LiderBoard from './views/LiderBoard';
import JugadorBoard from './views/JugadorBoard';
import React, { useState } from 'react';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';
const socket = io(backendUrl); // URL de nuestro Backend

function App() {
  const [jugador, setJugador] = useState(null);
  const [salaId, setSalaId] = useState('');

  // Función para salir o reiniciar local
  const handleSalirPartida = () => {
    setJugador(null);
    setSalaId('');
    localStorage.removeItem('skullking_jugador');
    localStorage.removeItem('skullking_salaId');
  };

  const handleAbandonarConBackend = () => {
      if (!jugador || !salaId) {
          handleSalirPartida();
          return;
      }
      
      socket.emit('abandonar_partida', { salaId, jugadorId: jugador.id }, (res) => {
          handleSalirPartida();
      });
  };

  return (
    <BrowserRouter>
      <div className="skull-king-theme">
        <div className="game-container">
          <Routes>
            <Route path="/" element={<Home socket={socket} />} />
            <Route path="/sala/:salaId/lider" element={<LiderBoard socket={socket} onAbandonar={handleAbandonarConBackend} />} />
            <Route path="/sala/:salaId/jugador" element={<JugadorBoard socket={socket} onAbandonar={handleAbandonarConBackend} />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;