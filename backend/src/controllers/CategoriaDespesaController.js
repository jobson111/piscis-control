// backend/src/controllers/CategoriaDespesaController.js (VERSÃO COMPLETA)
const db = require('../config/db');

exports.create = async (req, res) => {
    const { pisciculturaId } = req.user;
    const { nome } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO categorias_de_despesa (piscicultura_id, nome) VALUES ($1, $2) RETURNING *',
            [pisciculturaId, nome]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao criar categoria de despesa:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

exports.list = async (req, res) => {
    const { pisciculturaId } = req.user;
    try {
        const result = await db.query('SELECT * FROM categorias_de_despesa WHERE piscicultura_id = $1 ORDER BY nome', [pisciculturaId]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao listar categorias de despesa:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

// --- NOVA FUNÇÃO ---
exports.update = async (req, res) => {
    const { pisciculturaId } = req.user;
    const { id } = req.params;
    const { nome } = req.body;
    try {
        const result = await db.query(
            'UPDATE categorias_de_despesa SET nome = $1 WHERE id = $2 AND piscicultura_id = $3 RETURNING *',
            [nome, id, pisciculturaId]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: 'Categoria não encontrada.' });
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar categoria:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

// --- NOVA FUNÇÃO ---
exports.delete = async (req, res) => {
    const { pisciculturaId } = req.user;
    const { id } = req.params;
    try {
        const result = await db.query(
            'DELETE FROM categorias_de_despesa WHERE id = $1 AND piscicultura_id = $2',
            [id, pisciculturaId]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: 'Categoria não encontrada.' });
        res.status(204).send();
    } catch (error) {
        console.error('Erro ao deletar categoria:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};