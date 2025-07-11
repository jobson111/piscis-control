// backend/src/controllers/VendaController.js (VERSÃO COM VALIDAÇÃO ROBUSTA)

const db = require('../config/db');

exports.create = async (req, res) => {
    const { pisciculturaId, id: vendedorId } = req.user;
    const { cliente_id, nr_nota_fiscal, data_venda, valor_bruto, valor_desconto, valor_final, observacoes, itens, pagamentos } = req.body;

    if (!cliente_id || !itens || itens.length === 0 || !pagamentos || pagamentos.length === 0) {
        return res.status(400).json({ error: 'Dados da venda, itens e pagamentos são obrigatórios.' });
    }

    const client = await db.pool.connect();

    try {
        // VERIFICAÇÃO DE NOTA FISCAL DUPLICADA (MELHORIA 5)
        if (nr_nota_fiscal) {
            const notaFiscalExistente = await client.query(
                "SELECT id FROM vendas WHERE nr_nota_fiscal = $1 AND piscicultura_id = $2",
                [nr_nota_fiscal, pisciculturaId]
            );
            if (notaFiscalExistente.rowCount > 0) {
                throw new Error(`A Nota Fiscal de número ${nr_nota_fiscal} já foi registada numa outra venda.`);
            }
        }
        
        await client.query('BEGIN');

        // 1. Inserir o "cabeçalho" da venda
        const vendaSql = `INSERT INTO vendas (piscicultura_id, cliente_id, vendedor_id, nr_nota_fiscal, data_venda, valor_bruto, valor_desconto, valor_final, observacoes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id;`;
        const vendaResult = await client.query(vendaSql, [pisciculturaId, cliente_id, vendedorId, nr_nota_fiscal, data_venda, valor_bruto, valor_desconto, valor_final, observacoes]);
        const novaVendaId = vendaResult.rows[0].id;

        // 2. Processar cada ITEM do "carrinho"
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
            
            // ATUALIZAÇÃO DE PESO DO LOTE DE ORIGEM (MELHORIA 3)
            await client.query("UPDATE lotes SET quantidade_atual = $1, status = $2, peso_atual_medio_g = $3 WHERE id = $4", [novaQuantidadeLote, novoStatusLote, pesoMedioGramas, loteIdNum]);

            if (novoStatusLote === 'Vendido') {
                await client.query("UPDATE tanques SET status = 'Vazio' WHERE id = $1", [lote.tanque_id]);
            }
        }

        // 3. Processar cada PAGAMENTO
        for (const pgto of pagamentos) {
            await client.query('INSERT INTO venda_pagamentos (venda_id, forma_pagamento_id, valor) VALUES ($1, $2, $3)', [novaVendaId, parseInt(pgto.forma_pagamento_id, 10), parseFloat(pgto.valor)]);
        }

        await client.query('COMMIT');
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
    try {
        const sql = `SELECT v.*, c.nome as nome_cliente, u.nome as nome_vendedor FROM vendas v
                     LEFT JOIN clientes c ON v.cliente_id = c.id
                     LEFT JOIN usuarios u ON v.vendedor_id = u.id
                     WHERE v.piscicultura_id = $1 ORDER BY v.data_venda DESC, v.id DESC;`;
        const result = await db.query(sql, [pisciculturaId]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao listar vendas:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};