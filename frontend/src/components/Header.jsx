import PropTypes from "prop-types";

const Header = ({
  setRondaActual,
  setJuegoIniciado,
  setJugadores,
  jugadores,
  rondaActual,
  maxRondas,
  historialRondas,
  setHistorialRondas,
  nuevoJuego,
}) => {
  

  const siguienteRonda = () => {
    const listos = jugadores.every((j) => j.nombre !== "");
    if (!listos)
      return alert(
        "¡Por las barbas de Neptuno! Todos los piratas deben tener nombre."
      );

    setJuegoIniciado(true);
    if (rondaActual >= maxRondas)
      return alert("¡Tesoro encontrado! El juego ha terminado.");

    // DETERMINAR MULTIPLICADOR DE RONDA
    let multiplicadorRonda = 1;
    const proximaRondaNum = rondaActual + 1;

    if (proximaRondaNum === maxRondas) {
      multiplicadorRonda = 3; // Última ronda
    } else if (proximaRondaNum === maxRondas - 1) {
      multiplicadorRonda = 2; // Penúltima ronda
    }

    const resultadosRonda = jugadores.map((j) => {
      let puntosDeRonda = 0;
      const apuesta = Number.parseInt(j.apuestaHecha || 0);
      const ganada = Number.parseInt(j.apuestaGanada || 0);
      const extra = Number.parseInt(j.puntosExtra || 0);
      const efecto = Number.parseInt(j.efectoPirata || 0);

      // Lógica de apuesta 0
      if (apuesta === ganada) {
        if (apuesta === 0) {
          // Apuesta 0 y gana 0
          puntosDeRonda = 1 + extra;
        } else {
          // Apuesta > 0 y gana lo que apostó
          puntosDeRonda = apuesta + extra;
        }
        puntosDeRonda += efecto;
      } else {
        // CASO: FALLO
        let diferencia = Math.abs(apuesta - ganada);
        puntosDeRonda = -diferencia; // Puntos negativos por la diferencia

        // Si el efecto es negativo (el pirata decía que NO ganaría) y efectivamente NO ganó:
        // Debemos sumar el valor absoluto de ese efecto como premio.
        if (efecto < 0) {
          puntosDeRonda += Math.abs(efecto);
        } else {
          // Si el efecto era positivo (el pirata decía que ganaría) y falló:
          // Se le restan esos puntos extra.
          puntosDeRonda -= efecto;
        }
      }

      // Aplicar multiplicador especial de la ronda (x2 o x3)
      const puntosCalculados = puntosDeRonda * multiplicadorRonda;

      return {
      nombre: j.nombre,
      puntos: j.puntos + puntosCalculados,
      puntosGanados: puntosDeRonda,
      apuesta: j.apuestaHecha,
      ganada: j.apuestaGanada,
      puntosExtra: j.puntosExtra,
      efectoPirata: j.efectoPirata
    };
    });

    // 2. Guardamos esta ronda en el historial sin borrar las anteriores
    setHistorialRondas([...historialRondas, { numero: rondaActual + 1, datos: resultadosRonda }]);
    const jugadoresConPuntosNuevos = jugadores.map(j => {
    const puntosEstaRonda = resultadosRonda.find(r => r.nombre === j.nombre).puntos;
      return {
        ...j,
        puntos: puntosEstaRonda,
        apuestaHecha: 0, // Reiniciamos para la nueva ronda
        apuestaGanada: 0,
        puntosExtra: 0,
        efectoPirata: 0
      };
    });
    setJugadores(jugadoresConPuntosNuevos);
    setRondaActual(proximaRondaNum);
  };
  return (
    <header className="main-header">
      <h1>SKULL KING ⚓</h1>
      <div className="header-buttons">
        <button className="btn-pirate" onClick={nuevoJuego}>
          Nuevo Juego
        </button>
        <button className="btn-pirate gold" onClick={siguienteRonda}>
          Siguiente Ronda
        </button>
      </div>
    </header>
  );
};

export default Header;

Header.propTypes = {
  setRondaActual: PropTypes.func.isRequired,
  setJuegoIniciado: PropTypes.func.isRequired,
  setJugadores: PropTypes.func.isRequired,
  jugadores: PropTypes.array.isRequired,
  rondaActual: PropTypes.number.isRequired,
  maxRondas: PropTypes.number.isRequired,
  historialRondas: PropTypes.array.isRequired,
  setHistorialRondas: PropTypes.func.isRequired,
  nuevoJuego: PropTypes.func.isRequired,
};