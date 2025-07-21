// backend/src/controllers/AssinaturaController.js (VERSÃO REATORADA)

const db = require('../config/db');

// Em backend/src/controllers/AssinaturaController.js
// SUBSTITUA a função 'subscribe'
exports.subscribe = async (req, res) => {
    const { pisciculturaId } = req.user;
    const { preco_id } = req.body;

    if (!preco_id) {
        return res.status(400).json({ error: 'É necessário fornecer um ID de preço.' });
    }
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        const precoResult = await client.query("SELECT plano_id, ciclo_cobranca FROM precos_planos WHERE id = $1 AND ativo = TRUE", [preco_id]);
        if (precoResult.rowCount === 0) throw new Error('Opção de preço não encontrada ou inativa.');
        
        const { plano_id, ciclo_cobranca } = precoResult.rows[0];
        let intervalo;
        if (ciclo_cobranca === 'MENSAL') intervalo = '1 month';
        else if (ciclo_cobranca === 'SEMESTRAL') intervalo = '6 months';
        else if (ciclo_cobranca === 'ANUAL') intervalo = '1 year';
        else throw new Error('Ciclo de cobrança inválido.');

        // ATUALIZAÇÃO: Agora também muda o status para 'ATIVO'
        const sql = `
            UPDATE pisciculturas
            SET plano_id = $1, 
                preco_id = $2, 
                status_assinatura = 'ATIVO',
                data_expiracao_assinatura = NOW() + interval '${intervalo}'
            WHERE id = $3;
        `;
        await client.query(sql, [plano_id, preco_id, pisciculturaId]);

        await client.query('COMMIT');
        res.status(200).json({ success: true, message: 'Assinatura atualizada com sucesso!' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao atualizar assinatura:', error);
        res.status(500).json({ error: error.message || 'Erro interno do servidor.' });
    } finally {
        client.release();
    }
};