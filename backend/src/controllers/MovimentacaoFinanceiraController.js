// backend/src/controllers/MovimentacaoFinanceiraController.js (VERSÃO COMPLETA)

const db = require('../config/db');
const registrarLog = require('../helpers/logHelper'); // Importe a ferramenta de log


// --- LISTAR TODAS AS MOVIMENTAÇÕES (EXTRATO) ---
exports.list = async (req, res) => {
    const { pisciculturaId } = req.user;
    try {
        // A MUDANÇA ESTÁ NA CLÁUSULA ORDER BY NO FINAL DA QUERY
        const sql = `
            SELECT 
                mf.id, mf.descricao, mf.valor, mf.tipo, mf.data_movimentacao,
                cf_origem.nome as nome_conta_origem,
                cf_destino.nome as nome_conta_destino,
                cd.nome as nome_categoria
            FROM movimentacoes_financeiras mf
            JOIN contas_financeiras cf_origem ON mf.conta_id = cf_origem.id
            LEFT JOIN contas_financeiras cf_destino ON mf.conta_destino_id = cf_destino.id
            LEFT JOIN categorias_de_despesa cd ON mf.categoria_id = cd.id
            WHERE mf.piscicultura_id = $1
            ORDER BY mf.data_movimentacao DESC, mf.id DESC;
        `;
        const result = await db.query(sql, [pisciculturaId]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Erro ao listar movimentações:", error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

// --- CRIAR UMA NOVA DESPESA ---
exports.createDespesa = async (req, res) => {
    const { pisciculturaId, userId, nome: nomeUsuario } = req.user;
    const { conta_id, categoria_id, valor, descricao, data_movimentacao } = req.body;

    if (!conta_id || !valor || !data_movimentacao || !descricao) {
        return res.status(400).json({ error: "Conta de origem, valor, descrição e data são obrigatórios." });
    }

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        // Insere o registo da despesa
        await client.query(`INSERT INTO movimentacoes_financeiras (piscicultura_id, descricao, valor, tipo, data_movimentacao, conta_id, categoria_id) VALUES ($1, $2, $3, 'DESPESA', $4, $5, $6)`, [pisciculturaId, descricao, valor, data_movimentacao, conta_id, categoria_id]);
        // Subtrai o valor do saldo da conta
        await client.query(`UPDATE contas_financeiras SET saldo_atual = saldo_atual - $1 WHERE id = $2 AND piscicultura_id = $3`, [valor, conta_id, pisciculturaId]);
        
        await client.query('COMMIT');
        // --- REGISTO DO LOG ---
        await registrarLog(
            pisciculturaId,
            userId,
            nomeUsuario,
            `Registou uma Despesa de ${parseFloat(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} com a descrição: '${descricao}'.`
        );

        res.status(201).json({ success: true, message: 'Despesa registada com sucesso!' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Erro ao registar despesa:", error);
        res.status(500).json({ error: error.message || 'Erro interno do servidor.' });
    } finally {
        client.release();
    }
};

// --- NOVA FUNÇÃO: CRIAR UMA NOVA RECEITA ---
exports.createReceita = async (req, res) => {
    const { pisciculturaId, userId, nome: nomeUsuario } = req.user;
    const { conta_id, valor, descricao, data_movimentacao } = req.body;

    if (!conta_id || !valor || !data_movimentacao || !descricao) {
        return res.status(400).json({ error: "Conta de destino, valor, descrição e data são obrigatórios." });
    }

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        // Insere o registo da receita
        await client.query(`INSERT INTO movimentacoes_financeiras (piscicultura_id, descricao, valor, tipo, data_movimentacao, conta_id) VALUES ($1, $2, $3, 'RECEITA', $4, $5)`, [pisciculturaId, descricao, valor, data_movimentacao, conta_id]);
        // Adiciona o valor ao saldo da conta
        await client.query(`UPDATE contas_financeiras SET saldo_atual = saldo_atual + $1 WHERE id = $2 AND piscicultura_id = $3`, [valor, conta_id, pisciculturaId]);
        
        await client.query('COMMIT');
        // --- REGISTO DO LOG ---
        await registrarLog(
            pisciculturaId,
            userId,
            nomeUsuario,
            `Registou uma Receita de ${parseFloat(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} com a descrição: '${descricao}'.`
        );

        res.status(201).json({ success: true, message: 'Receita registada com sucesso!' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Erro ao registar receita:", error);
        res.status(500).json({ error: error.message || 'Erro interno do servidor.' });
    } finally {
        client.release();
    }
};

// --- NOVA FUNÇÃO: CRIAR UMA TRANSFERÊNCIA ENTRE CONTAS ---
exports.createTransferencia = async (req, res) => {
    const { pisciculturaId, userId, nome: nomeUsuario } = req.user;
    const { conta_origem_id, conta_destino_id, valor, descricao, data_movimentacao } = req.body;

    if (!conta_origem_id || !conta_destino_id || !valor || !data_movimentacao) {
        return res.status(400).json({ error: "Conta de origem, conta de destino, valor e data são obrigatórios." });
    }
    if (conta_origem_id === conta_destino_id) {
        return res.status(400).json({ error: "A conta de origem e destino não podem ser as mesmas." });
    }

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        // Insere o registo da transferência
        const desc = `Transferência: ${descricao || 'Entre contas'}`;
        await client.query(`INSERT INTO movimentacoes_financeiras (piscicultura_id, descricao, valor, tipo, data_movimentacao, conta_id, conta_destino_id) VALUES ($1, $2, $3, 'TRANSFERENCIA', $4, $5, $6)`, [pisciculturaId, desc, valor, data_movimentacao, conta_origem_id, conta_destino_id]);
        
        // Subtrai o valor da conta de origem
        await client.query(`UPDATE contas_financeiras SET saldo_atual = saldo_atual - $1 WHERE id = $2 AND piscicultura_id = $3`, [valor, conta_origem_id, pisciculturaId]);
        // Adiciona o valor à conta de destino
        await client.query(`UPDATE contas_financeiras SET saldo_atual = saldo_atual + $1 WHERE id = $2 AND piscicultura_id = $3`, [valor, conta_destino_id, pisciculturaId]);

        await client.query('COMMIT');
        // --- REGISTO DO LOG ---
        await registrarLog(
            pisciculturaId,
            userId,
            nomeUsuario,
            `Realizou uma Transferência de ${parseFloat(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}. Descrição: '${desc}'.`
        );
        
        res.status(201).json({ success: true, message: 'Transferência realizada com sucesso!' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Erro ao registar transferência:", error);
        res.status(500).json({ error: error.message || 'Erro interno do servidor.' });
    } finally {
        client.release();
    }
};