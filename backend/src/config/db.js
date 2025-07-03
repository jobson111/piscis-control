// backend/src/config/db.js (VERSÃO DE PRODUÇÃO)
const { Pool } = require('pg');
require('dotenv').config(); // Carrega as variáveis de ambiente

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Usa a URL do banco de dados da nuvem
  ssl: {
    rejectUnauthorized: false // Necessário para a conexão na Render/Heroku etc.
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool: pool,
};