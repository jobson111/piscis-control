// backend/src/controllers/RelatorioController.js

const db = require('../config/db');

exports.getEstoqueAtual = async (req, res) => {
    const { pisciculturaId } = req.user;

    try {
        // Esta query busca todos os lotes ativos, junta com os dados do tanque
        // e já calcula a biomassa para cada lote individualmente.
        const sql = `
            SELECT 
                l.id as lote_id,
                l.especie,
                l.quantidade_atual,
                COALESCE(l.peso_atual_medio_g, l.peso_inicial_medio_g) as peso_medio_g,
                (l.quantidade_atual * COALESCE(l.peso_atual_medio_g, l.peso_inicial_medio_g) / 1000) as biomassa_kg,
                l.data_entrada,
                t.nome_identificador as nome_tanque
            FROM lotes l
            JOIN tanques t ON l.tanque_id = t.id
            WHERE l.piscicultura_id = $1 AND l.status = 'Ativo'
            ORDER BY LENGTH(t.nome_identificador), t.nome_identificador;
        `;

        const lotesResult = await db.query(sql, [pisciculturaId]);

        // Calcula os totais para o resumo
        const resumo = lotesResult.rows.reduce((acc, lote) => {
            acc.total_peixes += parseInt(lote.quantidade_atual, 10);
            acc.biomassa_total_kg += parseFloat(lote.biomassa_kg);
            return acc;
        }, {
            total_peixes: 0,
            biomassa_total_kg: 0
        });

        // Formata os totais para 2 casas decimais
        resumo.biomassa_total_kg = parseFloat(resumo.biomassa_total_kg.toFixed(2));
        
        // Monta o objeto de resposta final
        const responseData = {
            detalhes: lotesResult.rows,
            resumo: resumo
        };

        res.status(200).json(responseData);

    } catch (error) {
        console.error("Erro ao gerar relatório de estoque:", error);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
};