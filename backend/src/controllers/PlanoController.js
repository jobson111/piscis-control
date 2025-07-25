// backend/src/controllers/PlanoController.js (VERSÃO REATORADA)

const db = require('../config/db');

// Lista todos os planos ativos com suas opções de preço aninhadas
exports.list = async (req, res) => {
    try {
        // A MUDANÇA ESTÁ DENTRO DO jsonb_build_object
        const sql = `
            SELECT 
                p.id,
                p.nome,
                p.limite_tanques,
                p.limite_usuarios,
                p.permite_relatorios_avancados,
                jsonb_agg(
                    jsonb_build_object(
                        'id', pp.id,
                        'ciclo_cobranca', pp.ciclo_cobranca,
                        'preco', pp.preco,
                        'gateway_price_id', pp.gateway_price_id -- A LINHA QUE FALTAVA
                    ) ORDER BY pp.preco
                ) as precos
            FROM 
                planos p
            JOIN 
                precos_planos pp ON p.id = pp.plano_id
            WHERE 
                p.ativo = TRUE AND pp.ativo = TRUE
            GROUP BY 
                p.id
            ORDER BY 
                (SELECT MIN(pr.preco) FROM precos_planos pr WHERE pr.plano_id = p.id AND pr.ciclo_cobranca = 'MENSAL');
        `;
        const result = await db.query(sql);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao listar planos:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

// As funções de 'create' e 'update' para planos são ações de super-admin
// e por enquanto estão corretas, pois lidam apenas com a tabela 'planos'.
// No futuro, poderíamos torná-las mais complexas para gerir os preços também.
exports.create = async (req, res) => {
    const { nome, limite_tanques, limite_usuarios, permite_relatorios_avancados } = req.body;
    try {
        const sql = `
            INSERT INTO planos (nome, limite_tanques, limite_usuarios, permite_relatorios_avancados)
            VALUES ($1, $2, $3, $4) RETURNING *;
        `;
        const result = await db.query(sql, [nome, limite_tanques, limite_usuarios, permite_relatorios_avancados]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao criar plano:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

exports.update = async (req, res) => {
    const { id } = req.params;
    const { nome, limite_tanques, limite_usuarios, permite_relatorios_avancados, ativo } = req.body;
    try {
        const sql = `
            UPDATE planos SET
                nome = $1, limite_tanques = $2, limite_usuarios = $3,
                permite_relatorios_avancados = $4, ativo = $5
            WHERE id = $6 RETURNING *;
        `;
        // Removido preco_mensal da query
        const result = await db.query(sql, [nome, limite_tanques, limite_usuarios, permite_relatorios_avancados, ativo, id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Plano não encontrado.' });
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar plano:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};