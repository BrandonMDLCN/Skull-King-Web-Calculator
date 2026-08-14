const InfoNote = () => {
    return (
        <div className="card info-note">
            <h3>📜 Pergamino de Poderes</h3>
            <p><span className="p-red">●</span> <strong>Rojo:</strong> Cambia 2 cartas.</p>
            <p><span className="p-yellow">●</span> <strong>Amarillo:</strong> Todos toman 1 carga.</p>
            <p><span className="p-green">●</span> <strong>Verde:</strong> Apuesta +1 o -1.</p>
            <p><span className="p-blue">●</span> <strong>Azul:</strong> Apuesta Bonus -+(0, 10, 20).</p>
        </div>
    );
}

export default InfoNote;