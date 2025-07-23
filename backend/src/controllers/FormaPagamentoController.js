// backend/src/controllers/FormaPagamentoController.js
const db = require('../config/db');
const registrarLog = require('../helpers/logHelper'); // Não se esqueça de importar no topo do ficheiro


exports.create = async (req, res) => {
    const { pisciculturaId, userId, nome: nomeUsuario } = req.user;
    const { descricao } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO formas_pagamento (piscicultura_id, descricao) VALUES ($1, $2) RETURNING *',
            [pisciculturaId, descricao]
        );

        const novaFormaPagamento = result.rows[0];
        // 2. Registamos a ação no log com as variáveis corretas e o campo certo
        await registrarLog(
            pisciculturaId, 
            userId, 
            nomeUsuario, 
            `Criou a forma de pagamento '${novaFormaPagamento.descricao}' (ID: ${novaFormaPagamento.id}).`
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

exports.list = async (req, res) => {
    const { pisciculturaId } = req.user;
    try {
        const result = await db.query(
            'SELECT * FROM formas_pagamento WHERE piscicultura_id = $1 AND ativo = TRUE ORDER BY descricao ASC',
            [pisciculturaId]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

exports.update = async (req, res) => {
    const { pisciculturaId, userId, nome: nomeUsuario } = req.user;
    const { id } = req.params;
    const { descricao, ativo } = req.body;
    try {
        const result = await db.query(
            'UPDATE formas_pagamento SET descricao = $1, ativo = $2 WHERE id = $3 AND piscicultura_id = $4 RETURNING *',
            [descricao, ativo, id, pisciculturaId]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: 'Forma de pagamento não encontrada.' });
        res.status(200).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};