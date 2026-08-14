import PropTypes from "prop-types";

const JugadorRow = ({ j, actualizarJugador, esUltimo }) => {

    // Función para saltar a la celda de abajo
  const manejarTabVertical = (e) => {
    // Verificamos si es la tecla TAB y NO se está pulsando Shift
    if (e.key === "Tab" && !e.shiftKey) {
      const actual = e.target;
      const filaActual = actual.closest("tr");
      const siguienteFila = filaActual.nextElementSibling;

      if (siguienteFila) {
        e.preventDefault(); // Detenemos el salto a la derecha
        // Buscamos el input en la misma posición (celda) dentro de la siguiente fila
        const indexCelda = actual.closest("td").cellIndex;
        const inputSiguiente = siguienteFila.cells[indexCelda].querySelector("input");
        
        if (inputSiguiente) {
          inputSiguiente.focus();
          inputSiguiente.select(); // De paso lo seleccionamos
        }
      }
    }
  };

  
  return (
    <tr key={j.id}>
      <td>
        <input
          type="text"
          className="input-pirate"
          placeholder="Nombre"
          value={j.nombre}
          autoFocus={esUltimo}
          onKeyDown={manejarTabVertical}
          onChange={(e) => actualizarJugador(j.id, "nombre", e.target.value)}
        />
      </td>


      <td className="score-cell">{j.puntos * 10}</td>


      <td className="control-apuesta">
        <div className="control-container">
          {/* Botón de Restar */}
          <button
            className="btn-control"
            tabIndex="-1"
            onClick={() => {
              const actual = Number.parseInt(j.apuestaHecha || 0);
              if (actual > 0) actualizarJugador(j.id, "apuestaHecha", actual - 1);
            }}
          > - </button>

          <input
            type="number"
            className="input-number"
            min="0"
            step="1"
            value={j.apuestaHecha}
            onFocus={(e) => e.target.select()}
            onKeyDown={manejarTabVertical}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || (/^\d+$/.test(val) && Number.parseInt(val) >= 0)) {
                actualizarJugador(j.id, "apuestaHecha", val);
              }
            }}
          />

          {/* Botón de Sumar */}
          <button
            className="btn-control"
            tabIndex="-1"
            onClick={() => {
              const actual = Number.parseInt(j.apuestaHecha || 0);
              actualizarJugador(j.id, "apuestaHecha", actual + 1);
            }}
          > + </button>
        </div>
      </td>


      <td className="control-ganadas">
        <div className="control-container">
          {/* Botón de Restar */}
          <button
            className="btn-control"
            tabIndex="-1"
            onClick={() => {
              const actual = Number.parseInt(j.apuestaGanada || 0);
              if (actual > 0) actualizarJugador(j.id, "apuestaGanada", actual - 1);
            }}
          > - </button>

          <input
            type="number"
            className="input-number"
            min="0"
            step="1"
            value={j.apuestaGanada}
            onFocus={(e) => e.target.select()}
            onKeyDown={manejarTabVertical}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || (/^\d+$/.test(val) && Number.parseInt(val) >= 0)) {
                actualizarJugador(j.id, "apuestaGanada", val);
              }
            }}
          />

          {/* Botón de Sumar */}
          <button
            className="btn-control"
            tabIndex="-1"
            onClick={() => {
              const actual = Number.parseInt(j.apuestaGanada || 0);
              actualizarJugador(j.id, "apuestaGanada", actual + 1);
            }}
          > + </button>
        </div>
      </td>


      <td className="control-extras">
        <div className="control-container">
          {/* Botón de Restar */}
          <button
            className="btn-control"
            tabIndex="-1"
            onClick={() => {
              const actual = Number.parseInt(j.puntosExtra || 0);
              if (actual > 0) {
                actualizarJugador(j.id, "puntosExtra", actual - 1);
              }
            }}
          > - </button>

          <input
            type="number"
            className="input-number"
            min="0"
            step="1"
            value={j.puntosExtra}
            onFocus={(e) => e.target.select()}
            onKeyDown={manejarTabVertical}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || (/^\d+$/.test(val) && Number.parseInt(val) >= 0)) {
                actualizarJugador(j.id, "puntosExtra", val);
              }
            }}
          />

          {/* Botón de Sumar */}
          <button
            className="btn-control"
            tabIndex="-1"
            onClick={() => {
              const actual = Number.parseInt(j.puntosExtra || 0);
              actualizarJugador(j.id, "puntosExtra", actual + 1);
            }}
          > + </button>
        </div>
        
      </td>
      <td className="control-pirata">
        <div className="control-container">
          {/* Botón de Restar */}
          <button
            className="btn-control"
            tabIndex="-1"
            onClick={() => {
              const actual = Number.parseInt(j.efectoPirata || 0);
              if (actual > -2) {
                actualizarJugador(j.id, "efectoPirata", actual - 1);
              }
            }}
          > - </button>

          <input
            type="number"
            className="input-number"
            min="-2"
            max="2"
            step="1"
            value={j.efectoPirata}
            onFocus={(e) => e.target.select()}
            onKeyDown={manejarTabVertical}
            onChange={(e) =>
              actualizarJugador(j.id, "efectoPirata", e.target.value)
            }
          />
          {/* Botón de Sumar */}
          <button
            className="btn-control"
            tabIndex="-1"
            onClick={() => {
              const actual = Number.parseInt(j.efectoPirata || 0);
              actualizarJugador(j.id, "efectoPirata", actual + 1);
            }}
          > + </button>
        </div>
      </td>
    </tr>
  );
};

export default JugadorRow;

JugadorRow.propTypes = {
  j: PropTypes.object.isRequired,
  actualizarJugador: PropTypes.func.isRequired,
  esUltimo: PropTypes.bool.isRequired
};
