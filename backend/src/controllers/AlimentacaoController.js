// backend/src/controllers/AlimentacaoController.js (VERSÃO COMPLETA E SEGURA)

const db = require('../config/db');

// --- CRIAR um novo registo de alimentação ---


exports.create = async (request, response) => {
    const { pisciculturaId } = request.user;
    // Agora também pegamos o custo_total do corpo da requisição
    const { lote_id, tipo_racao, quantidade_kg, data_alimentacao, custo_total } = request.body;

    try {
        const sql = `
            INSERT INTO registros_alimentacao (lote_id, piscicultura_id, tipo_racao, quantidade_kg, data_alimentacao, custo_total)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const values = [lote_id, pisciculturaId, tipo_racao, quantidade_kg, data_alimentacao || new Date(), custo_total];
        
        const result = await db.query(sql, values);
        return response.status(201).json(result.rows[0]);

    } catch (error) {
        console.error('Erro ao registar alimentação:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// --- LISTAR todos os registos de alimentação de UM lote ---
exports.listByLote = async (request, response) => {
    const { pisciculturaId } = request.user;
    const { lote_id } = request.query;

    if (!lote_id) {
        return response.status(400).json({ error: 'É obrigatório fornecer o lote_id.' });
    }

    try {
        // A consulta agora verifica se os registos pertencem à piscicultura do usuário
        const sql = 'SELECT * FROM registros_alimentacao WHERE lote_id = $1 AND piscicultura_id = $2 ORDER BY data_alimentacao DESC, id DESC';
        const result = await db.query(sql, [lote_id, pisciculturaId]);
        return response.status(200).json(result.rows);

    } catch (error) {
        console.error('Erro ao listar registos de alimentação:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// --- DELETAR um registo de alimentação ---
exports.delete = async (request, response) => {
    const { pisciculturaId } = request.user;
    const { id } = request.params; // ID do registo a ser deletado

    try {
        const result = await db.query(
            'DELETE FROM registros_alimentacao WHERE id = $1 AND piscicultura_id = $2',
            [id, pisciculturaId]
        );
        if (result.rowCount === 0) {
            return response.status(404).json({ error: 'Registo de alimentação não encontrado ou não pertence à sua piscicultura.' });
        }
        return response.status(204).send();
    } catch (error) {
        console.error('Erro ao deletar registo de alimentação:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// --- ATUALIZAR um registo de alimentação ---
exports.update = async (request, response) => {
    const { pisciculturaId } = request.user;
    const { id } = request.params;
    const { tipo_racao, quantidade_kg, data_alimentacao } = request.body;

    try {
        const sql = `
            UPDATE registros_alimentacao 
            SET tipo_racao = $1, quantidade_kg = $2, data_alimentacao = $3
            WHERE id = $4 AND piscicultura_id = $5
            RETURNING *
        `;
        const values = [tipo_racao, quantidade_kg, data_alimentacao, id, pisciculturaId];

        const result = await db.query(sql, values);
        if (result.rowCount === 0) {
            return response.status(404).json({ error: 'Registo de alimentação não encontrado ou não pertence à sua piscicultura.' });
        }
        return response.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar registo de alimentação:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};