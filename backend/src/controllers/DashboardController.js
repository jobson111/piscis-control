// backend/src/controllers/DashboardController.js (VERSÃO COM DADOS PARA O DIAGRAMA)

const db = require('../config/db');

exports.getKpis = async (req, res) => {
    const { pisciculturaId } = req.user;

    try {
        // Agora faremos uma consulta extra para os dados do diagrama
        const [kpisResult, diagramaResult] = await Promise.all([
            
            // Query 1: Busca os KPIs agregados (esta consulta agora é mais otimizada)
            db.query(`
                WITH LotesAtivos AS (
                    SELECT 
                        quantidade_atual,
                        COALESCE(peso_atual_medio_g, peso_inicial_medio_g) as peso_medio_g
                    FROM lotes
                    WHERE piscicultura_id = $1 AND status = 'Ativo'
                ),
                VendasMes AS (
                    SELECT valor_final
                    FROM vendas
                    WHERE piscicultura_id = $1 AND date_trunc('month', data_venda) = date_trunc('month', CURRENT_DATE)
                ),
                TanquesOcupados AS (
                    SELECT 
                        COUNT(DISTINCT t.id) as total,
                        COUNT(DISTINCT l.tanque_id) as ocupados
                    FROM tanques t
                    LEFT JOIN lotes l ON t.id = l.tanque_id AND l.status = 'Ativo'
                    WHERE t.piscicultura_id = $1
                )
                SELECT 
                    (SELECT COUNT(*) FROM LotesAtivos) as lotes_ativos,
                    (SELECT COALESCE(SUM(quantidade_atual), 0) FROM LotesAtivos) as peixes_alojados,
                    (SELECT COALESCE(SUM(quantidade_atual * peso_medio_g / 1000), 0) FROM LotesAtivos) as biomassa_kg,
                    (SELECT COALESCE(SUM(valor_final), 0) FROM VendasMes) as faturamento_mes,
                    (SELECT total FROM TanquesOcupados) as total_tanques,
                    (SELECT ocupados FROM TanquesOcupados) as tanques_ocupados
            `, [pisciculturaId]),

            // Query 2: Busca os dados detalhados para o diagrama
            db.query(`
                SELECT 
                    t.id,
                    t.nome_identificador,
                    t.status as status_tanque,
                    l.id as lote_id,
                    l.especie,
                    l.quantidade_atual,
                    COALESCE(l.peso_atual_medio_g, l.peso_inicial_medio_g) as peso_medio_g
                FROM tanques t
                LEFT JOIN lotes l ON t.id = l.tanque_id AND l.status = 'Ativo'
                WHERE t.piscicultura_id = $1
                ORDER BY LENGTH(t.nome_identificador), t.nome_identificador;
            `, [pisciculturaId])
        ]);

        // Monta o objeto de resposta final
        const responseData = {
            kpis: {
                lotes_ativos: parseInt(kpisResult.rows[0].lotes_ativos, 10),
                peixes_alojados: parseInt(kpisResult.rows[0].peixes_alojados, 10),
                biomassa_total_kg: parseFloat(kpisResult.rows[0].biomassa_kg).toFixed(2),
                total_tanques: parseInt(kpisResult.rows[0].total_tanques, 10),
                tanques_ocupados: parseInt(kpisResult.rows[0].tanques_ocupados, 10),
                faturamento_mes: parseFloat(kpisResult.rows[0].faturamento_mes).toFixed(2)
            },
            diagrama_tanques: diagramaResult.rows
        };
        
        res.status(200).json(responseData);

    } catch (error) {
        console.error("Erro ao buscar dados do dashboard:", error);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
};