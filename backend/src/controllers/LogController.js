// backend/src/controllers/LogController.js (VERSÃO COM FILTROS)

const db = require('../config/db');

exports.list = async (req, res) => {
    const { pisciculturaId } = req.user;
    // Pega os filtros opcionais da query string da URL
    const { usuario_id, data_inicio, data_fim } = req.query;

    try {
        let baseQuery = 'SELECT * FROM logs_de_atividades WHERE piscicultura_id = $1';
        const values = [pisciculturaId];
        let paramIndex = 2;

        // Adiciona os filtros à consulta SQL dinamicamente
        if (usuario_id) {
            baseQuery += ` AND usuario_id = $${paramIndex++}`;
            values.push(usuario_id);
        }
        if (data_inicio) {
            baseQuery += ` AND timestamp >= $${paramIndex++}`;
            values.push(data_inicio);
        }
        if (data_fim) {
            // Adicionamos '23:59:59' para garantir que pegamos o dia inteiro
            baseQuery += ` AND timestamp <= $${paramIndex++}`;
            values.push(`${data_fim} 23:59:59`);
        }

        baseQuery += ' ORDER BY timestamp DESC';

        const result = await db.query(baseQuery, values);
        res.status(200).json(result.rows);
        
    } catch (error) {
        console.error('Erro ao listar logs de atividades:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};