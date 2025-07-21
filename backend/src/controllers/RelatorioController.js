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


// --- FUNÇÃO DE DESEMPENHO DE LOTE BLINDADA ---
// Em backend/src/controllers/RelatorioController.js
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