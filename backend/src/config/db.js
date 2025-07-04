// backend/src/config/db.js (VERSÃO FINAL E CORRIGIDA)

const { Pool } = require('pg');
require('dotenv').config();

// 1. Montamos a configuração base da conexão
const connectionConfig = {
  connectionString: process.env.DATABASE_URL,
};

// 2. Verificamos se estamos no ambiente de produção (a Render define esta variável automaticamente)
if (process.env.NODE_ENV === 'production') {
  // Se estivermos em produção, adicionamos a configuração SSL
  connectionConfig.ssl = {
    rejectUnauthorized: false,
  };
}

// 3. Criamos o pool de conexões com a configuração correta para o ambiente
const pool = new Pool(connectionConfig);

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool: pool,
};