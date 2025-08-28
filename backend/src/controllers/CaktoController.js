// backend/src/controllers/CaktoController.js (VERSÃO FINAL SIMPLIFICADA)

const db = require('../config/db');
// Não precisamos mais do axios nem do registrarLog aqui, por enquanto.

// --- Função para gerar o Link de Pagamento (Checkout) ---
exports.createCheckoutLink = async (req, res) => {
    const { preco_id } = req.body;

    try {
        // Busca o ID da oferta que guardámos no nosso banco de dados
        const precoResult = await db.query(
            "SELECT gateway_id FROM precos_planos WHERE id = $1",
            [preco_id]
        );

        if (precoResult.rowCount === 0 || !precoResult.rows[0].gateway_id) {
            return res.status(404).json({ error: 'Link de pagamento para este plano não foi configurado no sistema.' });
        }

        // Monta o link de checkout da Cakto diretamente
        const checkoutLink = `https://pay.cakto.com.br/${precoResult.rows[0].gateway_id}`;

        res.status(200).json({ checkoutUrl: checkoutLink });

    } catch (error) {
        console.error("Erro ao criar link de checkout da Cakto:", error);
        res.status(500).json({ error: 'Erro ao comunicar com o sistema de pagamento.' });
    }
};


// --- Função para receber e processar os Webhooks da Cakto ---
exports.handleWebhook = async (req, res) => {
    const webhookData = req.body;
    const nossoTokenSecreto = process.env.CAKTO_WEBHOOK_SECRET;

    // 1. Verificação de segurança (lendo o campo 'secret')
    if (webhookData.secret !== nossoTokenSecreto) {
        console.warn("⚠️ Webhook da Cakto recebido com token de segurança inválido.");
        return res.status(403).json({ error: 'Token inválido.' });
    }

    const eventType = webhookData.event;
    console.log(`✅ Webhook da Cakto verificado. Evento: ${eventType}`);

    const client = await db.pool.connect();
    try {
        // Focamos nos eventos que indicam uma assinatura paga
        if (eventType === 'subscription_activated' || eventType === 'sale_approved') {
            const dadosDoEvento = webhookData.data;
            const emailCliente = dadosDoEvento.customer.email;
            const idOfertaCakto = dadosDoEvento.offer.id;

            console.log(`--- [AÇÃO] Processando assinatura para o cliente com email [${emailCliente}]`);
            
            await client.query('BEGIN');

            const usuarioResult = await client.query("SELECT piscicultura_id FROM usuarios WHERE email = $1", [emailCliente]);
            if (usuarioResult.rowCount === 0) throw new Error(`Utilizador com email [${emailCliente}] não foi encontrado no nosso sistema.`);
            
            const pisciculturaId = usuarioResult.rows[0].piscicultura_id;

            const precoResult = await client.query("SELECT id, plano_id, ciclo_cobranca FROM precos_planos WHERE gateway_id = $1", [idOfertaCakto]);
            if (precoResult.rowCount === 0) throw new Error(`ID de oferta da Cakto [${idOfertaCakto}] não encontrado.`);
            
            const { id: preco_id, plano_id, ciclo_cobranca } = precoResult.rows[0];
            let intervalo = ciclo_cobranca === 'ANUAL' ? '1 year' : '1 month';

            const updateResult = await client.query(
                `UPDATE pisciculturas SET plano_id = $1, preco_id = $2, status_assinatura = 'ATIVO', data_expiracao_assinatura = NOW() + interval '${intervalo}' WHERE id = $3`,
                [plano_id, preco_id, pisciculturaId]
            );

            if (updateResult.rowCount === 0) throw new Error(`Piscicultura com ID [${pisciculturaId}] não encontrada para atualizar.`);
            
            await client.query('COMMIT');
            console.log(`✅ SUCESSO: Assinatura da piscicultura ID ${pisciculturaId} foi ativada.`);
        }
        res.status(200).json({ received: true });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("❌ ERRO CRÍTICO AO PROCESSAR WEBHOOK:", error.message);
        res.status(500).json({ error: 'Erro interno no processamento do webhook.' });
    } finally {
        client.release();
    }
};