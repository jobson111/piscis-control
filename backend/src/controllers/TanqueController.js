// src/controllers/TanqueController.js

const db = require('../config/db');

// --- CRIAR um novo tanque (versão atualizada) ---
exports.create = async (request, response) => {
    // Adicionamos corpo_dagua_id (que pode ser null)
    const { piscicultura_id, nome_identificador, tipo, dimensoes, capacidade_estimada_kg, tipo_malha, tamanho_malha_mm, localizacao_linha, localizacao_posicao, corpo_dagua_id } = request.body;

    try {
        const sql = `
            INSERT INTO tanques (piscicultura_id, nome_identificador, tipo, dimensoes, capacidade_estimada_kg, tipo_malha, tamanho_malha_mm, localizacao_linha, localizacao_posicao, corpo_dagua_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;
        const values = [piscicultura_id, nome_identificador, tipo, dimensoes, capacidade_estimada_kg, tipo_malha, tamanho_malha_mm, localizacao_linha, localizacao_posicao, corpo_dagua_id];
        
        const result = await db.query(sql, values);
        return response.status(201).json(result.rows[0]);

    } catch (error) {
        console.error('Erro ao criar tanque:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Adicione esta função ao TanqueController.js
exports.getById = async (request, response) => {
    const { id } = request.params;
    try {
        const result = await db.query('SELECT * FROM tanques WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return response.status(404).json({ error: 'Tanque não encontrado' });
        }
        return response.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar tanque por ID:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// --- LISTAR todos os tanques de UMA piscicultura (Read) ---
// Vamos listar os tanques filtrando pela piscicultura
exports.listByPiscicultura = async (request, response) => {
    // O ID da piscicultura virá como um "query parameter" na URL
    // Ex: /tanques?piscicultura_id=1
    const { piscicultura_id } = request.query;

    if (!piscicultura_id) {
        return response.status(400).json({ error: 'O piscicultura_id é obrigatório.' });
    }

    try {
        const result = await db.query('SELECT * FROM tanques WHERE piscicultura_id = $1 ORDER BY nome_identificador ASC', [piscicultura_id]);
        return response.status(200).json(result.rows);

    } catch (error) {
        console.error('Erro ao listar tanques:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// --- ATUALIZAR um tanque (versão atualizada) ---
exports.update = async (request, response) => {
    const { id } = request.params;
    // Adicionamos corpo_dagua_id
    const { nome_identificador, tipo, dimensoes, capacidade_estimada_kg, status, data_ultima_manutencao, corpo_dagua_id } = request.body;

    try {
        const sql = `
            UPDATE tanques 
            SET nome_identificador = $1, tipo = $2, dimensoes = $3, capacidade_estimada_kg = $4, status = $5, data_ultima_manutencao = $6, corpo_dagua_id = $7
            WHERE id = $8
            RETURNING *
        `;
        const values = [nome_identificador, tipo, dimensoes, capacidade_estimada_kg, status, data_ultima_manutencao, corpo_dagua_id, id];

        const result = await db.query(sql, values);

        if (result.rowCount === 0) {
            return response.status(404).json({ error: 'Tanque não encontrado' });
        }

        return response.status(200).json(result.rows[0]);

    } catch (error) {
        console.error('Erro ao atualizar tanque:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};


// --- DELETAR um tanque (Delete) ---
exports.delete = async (request, response) => {
    const { id } = request.params;

    try {
        const result = await db.query('DELETE FROM tanques WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return response.status(404).json({ error: 'Tanque não encontrado' });
        }

        return response.status(204).send();

    } catch (error) {
        console.error('Erro ao deletar tanque:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};