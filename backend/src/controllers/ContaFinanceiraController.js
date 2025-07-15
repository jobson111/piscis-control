// backend/src/controllers/ContaFinanceiraController.js
const db = require('../config/db');

exports.create = async (req, res) => {
    const { pisciculturaId } = req.user;
    const { nome, saldo_inicial } = req.body;
    try {
        // A query agora também preenche o saldo_atual na criação
        const sql = `
            INSERT INTO contas_financeiras (piscicultura_id, nome, saldo_inicial, saldo_atual)
            VALUES ($1, $2, $3, $3) 
            RETURNING *;
        `;
        // Note que usamos $3 duas vezes, para que saldo_atual comece igual ao saldo_inicial
        const values = [pisciculturaId, nome, saldo_inicial || 0];

        const result = await db.query(sql, values);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao criar conta financeira:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

exports.list = async (req, res) => {
    const { pisciculturaId } = req.user;
    try {
        const result = await db.query('SELECT * FROM contas_financeiras WHERE piscicultura_id = $1 ORDER BY nome', [pisciculturaId]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao listar contas financeiras:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

exports.update = async (req, res) => {
    const { pisciculturaId } = req.user;
    const { id } = req.params;
    const { nome, ativo } = req.body;
    try {
        const result = await db.query(
            'UPDATE contas_financeiras SET nome = $1, ativo = $2 WHERE id = $3 AND piscicultura_id = $4 RETURNING *',
            [nome, ativo, id, pisciculturaId]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: 'Conta financeira não encontrada.' });
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar conta financeira:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};