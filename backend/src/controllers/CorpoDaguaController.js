// src/controllers/CorpoDaguaController.js
const db = require('../config/db');

exports.create = async (req, res) => {
    const { piscicultura_id, nome, tipo, tamanho_hectares } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO corpos_dagua (piscicultura_id, nome, tipo, tamanho_hectares) VALUES ($1, $2, $3, $4) RETURNING *',
            [piscicultura_id, nome, tipo, tamanho_hectares]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
};

exports.listByPiscicultura = async (req, res) => {
    const { piscicultura_id } = req.query;
    if (!piscicultura_id) {
        return res.status(400).json({ error: 'O piscicultura_id é obrigatório.' });
    }
    try {
        const result = await db.query('SELECT * FROM corpos_dagua WHERE piscicultura_id = $1 ORDER BY nome', [piscicultura_id]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
};
// Funções de Update e Delete podem ser adicionadas aqui seguindo o mesmo padrão, se necessário.