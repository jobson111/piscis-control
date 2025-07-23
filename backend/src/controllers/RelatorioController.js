// backend/src/controllers/RelatorioController.js (VERSÃO FINAL E SEGURA)

const db = require('../config/db');

// A função getEstoqueAtual permanece a mesma
exports.getEstoqueAtual = async (req, res) => {
    const { pisciculturaId } = req.user;
    try {
        const sql = `
            SELECT 
                t.id, t.nome_identificador, t.status as status_tanque, l.id as lote_id, l.especie,
                l.quantidade_atual, COALESCE(l.peso_atual_medio_g, l.peso_inicial_medio_g) as peso_medio_g,
                (l.quantidade_atual * COALESCE(l.peso_atual_medio_g, l.peso_inicial_medio_g) / 1000) as biomassa_kg
            FROM tanques t
            LEFT JOIN lotes l ON t.id = l.tanque_id AND l.status = 'Ativo'
            WHERE t.piscicultura_id = $1
            ORDER BY LENGTH(t.nome_identificador), t.nome_identificador;
        `;
        const lotesResult = await db.query(sql, [pisciculturaId]);
        const resumo = lotesResult.rows.reduce((acc, lote) => {
            if (lote.lote_id) { // Apenas soma se o tanque tiver um lote
                acc.total_peixes += parseInt(lote.quantidade_atual, 10);
                acc.biomassa_total_kg += parseFloat(lote.biomassa_kg);
            }
            return acc;
        }, { total_peixes: 0, biomassa_total_kg: 0 });
        resumo.biomassa_total_kg = parseFloat(resumo.biomassa_total_kg.toFixed(2));
        const responseData = { detalhes: lotesResult.rows, resumo: resumo };
        res.status(200).json(responseData);
    } catch (error) {
        console.error("Erro ao gerar relatório de estoque:", error);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
};

exports.getExtratoTanque = async (req, res) => {
    const { pisciculturaId } = req.user;
    const tanqueId = parseInt(req.params.tanqueId, 10);

    if (isNaN(tanqueId)) {
        return res.status(400).json({ error: 'ID de tanque inválido.' });
    }

    try {
        // A consulta agora seleciona colunas extras para os detalhes
        const sql = `
            SELECT 
                evento_id, tipo, data_evento, descricao, detalhes
            FROM (
                -- Eventos de Entrada de Lote
                SELECT 
                    l.id AS evento_id, 'ENTRADA DE LOTE' as tipo, l.data_entrada as data_evento,
                    'Lote ' || l.id || ' (' || l.especie || ') recebido no tanque.' as descricao,
                    json_build_object(
                        'Quantidade', l.quantidade_inicial,
                        'Peso Médio (g)', l.peso_inicial_medio_g
                    ) as detalhes
                FROM lotes l
                WHERE l.tanque_id = $1 AND l.piscicultura_id = $2 AND l.lote_origem_id IS NULL

                UNION ALL

                -- Eventos de Transferência (Entrada)
                SELECT 
                    l.id AS evento_id, 'TRANSFERÊNCIA (ENTRADA)' as tipo, l.data_entrada as data_evento,
                    'Recebimento do Lote ' || l.id || ' a partir do Lote ' || l.lote_origem_id || '.' as descricao,
                     json_build_object(
                        'Quantidade', l.quantidade_inicial,
                        'Peso Médio (g)', l.peso_inicial_medio_g
                    ) as detalhes
                FROM lotes l
                WHERE l.tanque_id = $1 AND l.piscicultura_id = $2 AND l.lote_origem_id IS NOT NULL

                UNION ALL

                -- Eventos de Alimentação
                SELECT 
                    ra.id AS evento_id, 'ALIMENTAÇÃO' as tipo, ra.data_alimentacao as data_evento,
                    'Fornecido ' || ra.tipo_racao as descricao,
                    json_build_object('Quantidade (kg)', ra.quantidade_kg) as detalhes
                FROM registros_alimentacao ra
                JOIN lotes l ON ra.lote_id = l.id
                WHERE l.tanque_id = $1 AND ra.piscicultura_id = $2

                UNION ALL

                -- Eventos de Biometria
                SELECT
                    b.id AS evento_id, 'BIOMETRIA' as tipo, b.data_biometria as data_evento,
                    'Aferição de peso médio.' as descricao,
                    json_build_object(
                        'Peso Médio (g)', b.peso_medio_gramas,
                        'Amostra (unidades)', b.quantidade_amostra
                    ) as detalhes
                FROM biometrias b
                JOIN lotes l ON b.lote_id = l.id
                WHERE l.tanque_id = $1 AND b.piscicultura_id = $2

                UNION ALL

                -- Eventos de Venda (saída)
                SELECT
                    vi.id AS evento_id, 'VENDA' as tipo, v.data_venda as data_evento,
                    'Venda para o cliente ' || c.nome as descricao,
                    json_build_object('Quantidade (kg)', vi.quantidade_kg) as detalhes
                FROM venda_itens vi
                JOIN vendas v ON vi.venda_id = v.id
                JOIN clientes c ON v.cliente_id = c.id
                JOIN lotes l ON vi.lote_id = l.id
                WHERE l.tanque_id = $1 AND v.piscicultura_id = $2
            ) AS eventos
            ORDER BY data_evento DESC, evento_id DESC;
        `;

        const result = await db.query(sql, [tanqueId, pisciculturaId]);
        res.status(200).json(result.rows);

    } catch (error) {
        console.error("Erro ao gerar extrato do tanque:", error);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
};

exports.getHistoricoTransferencias = async (req, res) => {
    const { pisciculturaId } = req.user;
    // Novos filtros que podemos receber da URL
    const { data_inicio, data_fim, tanque_origem_id, tanque_destino_id } = req.query;

    try {
        let sql = `
            SELECT
                origem.id as lote_origem_id,
                origem.data_saida_real as data_transferencia,
                tanque_origem.nome_identificador as nome_tanque_origem,
                origem.especie,
                jsonb_agg(
                    jsonb_build_object(
                        'lote_destino_id', destino.id,
                        'nome_tanque_destino', tanque_destino.nome_identificador,
                        'quantidade', destino.quantidade_inicial,
                        'peso_medio_g', destino.peso_inicial_medio_g
                    ) ORDER BY tanque_destino.nome_identificador
                ) as destinos
            FROM
                lotes destino
            JOIN
                lotes origem ON destino.lote_origem_id = origem.id
            JOIN
                tanques tanque_origem ON origem.tanque_id = tanque_origem.id
            JOIN
                tanques tanque_destino ON destino.tanque_id = tanque_destino.id
            WHERE
                destino.piscicultura_id = $1 AND origem.status IN ('Transferido', 'Finalizado com Perda')
        `;
        
        const values = [pisciculturaId];
        let paramIndex = 2;

        if (data_inicio) {
            sql += ` AND origem.data_saida_real >= $${paramIndex++}`;
            values.push(data_inicio);
        }
        if (data_fim) {
            sql += ` AND origem.data_saida_real <= $${paramIndex++}`;
            values.push(data_fim);
        }
        if (tanque_origem_id) {
            sql += ` AND origem.tanque_id = $${paramIndex++}`;
            values.push(tanque_origem_id);
        }
        // O filtro por tanque de destino é mais complexo, pois está dentro do array agregado.
        // Vamos deixá-lo para um futuro refinamento se for necessário.

        sql += ` 
            GROUP BY
                origem.id, origem.data_saida_real, tanque_origem.nome_identificador, origem.especie
            ORDER BY
                origem.data_saida_real DESC;
        `;

        const result = await db.query(sql, values);
        res.status(200).json(result.rows);

    } catch (error) {
        console.error("Erro ao gerar relatório de transferências:", error);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
};

exports.getFluxoDeCaixa = async (req, res) => {
    const { pisciculturaId } = req.user;
    // Pega o intervalo de datas da query string da URL
    const { data_inicio, data_fim } = req.query;

    if (!data_inicio || !data_fim) {
        return res.status(400).json({ error: 'É obrigatório fornecer uma data de início e uma data de fim.' });
    }

    try {
        const sql = `
            WITH MovimentacoesPeriodo AS (
                SELECT
                    tipo,
                    valor,
                    COALESCE(cd.nome, 'Receitas de Vendas') as categoria
                FROM movimentacoes_financeiras mf
                LEFT JOIN categorias_de_despesa cd ON mf.categoria_id = cd.id
                WHERE 
                    mf.piscicultura_id = $1 AND 
                    mf.data_movimentacao BETWEEN $2 AND $3
            )
            SELECT
                (SELECT COALESCE(SUM(valor), 0) FROM MovimentacoesPeriodo WHERE tipo = 'RECEITA') as total_receitas,
                (SELECT COALESCE(SUM(valor), 0) FROM MovimentacoesPeriodo WHERE tipo = 'DESPESA') as total_despesas,
                -- Agrupa as despesas por categoria
                jsonb_agg(
                    jsonb_build_object('categoria', categoria, 'total', valor)
                ) FILTER (WHERE tipo = 'DESPESA') as despesas_por_categoria
            FROM MovimentacoesPeriodo;
        `;
        
        // Esta é uma consulta mais complexa que usa CTEs (Common Table Expressions) para organizar a lógica
        const result = await db.query(sql, [pisciculturaId, data_inicio, data_fim]);
        
        // Adicionamos um pequeno ajuste para agregar os valores das categorias
        const reportData = result.rows[0];
        const despesasAgregadas = {};
        if (reportData.despesas_por_categoria) {
            reportData.despesas_por_categoria.forEach(d => {
                despesasAgregadas[d.categoria] = (despesasAgregadas[d.categoria] || 0) + parseFloat(d.total);
            });
        }
        reportData.despesas_por_categoria = Object.entries(despesasAgregadas).map(([categoria, total]) => ({categoria, total}));

        res.status(200).json(reportData);

    } catch (error) {
        console.error("Erro ao gerar relatório de fluxo de caixa:", error);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
};

// --- FUNÇÃO DE DESEMPENHO DE LOTE BLINDADA ---
// SUBSTITUA a sua função 'getDesempenhoLote' por esta
exports.getDesempenhoLote = async (req, res) => {
    const { pisciculturaId } = req.user;
    const loteId = parseInt(req.params.loteId, 10);

    if (isNaN(loteId)) {
        return res.status(400).json({ error: 'ID de lote inválido.' });
    }

    try {
        const [loteResult, alimentacaoResult, vendasResult] = await Promise.all([
            db.query("SELECT * FROM lotes WHERE id = $1 AND piscicultura_id = $2", [loteId, pisciculturaId]),
            db.query("SELECT COALESCE(SUM(quantidade_kg), 0) as total_racao, COALESCE(SUM(custo_total), 0) as custo_racao FROM registros_alimentacao WHERE lote_id = $1 AND piscicultura_id = $2", [loteId, pisciculturaId]),
            
            // --- CONSULTA DE VENDAS CORRIGIDA ---
            db.query(`
                SELECT 
                    COALESCE(SUM(vi.quantidade_kg), 0) as kg_vendidos,
                    COALESCE(SUM(vi.quantidade_kg * vi.preco_por_kg), 0) as receita_total 
                FROM venda_itens vi
                JOIN vendas v ON vi.venda_id = v.id
                WHERE vi.lote_id = $1 AND v.piscicultura_id = $2
            `, [loteId, pisciculturaId])
        ]);

        if (loteResult.rowCount === 0) {
            return res.status(404).json({ error: 'Lote não encontrado ou não pertence à sua piscicultura.' });
        }

        // --- O resto da função continua o mesmo ---
        const lote = loteResult.rows[0];
        const totalRacaoConsumida = parseFloat(alimentacaoResult.rows[0].total_racao);
        const custoTotalRacao = parseFloat(alimentacaoResult.rows[0].custo_racao);
        const totalKgVendidos = parseFloat(vendasResult.rows[0].kg_vendidos);
        const receitaTotalLote = parseFloat(vendasResult.rows[0].receita_total);

        // ... (todos os cálculos que já fizemos)
        const dataEntrada = new Date(lote.data_entrada);
        const dataFinal = lote.data_saida_real ? new Date(lote.data_saida_real) : new Date();
        const diffTime = Math.abs(dataFinal - dataEntrada);
        const diasDeCiclo = diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 1;
        const pesoInicialG = parseFloat(lote.peso_inicial_medio_g) || 0;
        const pesoFinalG = parseFloat(lote.peso_atual_medio_g || lote.peso_inicial_medio_g) || 0;
        const quantidadeInicial = parseInt(lote.quantidade_inicial, 10) || 0;
        const quantidadeAtual = parseInt(lote.quantidade_atual, 10) || 0;
        const biomassaInicialKg = (quantidadeInicial * pesoInicialG) / 1000;
        const biomassaRestanteKg = (quantidadeAtual * pesoFinalG) / 1000;
        const biomassaProduzidaKg = biomassaRestanteKg + totalKgVendidos;
        const ganhoDeBiomassaKg = biomassaProduzidaKg > biomassaInicialKg ? biomassaProduzidaKg - biomassaInicialKg : 0;
        const ganhoPesoIndividualG = pesoFinalG > pesoInicialG ? pesoFinalG - pesoInicialG : 0;
        const gpd = ganhoPesoIndividualG / diasDeCiclo;
        const fcr = ganhoDeBiomassaKg > 0 ? totalRacaoConsumida / ganhoDeBiomassaKg : 0;
        const quantidadePeixesVendida = pesoFinalG > 0 ? Math.round((totalKgVendidos * 1000) / pesoFinalG) : 0;
        const mortalidade = quantidadeInicial - quantidadeAtual - quantidadePeixesVendida;
        const custoPorKgProduzido = ganhoDeBiomassaKg > 0 ? custoTotalRacao / ganhoDeBiomassaKg : 0;
        const lucroBruto = receitaTotalLote - custoTotalRacao;

        const relatorio = {
            lote_id: lote.id,
            especie: lote.especie,
            status: lote.status,
            dias_de_ciclo: diasDeCiclo,
            quantidade_inicial: quantidadeInicial,
            quantidade_atual: quantidadeAtual,
            mortalidade: mortalidade < 0 ? 0 : mortalidade,
            ganho_de_peso_medio_g: ganhoPesoIndividualG.toFixed(2),
            gpd_g_dia: gpd.toFixed(2),
            biomassa_atual_kg: biomassaRestanteKg.toFixed(2),
            total_racao_consumida_kg: totalRacaoConsumida.toFixed(2),
            fcr: fcr.toFixed(2),
            receita_total_bruta: receitaTotalLote.toFixed(2),
            custo_total_racao: custoTotalRacao.toFixed(2),
            custo_por_kg_produzido: custoPorKgProduzido.toFixed(2),
            lucro_bruto: lucroBruto.toFixed(2)
        };

        res.status(200).json(relatorio);

    } catch (error) {
        console.error("Erro ao gerar relatório de desempenho do lote:", error);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
};