import React, { useState } from 'react';
import InfoNote from './info-note';

const RulesModal = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('poderes');

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
            backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, 
            display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
            <div className="card table-card" style={{ 
                width: '90%', maxWidth: '700px', maxHeight: '90vh', 
                backgroundColor: 'var(--paper)', color: 'var(--ink)',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden', padding: '0'
            }}>
                
                {/* Tabs Header */}
                <div style={{ 
                    display: 'flex', borderBottom: '2px solid #ddd', backgroundColor: '#e8d8b7' 
                }}>
                    <button 
                        style={{
                            flex: 1, padding: '15px', border: 'none', background: activeTab === 'poderes' ? 'var(--paper)' : 'transparent',
                            fontSize: '18px', fontWeight: activeTab === 'poderes' ? 'bold' : 'normal',
                            cursor: 'pointer', outline: 'none', borderRight: '1px solid #ddd'
                        }}
                        onClick={() => setActiveTab('poderes')}
                    >
                        📜 Efectos Pirata
                    </button>
                    <button 
                        style={{
                            flex: 1, padding: '15px', border: 'none', background: activeTab === 'reglas' ? 'var(--paper)' : 'transparent',
                            fontSize: '18px', fontWeight: activeTab === 'reglas' ? 'bold' : 'normal',
                            cursor: 'pointer', outline: 'none'
                        }}
                        onClick={() => setActiveTab('reglas')}
                    >
                        🏴‍☠️ Reglas de Juego
                    </button>
                </div>

                {/* Tabs Content */}
                <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                    {activeTab === 'poderes' && (
                        <div>
                            <InfoNote />
                        </div>
                    )}

                    {activeTab === 'reglas' && (
                        <div style={{ lineHeight: '1.6' }}>
                            <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#8B0000' }}>Cómo Jugar a Skull King</h2>
                            
                            <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>1. La Apuesta</h3>
                            <p>Al inicio de cada ronda, evalúa tus cartas y decide <strong>cuántas manos (bazas) crees que vas a ganar</strong>. Puedes apostar ganar cero (0) bazas o cualquier cantidad. El objetivo no es ganar más bazas, sino <strong>acertar exactamente</strong> a tu apuesta.</p>
                            
                            <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '5px', marginTop: '20px' }}>2. Los Puntos</h3>
                            <ul>
                                <li><strong>✅ Si aciertas tu apuesta:</strong> Ganas puntos. ¡Felicidades, pirata!</li>
                                <li><strong>❌ Si fallas tu apuesta:</strong> Pierdes puntos. Ya sea que ganaste más o menos manos de las que apostaste, se te restarán puntos por cada mano de diferencia.</li>
                            </ul>

                            <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '5px', marginTop: '20px' }}>3. Puntos Extra y Efecto Pirata</h3>
                            <p>Durante la ronda puedes conseguir bonificaciones si capturas cartas especiales (como sirenas o el Skull King). Esos son tus <strong>Puntos Extra</strong>.</p>
                            <p>Los <strong>Efectos Pirata</strong> (que puedes revisar en la otra pestaña) pueden beneficiarte o perjudicarte. Si apuestas y fallas, los efectos mágicos cambian su naturaleza (lo que creías bueno se vuelve malo y viceversa).</p>

                            <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '5px', marginTop: '20px' }}>4. ¡Cuidado con el final!</h3>
                            <p>¡El botín y los riesgos son mayores al final!</p>
                            <ul>
                                <li>En las rondas normales los puntos valen por 1.</li>
                                <li>En la <strong>penúltima ronda</strong> todo vale <strong>el doble (x2)</strong>.</li>
                                <li>En la <strong>última ronda</strong> todo vale <strong>el triple (x3)</strong>.</li>
                            </ul>
                            <p style={{fontStyle: 'italic', textAlign: 'center', marginTop: '15px'}}>Nota: Todos los puntos que veas en la tabla ya están multiplicados x10 para verse más impresionantes.</p>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div style={{ padding: '15px', borderTop: '1px solid #ddd', textAlign: 'center', backgroundColor: 'var(--paper)' }}>
                    <button className="btn-pirate" onClick={onClose} style={{ width: '200px' }}>
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RulesModal;