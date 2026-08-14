const { Pool } = require('pg');
require('dotenv').config();

// Configuración dinámica para soportar Supabase y entornos en la nube
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    }
  : {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'skullking',
      password: process.env.DB_PASSWORD || 'postgrespassword',
      port: process.env.DB_PORT || 5432,
    };

const pool = new Pool(poolConfig);

const initDB = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Tabla de Partidas
    await client.query(`
      CREATE TABLE IF NOT EXISTS partidas (
        id VARCHAR(10) PRIMARY KEY,
        estado VARCHAR(20) DEFAULT 'ESPERANDO', -- ESPERANDO, JUGANDO, FINALIZADA
        max_rondas INT DEFAULT 5,
        ronda_actual INT DEFAULT 0,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabla de Jugadores
    await client.query(`
      CREATE TABLE IF NOT EXISTS jugadores (
        id SERIAL PRIMARY KEY,
        partida_id VARCHAR(10) REFERENCES partidas(id) ON DELETE CASCADE,
        nombre VARCHAR(50) NOT NULL,
        puntos INT DEFAULT 0,
        is_lider BOOLEAN DEFAULT FALSE,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(partida_id, nombre)
      );
    `);

    // Tabla de Historial de Rondas y Apuestas Actuales
    // Aquí guardaremos las métricas de la ronda actual y las pasadas.
    await client.query(`
      CREATE TABLE IF NOT EXISTS historial_rondas (
        id SERIAL PRIMARY KEY,
        partida_id VARCHAR(10) REFERENCES partidas(id) ON DELETE CASCADE,
        ronda_numero INT NOT NULL,
        jugador_id INT REFERENCES jugadores(id) ON DELETE CASCADE,
        apuesta_hecha INT DEFAULT 0,
        apuesta_ganada INT DEFAULT 0,
        puntos_extra INT DEFAULT 0,
        efecto_pirata INT DEFAULT 0,
        puntos_obtenidos INT DEFAULT 0,
        estado_apuesta VARCHAR(20) DEFAULT 'PENDIENTE', -- PENDIENTE, APOSTADO, CALIFICADO
        UNIQUE(partida_id, ronda_numero, jugador_id)
      );
    `);

    await client.query('COMMIT');
    console.log('Base de datos inicializada correctamente.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error al inicializar la base de datos:', e);
    throw e;
  } finally {
    client.release();
  }
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  initDB
};