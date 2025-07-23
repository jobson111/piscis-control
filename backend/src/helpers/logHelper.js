// src/helpers/logHelper.js

const db = require('../config/db');

/**
 * Regista uma nova atividade no log do sistema.
 * @param {number} pisciculturaId - O ID da piscicultura onde a ação ocorreu.
 * @param {number} usuarioId - O ID do usuário que realizou a ação.
 * @param {string} usuarioNome - O nome do usuário que realizou a ação.
 * @param {string} acao - A descrição da ação realizada.
 */
const registrarLog = async (pisciculturaId, usuarioId, usuarioNome, acao) => {
    try {
        const sql = `
            INSERT INTO logs_de_atividades (piscicultura_id, usuario_id, usuario_nome, acao)
            VALUES ($1, $2, $3, $4);
        `;
        await db.query(sql, [pisciculturaId, usuarioId, usuarioNome, acao]);
    } catch (error) {
        // Num sistema real, poderíamos ter um sistema de log de erros mais robusto aqui.
        // Por agora, apenas o exibimos no console do servidor.
        console.error("Falha ao registar log de atividade:", error);
    }
};

module.exports = registrarLog;