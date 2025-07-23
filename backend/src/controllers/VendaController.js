// backend/src/controllers/VendaController.js (VERSÃO COM VALIDAÇÃO ROBUSTA)

const db = require('../config/db');
const registrarLog = require('../helpers/logHelper');


exports.create = async (req, res) => {
    const { pisciculturaId, id: vendedorId, userId, nome: nomeUsuario } = req.user;
    const { cliente_id, nr_nota_fiscal, data_venda, valor_bruto, valor_desconto, valor_final, observacoes, itens, pagamentos } = req.body;

    if (!cliente_id || !itens || !Array.isArray(itens) || itens.length === 0 || !pagamentos || !Array.isArray(pagamentos) || pagamentos.length === 0) {
        return res.status(400).json({ error: 'Dados da venda, itens e pagamentos são obrigatórios.' });
    }

    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Busca o modelo financeiro da piscicultura para decidir o fluxo
        const pisciculturaResult = await client.query('SELECT modelo_financeiro FROM pisciculturas WHERE id = $1', [pisciculturaId]);
        const modeloFinanceiro = pisciculturaResult.rows[0].modelo_financeiro;

        // 2. Define o status de pagamento inicial com base no modelo
        const statusPagamentoInicial = modeloFinanceiro === 'DIRETO' ? 'Pago' : 'Pendente';

        // 3. Verifica a nota fiscal duplicada
        if (nr_nota_fiscal) {
            const notaFiscalExistente = await client.query(
                "SELECT id FROM vendas WHERE nr_nota_fiscal = $1 AND piscicultura_id = $2",
                [nr_nota_fiscal, pisciculturaId]
            );
            if (notaFiscalExistente.rowCount > 0) {
                throw new Error(`A Nota Fiscal de número ${nr_nota_fiscal} já foi registada.`);
            }
        }
        
        // 4. Insere o "cabeçalho" da venda com o status de pagamento correto
        const vendaSql = `
            INSERT INTO vendas (
                piscicultura_id, cliente_id, vendedor_id, nr_nota_fiscal, data_venda, 
                valor_bruto, valor_desconto, valor_final, observacoes, status_pagamento
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id;
        `;
        const vendaResult = await client.query(vendaSql, [
            pisciculturaId, cliente_id, vendedorId, nr_nota_fiscal, data_venda, 
            valor_bruto, valor_desconto, valor_final, observacoes, statusPagamentoInicial
        ]);
        const novaVendaId = vendaResult.rows[0].id;

        // 5. Processa cada ITEM do "carrinho" (baixa de estoque)
        for (const item of itens) {
            const loteIdNum = parseInt(item.lote_id, 10);
            const pesoMedioGramas = parseFloat(item.peso_medio_na_venda_g);
            const quantidadeKgVendida = parseFloat(item.quantidade_kg);

            const loteResult = await client.query("SELECT * FROM lotes WHERE id = $1 AND piscicultura_id = $2 AND status = 'Ativo'", [loteIdNum, pisciculturaId]);
            if (loteResult.rowCount === 0) throw new Error(`Lote ID ${loteIdNum} não está ativo ou não foi encontrado.`);
            
            const lote = loteResult.rows[0];
            const quantidadePeixesVendida = Math.round((quantidadeKgVendida * 1000) / pesoMedioGramas);
            if (quantidadePeixesVendida > lote.quantidade_atual) throw new Error(`Estoque insuficiente no Lote ID ${lote.id}.`);

            await client.query('INSERT INTO venda_itens (venda_id, lote_id, quantidade_kg, preco_por_kg, peso_medio_na_venda_g) VALUES ($1, $2, $3, $4, $5)', [novaVendaId, loteIdNum, quantidadeKgVendida, item.preco_por_kg, pesoMedioGramas]);
            
            const novaQuantidadeLote = lote.quantidade_atual - quantidadePeixesVendida;
            const novoStatusLote = novaQuantidadeLote <= 0 ? 'Vendido' : 'Ativo';
            
            await client.query("UPDATE lotes SET quantidade_atual = $1, status = $2, peso_atual_medio_g = $3 WHERE id = $4", [novaQuantidadeLote, novoStatusLote, pesoMedioGramas, loteIdNum]);

            if (novoStatusLote === 'Vendido') {
                await client.query("UPDATE tanques SET status = 'Vazio' WHERE id = $1", [lote.tanque_id]);
            }
        }

        // 6. Processa cada PAGAMENTO
        for (const pgto of pagamentos) {
            await client.query('INSERT INTO venda_pagamentos (venda_id, forma_pagamento_id, valor) VALUES ($1, $2, $3)', [novaVendaId, parseInt(pgto.forma_pagamento_id, 10), parseFloat(pgto.valor)]);
        }

        // 7. Se for o modelo DIRETO, cria a movimentação financeira automaticamente
        if (modeloFinanceiro === 'DIRETO') {
            const contaCaixaResult = await client.query("SELECT id FROM contas_financeiras WHERE piscicultura_id = $1 AND nome ILIKE '%caixa%' AND ativo = TRUE LIMIT 1", [pisciculturaId]);
            if (contaCaixaResult.rowCount === 0) {
                throw new Error("Nenhuma conta 'Caixa' ativa foi encontrada para o recebimento automático. Por favor, configure uma em 'Contas Financeiras'.");
            }
            const contaCaixaId = contaCaixaResult.rows[0].id;
            
            await client.query(
                `INSERT INTO movimentacoes_financeiras (piscicultura_id, descricao, valor, tipo, data_movimentacao, conta_id, venda_id) VALUES ($1, $2, $3, 'RECEITA', $4, $5, $6)`,
                [pisciculturaId, `Receita da Venda #${novaVendaId}`, valor_final, data_venda, contaCaixaId, novaVendaId]
            );
            await client.query(
                `UPDATE contas_financeiras SET saldo_atual = saldo_atual + $1 WHERE id = $2`,
                [valor_final, contaCaixaId]
            );
        }

        await client.query('COMMIT');

        // --- Registo do Log ---
        await registrarLog(pisciculturaId, userId, nomeUsuario, `Registou a Venda #${novaVendaId} no valor de ${parseFloat(valor_final).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`);

        res.status(201).json({ success: true, message: 'Venda registada com sucesso!', vendaId: novaVendaId });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro na transação de venda:', error.message);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};

// A função 'list' permanece a mesma
exports.list = async (req, res) => {
    const { pisciculturaId } = req.user;
    // Novos filtros que podemos receber da URL
    const { cliente_id, vendedor_id, data_inicio, data_fim, status_pagamento } = req.query;

    try {
        let sql = `
            SELECT 
                v.id, v.nr_venda, v.nr_nota_fiscal, v.data_venda, v.valor_final, 
                v.status_pagamento, v.status_entrega,
                c.nome as nome_cliente, u.nome as nome_vendedor
            FROM vendas v
            LEFT JOIN clientes c ON v.cliente_id = c.id
            LEFT JOIN usuarios u ON v.vendedor_id = u.id
            WHERE v.piscicultura_id = $1
        `;
        
        const values = [pisciculturaId];
        let paramIndex = 2;

        if (cliente_id) { sql += ` AND v.cliente_id = $${paramIndex++}`; values.push(cliente_id); }
        if (vendedor_id) { sql += ` AND v.vendedor_id = $${paramIndex++}`; values.push(vendedor_id); }
        if (data_inicio) { sql += ` AND v.data_venda >= $${paramIndex++}`; values.push(data_inicio); }
        if (data_fim) { sql += ` AND v.data_venda <= $${paramIndex++}`; values.push(data_fim); }
        if (status_pagamento) { sql += ` AND v.status_pagamento = $${paramIndex++}`; values.push(status_pagamento); }

        sql += ` ORDER BY v.data_venda DESC, v.id DESC;`;

        const result = await db.query(sql, values);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao listar vendas:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};