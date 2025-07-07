// backend/src/controllers/TanqueController.js (VERSÃO COMPLETA E SEGURA)

const db = require('../config/db');

// --- LISTAR todos os tanques da piscicultura do usuário logado ---
exports.listByPiscicultura = async (request, response) => {
    // 1. A ÚNICA fonte de verdade é o token do usuário. Ignoramos o que vem da query.
    const { pisciculturaId } = request.user;

    try {
        const sql = `
            SELECT 
                t.*, 
                COUNT(l.id) > 0 as ocupado
            FROM 
                tanques t
            LEFT JOIN 
                lotes l ON t.id = l.tanque_id AND l.status = 'Ativo'
            WHERE 
                t.piscicultura_id = $1 -- 2. A consulta usa o ID seguro.
            GROUP BY 
                t.id
            ORDER BY 
                LENGTH(t.nome_identificador), t.nome_identificador ASC;
        `;
        
        const result = await db.query(sql, [pisciculturaId]); // 3. Passamos o ID seguro para a consulta.
        return response.status(200).json(result.rows);

    } catch (error) {
        console.error('Erro ao listar tanques:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// --- BUSCAR um tanque específico por ID ---
exports.getById = async (request, response) => {
    const { pisciculturaId } = request.user;
    const { id } = request.params;

    try {
        const result = await db.query(
            'SELECT * FROM tanques WHERE id = $1 AND piscicultura_id = $2',
            [id, pisciculturaId]
        );
        if (result.rowCount === 0) {
            return response.status(404).json({ error: 'Tanque não encontrado' });
        }
        return response.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar tanque por ID:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// --- CRIAR um novo tanque ---
exports.create = async (request, response) => {
    const { pisciculturaId } = request.user;
    const { corpo_dagua_id, nome_identificador, tipo, dimensoes, capacidade_estimada_kg } = request.body;
    try {
        const sql = `
            INSERT INTO tanques (piscicultura_id, corpo_dagua_id, nome_identificador, tipo, dimensoes, capacidade_estimada_kg)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
        const values = [pisciculturaId, corpo_dagua_id, nome_identificador, tipo, dimensoes, capacidade_estimada_kg];
        const result = await db.query(sql, values);
        return response.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao criar tanque:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// --- ATUALIZAR um tanque ---
exports.update = async (request, response) => {
    const { pisciculturaId } = request.user;
    const { id } = request.params;
    const { nome_identificador, tipo, dimensoes, capacidade_estimada_kg, status, data_ultima_manutencao, corpo_dagua_id } = request.body;

    try {
        const sql = `
            UPDATE tanques 
            SET nome_identificador = $1, tipo = $2, dimensoes = $3, capacidade_estimada_kg = $4, status = $5, data_ultima_manutencao = $6, corpo_dagua_id = $7
            WHERE id = $8 AND piscicultura_id = $9
            RETURNING *
        `;
        const values = [nome_identificador, tipo, dimensoes, capacidade_estimada_kg, status, data_ultima_manutencao, corpo_dagua_id, id, pisciculturaId];

        const result = await db.query(sql, values);
        if (result.rowCount === 0) {
            return response.status(404).json({ error: 'Tanque não encontrado ou não pertence à sua piscicultura.' });
        }
        return response.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar tanque:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// --- DELETAR um tanque ---
exports.delete = async (request, response) => {
    const { pisciculturaId } = request.user;
    const { id } = request.params;

    try {
        const result = await db.query(
            'DELETE FROM tanques WHERE id = $1 AND piscicultura_id = $2', 
            [id, pisciculturaId]
        );
        if (result.rowCount === 0) {
            return response.status(404).json({ error: 'Tanque não encontrado ou não pertence à sua piscicultura.' });
        }
        return response.status(204).send();
    } catch (error) {
        console.error('Erro ao deletar tanque:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};