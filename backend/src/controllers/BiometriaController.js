// backend/src/controllers/BiometriaController.js (VERSÃO COMPLETA E SEGURA)

const db = require('../config/db');

// --- CRIAR uma nova biometria ---
exports.create = async (request, response) => {
    const { pisciculturaId } = request.user;
    const { lote_id, peso_medio_gramas, quantidade_amostra, observacoes } = request.body;

    try {
        const sql = `
            INSERT INTO biometrias (lote_id, piscicultura_id, peso_medio_gramas, quantidade_amostra, observacoes)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const values = [lote_id, pisciculturaId, peso_medio_gramas, quantidade_amostra, observacoes];
        
        const result = await db.query(sql, values);
        
        // Atualiza o peso médio do lote após a biometria
        await db.query(
            'UPDATE lotes SET peso_atual_medio_g = $1 WHERE id = $2 AND piscicultura_id = $3', 
            [peso_medio_gramas, lote_id, pisciculturaId]
        );
        
        return response.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao criar biometria:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// --- LISTAR as biometrias de um lote específico ---
exports.listByLote = async (request, response) => {
    const { pisciculturaId } = request.user;
    const { lote_id } = request.query;

    if (!lote_id) {
        return response.status(400).json({ error: 'É obrigatório fornecer o lote_id.' });
    }

    try {
        // A consulta agora verifica se as biometrias pertencem à piscicultura do usuário
        const result = await db.query(
            'SELECT * FROM biometrias WHERE lote_id = $1 AND piscicultura_id = $2 ORDER BY data_biometria DESC',
            [lote_id, pisciculturaId]
        );
        return response.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao listar biometrias:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// --- DELETAR uma biometria ---
exports.delete = async (request, response) => {
    const { pisciculturaId } = request.user;
    const { id } = request.params; // ID da biometria a ser deletada

    try {
        const result = await db.query(
            'DELETE FROM biometrias WHERE id = $1 AND piscicultura_id = $2',
            [id, pisciculturaId]
        );
        if (result.rowCount === 0) {
            return response.status(404).json({ error: 'Biometria não encontrada ou não pertence à sua piscicultura.' });
        }
        return response.status(204).send();
    } catch (error) {
        console.error('Erro ao deletar biometria:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// --- ATUALIZAR uma biometria ---
exports.update = async (request, response) => {
    const { pisciculturaId } = request.user;
    const { id } = request.params;
    const { peso_medio_gramas, quantidade_amostra, observacoes, data_biometria } = request.body;

    try {
        const sql = `
            UPDATE biometrias 
            SET peso_medio_gramas = $1, quantidade_amostra = $2, observacoes = $3, data_biometria = $4
            WHERE id = $5 AND piscicultura_id = $6
            RETURNING *
        `;
        const values = [peso_medio_gramas, quantidade_amostra, observacoes, data_biometria, id, pisciculturaId];

        const result = await db.query(sql, values);
        if (result.rowCount === 0) {
            return response.status(404).json({ error: 'Biometria não encontrada ou não pertence à sua piscicultura.' });
        }
        
        // Opcional: Re-sincronizar o peso do lote se a biometria mais recente for alterada
        // (Por simplicidade, vamos manter a lógica de atualização do lote apenas na criação por agora)

        return response.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar biometria:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};