// src/controllers/AlimentacaoController.js

const db = require('../config/db');

// --- CRIAR um novo registro de alimentação ---
exports.create = async (request, response) => {
    const { lote_id, piscicultura_id, tipo_racao, quantidade_kg } = request.body;

    try {
        const sql = `
            INSERT INTO registros_alimentacao (lote_id, piscicultura_id, tipo_racao, quantidade_kg)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const values = [lote_id, piscicultura_id, tipo_racao, quantidade_kg];
        
        const result = await db.query(sql, values);
        return response.status(201).json(result.rows[0]);

    } catch (error) {
        console.error('Erro ao registrar alimentação:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// --- LISTAR todos os registros de alimentação de UM lote ---
exports.listByLote = async (request, response) => {
    const { lote_id } = request.query;

    if (!lote_id) {
        return response.status(400).json({ error: 'O lote_id é obrigatório.' });
    }

    try {
        const sql = 'SELECT * FROM registros_alimentacao WHERE lote_id = $1 ORDER BY data_alimentacao DESC, id DESC';
        const result = await db.query(sql, [lote_id]);
        return response.status(200).json(result.rows);

    } catch (error) {
        console.error('Erro ao listar registros de alimentação:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// --- DELETAR um registro de alimentação ---
exports.delete = async (request, response) => {
    const { id } = request.params;
    try {
        const result = await db.query('DELETE FROM registros_alimentacao WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return response.status(404).json({ error: 'Registro de alimentação não encontrado' });
        }
        return response.status(204).send();
    } catch (error) {
        console.error('Erro ao deletar registro de alimentação:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};