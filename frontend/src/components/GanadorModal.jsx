import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import PropTypes from 'prop-types';
import './GanadorModal.css';
import ReactDOM from 'react-dom';

const GanadorModal = ({ ganadores, alCerrar, nuevoJuego }) => {
  useEffect(() => {
    // Efecto de fuegos artificiales al montar el modal
    const duracion = 10000;
    const animacionEnd = Date.now() + duracion;
    const defaults = { startVelocity: 45, spread: 360, ticks: 60, zIndex: 10000 };

    const intervalo = setInterval(() => {
      const tiempoRestante = animacionEnd - Date.now();
      if (tiempoRestante <= 0) return clearInterval(intervalo);

      const particleCount = 80;
      confetti({ ...defaults, particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 } });
    }, 800);

    return () => clearInterval(intervalo);
  }, []);

  const esEmpate = ganadores.length > 1;

  return ReactDOM.createPortal(
    <div className="modal-overlay">
      <div className="modal-content winner-card">
        <h1 className="winner-title">{esEmpate ? "¡EMPATE PIRATA!" : "¡REY PIRATA!"}</h1>
        <div className="winner-names">
          {ganadores.map(g => (
            <div key={g.id} className="winner-name-highlight">
              {g.nombre}
            </div>
          ))}
        </div>
        <p className="winner-score">Con {ganadores[0].puntos * 10} Puntos</p>
        <div className="modal-buttons">
          <button className="btn-pirate gold" onClick={nuevoJuego}>
            Nueva Partida
          </button>
          <button className="btn-pirate" onClick={alCerrar}>
            Ver Resultados
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default GanadorModal;

GanadorModal.propTypes = {
  ganadores: PropTypes.array.isRequired,
  alCerrar: PropTypes.func.isRequired,
  nuevoJuego: PropTypes.func.isRequired
};