import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import io from 'socket.io-client';

// Componentes (Se crearán a continuación)
import Home from './views/Home';
import LiderBoard from './views/LiderBoard';
import JugadorBoard from './views/JugadorBoard';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';
const socket = io(backendUrl); // URL de nuestro Backend

function App() {
  return (
    <BrowserRouter>
      <div className="skull-king-theme">
        <header className="main-header">
          <h1>SKULL KING ⚓ MULTIPLAYER</h1>
        </header>
        <div className="game-container">
          <Routes>
            <Route path="/" element={<Home socket={socket} />} />
            <Route path="/sala/:salaId/lider" element={<LiderBoard socket={socket} />} />
            <Route path="/sala/:salaId/jugador" element={<JugadorBoard socket={socket} />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;