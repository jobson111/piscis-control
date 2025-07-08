// backend/src/controllers/QualidadeAguaController.js (VERSÃO COMPLETA E SEGURA)

const db = require('../config/db');

// --- CRIAR um novo registo ---
exports.create = async (request, response) => {
    const { pisciculturaId } = request.user;
    const { tanque_id, corpo_dagua_id, ph, temperatura_celsius, oxigenio_dissolvido_mg_l, observacoes } = request.body;

    if ((!tanque_id && !corpo_dagua_id) || (tanque_id && corpo_dagua_id)) {
        return response.status(400).json({ error: 'Forneça `tanque_id` OU `corpo_dagua_id`, mas não ambos.' });
    }
    try {
        let sql, values;
        const commonValues = [pisciculturaId, ph, temperatura_celsius, oxigenio_dissolvido_mg_l, observacoes];

        if (tanque_id) {
            sql = `INSERT INTO registros_qualidade_agua (tanque_id, piscicultura_id, ph, temperatura_celsius, oxigenio_dissolvido_mg_l, observacoes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
            values = [tanque_id, ...commonValues];
        } else {
            sql = `INSERT INTO registros_qualidade_agua (corpo_dagua_id, piscicultura_id, ph, temperatura_celsius, oxigenio_dissolvido_mg_l, observacoes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
            values = [corpo_dagua_id, ...commonValues];
        }
        const result = await db.query(sql, values);
        return response.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao registar qualidade da água:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// --- LISTAR registos (lógica de segurança adicionada) ---
exports.list = async (request, response) => {
    const { pisciculturaId } = request.user;
    const { tanque_id, corpo_dagua_id } = request.query;

    if (!tanque_id && !corpo_dagua_id) {
        return response.status(400).json({ error: 'Forneça um `tanque_id` ou `corpo_dagua_id` para filtrar.' });
    }

    try {
        let sql, values;
        if (tanque_id) {
            // Agora a consulta também verifica o pisciculturaId
            sql = 'SELECT * FROM registros_qualidade_agua WHERE tanque_id = $1 AND piscicultura_id = $2 ORDER BY data_medicao DESC';
            values = [tanque_id, pisciculturaId];
        } else {
            // E aqui também
            sql = 'SELECT * FROM registros_qualidade_agua WHERE corpo_dagua_id = $1 AND piscicultura_id = $2 ORDER BY data_medicao DESC';
            values = [corpo_dagua_id, pisciculturaId];
        }
        const result = await db.query(sql, values);
        return response.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao listar registos de qualidade da água:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};
//  ----  ATUALIZAR QUALIDADE DA AGUA
exports.update = async (request, response) => {
    const { pisciculturaId } = request.user;
    const { id } = request.params; // ID do registo a ser atualizado
    const { ph, temperatura_celsius, oxigenio_dissolvido_mg_l, data_medicao } = request.body;

    try {
        const sql = `
            UPDATE registros_qualidade_agua 
            SET ph = $1, temperatura_celsius = $2, oxigenio_dissolvido_mg_l = $3, data_medicao = $4
            WHERE id = $5 AND piscicultura_id = $6
            RETURNING *
        `;
        const values = [ph, temperatura_celsius, oxigenio_dissolvido_mg_l, data_medicao, id, pisciculturaId];

        const result = await db.query(sql, values);
        if (result.rowCount === 0) {
            return response.status(404).json({ error: 'Registo não encontrado ou não pertence à sua piscicultura.' });
        }
        return response.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar registo de qualidade da água:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// --- DELETAR um registo (lógica de segurança adicionada) ---
exports.delete = async (request, response) => {
    const { pisciculturaId } = request.user;
    const { id } = request.params;

    try {
        // Agora só apaga se o ID do registo e o ID da piscicultura corresponderem
        const result = await db.query(
            'DELETE FROM registros_qualidade_agua WHERE id = $1 AND piscicultura_id = $2',
            [id, pisciculturaId]
        );
        if (result.rowCount === 0) {
            return response.status(404).json({ error: 'Registo de qualidade da água não encontrado ou não pertence à sua piscicultura.' });
        }
        return response.status(204).send();
    } catch (error) {
        console.error('Erro ao deletar registo de qualidade da água:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};