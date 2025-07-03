// src/controllers/BiometriaController.js

const db = require('../config/db');

// --- CRIAR um novo registro de biometria (Create) ---
exports.create = async (request, response) => {
    const { lote_id, piscicultura_id, peso_medio_gramas, quantidade_amostra, observacoes } = request.body;

    try {
        const sql = `
            INSERT INTO biometrias (lote_id, piscicultura_id, peso_medio_gramas, quantidade_amostra, observacoes)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const values = [lote_id, piscicultura_id, peso_medio_gramas, quantidade_amostra, observacoes];
        
        const result = await db.query(sql, values);
        
        // **IMPORTANTE:** Após uma nova biometria, atualizamos o peso atual do lote!
        await db.query('UPDATE lotes SET peso_atual_medio_g = $1 WHERE id = $2', [peso_medio_gramas, lote_id]);
        
        return response.status(201).json(result.rows[0]);

    } catch (error) {
        console.error('Erro ao criar biometria:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// --- LISTAR todas as biometrias de UM lote (Read) ---
exports.listByLote = async (request, response) => {
    // Ex: /biometrias?lote_id=1
    const { lote_id } = request.query;

    if (!lote_id) {
        return response.status(400).json({ error: 'O lote_id é obrigatório.' });
    }

    try {
        const sql = 'SELECT * FROM biometrias WHERE lote_id = $1 ORDER BY data_biometria DESC';
        const result = await db.query(sql, [lote_id]);
        return response.status(200).json(result.rows);

    } catch (error) {
        console.error('Erro ao listar biometrias:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// --- DELETAR um registro de biometria (Delete) ---
// Útil para corrigir um lançamento errado.
exports.delete = async (request, response) => {
    const { id } = request.params;

    try {
        const result = await db.query('DELETE FROM biometrias WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return response.status(404).json({ error: 'Registro de biometria não encontrado' });
        }

        return response.status(204).send();

    } catch (error) {
        console.error('Erro ao deletar biometria:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};