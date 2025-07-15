// backend/src/controllers/DashboardController.js (VERSÃO COM CÁLCULO DE VARIAÇÃO)

const db = require('../config/db');

exports.getKpis = async (req, res) => {
    const { pisciculturaId } = req.user;

    try {
        // Agora fazemos 3 consultas em paralelo
        const [kpisGeraisResult, faturamentoResult, diagramaResult] = await Promise.all([
            
            // Query 1: Busca os KPIs gerais (lotes, peixes, biomassa, tanques)
            db.query(`
                WITH LotesAtivos AS (
                    SELECT quantidade_atual, COALESCE(peso_atual_medio_g, peso_inicial_medio_g) as peso_medio_g
                    FROM lotes WHERE piscicultura_id = $1 AND status = 'Ativo'
                ),
                TanquesOcupados AS (
                    SELECT COUNT(DISTINCT t.id) as total, COUNT(DISTINCT l.tanque_id) as ocupados
                    FROM tanques t LEFT JOIN lotes l ON t.id = l.tanque_id AND l.status = 'Ativo'
                    WHERE t.piscicultura_id = $1
                )
                SELECT 
                    (SELECT COUNT(*) FROM LotesAtivos) as lotes_ativos,
                    (SELECT COALESCE(SUM(quantidade_atual), 0) FROM LotesAtivos) as peixes_alojados,
                    (SELECT COALESCE(SUM(quantidade_atual * peso_medio_g / 1000), 0) FROM LotesAtivos) as biomassa_kg,
                    (SELECT total FROM TanquesOcupados) as total_tanques,
                    (SELECT ocupados FROM TanquesOcupados) as tanques_ocupados
            `, [pisciculturaId]),

            // Query 2: Busca o faturamento do mês atual E do mês anterior
            db.query(`
                SELECT
                    COALESCE(SUM(CASE WHEN date_trunc('month', data_venda) = date_trunc('month', CURRENT_DATE) THEN valor_final ELSE 0 END), 0) as faturamento_mes_atual,
                    COALESCE(SUM(CASE WHEN date_trunc('month', data_venda) = date_trunc('month', CURRENT_DATE - interval '1 month') THEN valor_final ELSE 0 END), 0) as faturamento_mes_anterior
                FROM vendas
                WHERE piscicultura_id = $1 AND data_venda >= date_trunc('month', CURRENT_DATE - interval '1 month');
            `, [pisciculturaId]),

            // Query 3: Busca os dados detalhados para o diagrama
            db.query(`
                SELECT t.id, t.nome_identificador, l.id as lote_id, l.especie, l.quantidade_atual,
                       COALESCE(l.peso_atual_medio_g, l.peso_inicial_medio_g) as peso_medio_g
                FROM tanques t
                LEFT JOIN lotes l ON t.id = l.tanque_id AND l.status = 'Ativo'
                WHERE t.piscicultura_id = $1
                ORDER BY LENGTH(t.nome_identificador), t.nome_identificador;
            `, [pisciculturaId])
        ]);

        // --- Lógica para calcular a variação percentual ---
        const { faturamento_mes_atual, faturamento_mes_anterior } = faturamentoResult.rows[0];
        let faturamento_variacao_percentual = 0;
        if (parseFloat(faturamento_mes_anterior) > 0) {
            faturamento_variacao_percentual = ((parseFloat(faturamento_mes_atual) - parseFloat(faturamento_mes_anterior)) / parseFloat(faturamento_mes_anterior)) * 100;
        } else if (parseFloat(faturamento_mes_atual) > 0) {
            faturamento_variacao_percentual = 100; // Se o anterior era 0 e o atual não é, o crescimento é "total"
        }

        // Monta o objeto de resposta final
        const responseData = {
            kpis: {
                lotes_ativos: parseInt(kpisGeraisResult.rows[0].lotes_ativos, 10),
                peixes_alojados: parseInt(kpisGeraisResult.rows[0].peixes_alojados, 10),
                biomassa_total_kg: parseFloat(kpisGeraisResult.rows[0].biomassa_kg).toFixed(2),
                total_tanques: parseInt(kpisGeraisResult.rows[0].total_tanques, 10),
                tanques_ocupados: parseInt(kpisGeraisResult.rows[0].tanques_ocupados, 10),
                faturamento_mes: parseFloat(faturamento_mes_atual).toFixed(2),
                faturamento_variacao_percentual: faturamento_variacao_percentual.toFixed(2)
            },
            diagrama_tanques: diagramaResult.rows
        };
        
        res.status(200).json(responseData);

    } catch (error) {
        console.error("Erro ao buscar dados do dashboard:", error);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
};