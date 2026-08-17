const InfoNote = () => {
    return (
        <div className="card info-note">
            <h3>📜 Pergamino de Poderes</h3>
            <p><span className="p-red">●</span> <strong>Pirata Rojo:</strong> Puedes ver 2 cartas del mazo, e intercambiarlas si te funcionan.</p>
            <p><span className="p-yellow">●</span> <strong>Pirata Amarillo:</strong> Todos juegan una baza más, es decir todos toman una carta del mazo.</p>
            <p><span className="p-green">●</span> <strong>Pirata Verde:</strong> Puedes modificar tu apuesta +1 o -1.</p>
            <p><span className="p-blue">●</span> <strong>Pirata Azul:</strong> Se te permite hacer una segunda apuesta, esto puede ser +-10, +-20 a que si vas a cumplir la primera apuesta que hiciste.</p>
        </div>
    );
}

export default InfoNote;