// src/controllers/PisciculturaController.js

const db = require('../config/db'); // Importa nossa conexão com o banco

// Controller para CRIAR uma nova piscicultura (Create)
exports.create = async (request, response) => {
    const { nome_fantasia, cnpj } = request.body;

    try {
        const sql = 'INSERT INTO pisciculturas (nome_fantasia, cnpj) VALUES ($1, $2) RETURNING *';
        const values = [nome_fantasia, cnpj];
        
        const result = await db.query(sql, values);
        
        return response.status(201).json(result.rows[0]);

    } catch (error) {
        console.error('Erro ao criar piscicultura:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Controller para LISTAR todas as pisciculturas (Read)
exports.listAll = async (request, response) =>
     {
    try {
        const result = await db.query('SELECT * FROM pisciculturas ORDER BY id ASC');
        return response.status(200).json(result.rows);

    } catch (error) {
        console.error('Erro ao listar pisciculturas:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }

    
};

// Adicione este código NOVO dentro do arquivo PisciculturaController.js

// Controller para BUSCAR uma piscicultura por ID (Read)
exports.getById = async (request, response) => {
    const { id } = request.params; // Pega o ID que vem na URL

    try {
        const result = await db.query('SELECT * FROM pisciculturas WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return response.status(404).json({ error: 'Piscicultura não encontrada' });
        }

        return response.status(200).json(result.rows[0]);

    } catch (error) {
        console.error('Erro ao buscar piscicultura por ID:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Controller para ATUALIZAR uma piscicultura (Update)
exports.update = async (request, response) => {
    const { id } = request.params;
    const { nome_fantasia, cnpj } = request.body;

    try {
        const sql = 'UPDATE pisciculturas SET nome_fantasia = $1, cnpj = $2 WHERE id = $3 RETURNING *';
        const values = [nome_fantasia, cnpj, id];

        const result = await db.query(sql, values);

        if (result.rowCount === 0) {
            return response.status(404).json({ error: 'Piscicultura não encontrada' });
        }

        return response.status(200).json(result.rows[0]);

    } catch (error) {
        console.error('Erro ao atualizar piscicultura:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Controller para DELETAR uma piscicultura (Delete)
exports.delete = async (request, response) => {
    const { id } = request.params;

    try {
        const result = await db.query('DELETE FROM pisciculturas WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return response.status(404).json({ error: 'Piscicultura não encontrada' });
        }

        return response.status(204).send(); // 204 No Content -> sucesso, sem conteúdo na resposta

    } catch (error) {
        console.error('Erro ao deletar piscicultura:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};