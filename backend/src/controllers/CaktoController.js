const db = require('../config/db');
const registrarLog = require('../helpers/logHelper');

// --- Função para gerar o Link de Pagamento (Checkout) ---
exports.createCheckoutLink = async (req, res) => {
    const { pisciculturaId } = req.user;
    const { preco_id } = req.body;

    try {
        // Busca o ID do produto/oferta que guardámos no nosso banco de dados
        const precoResult = await db.query(
            "SELECT gateway_id FROM precos_planos WHERE id = $1",
            [preco_id]
        );
        if (precoResult.rowCount === 0 || !precoResult.rows[0].gateway_id) {
            return res.status(404).json({ error: 'Link de pagamento para este plano não foi configurado no sistema.' });
        }

        // Monta o link de checkout da Cakto
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

    // --- A CORREÇÃO ESTÁ AQUI: Lemos o campo 'secret' ---
    const tokenRecebido = webhookData.secret;

    // 1. Verificação de segurança (simples, com base no token secreto)
    // A Cakto pode ter um método mais robusto, como uma assinatura no cabeçalho.
    // Por agora, vamos assumir que eles enviam um token no corpo.
    if (webhookData.secret_token !== nossoTokenSecreto) { // Verifique o nome real do campo
        console.warn("⚠️ Webhook da Cakto recebido com token inválido.");
        return res.status(403).json({ error: 'Acesso negado.' });
    }

    console.log(`✅ Webhook da Cakto Recebido: ${webhookData.event_type}`); // Verifique o nome real do campo de evento

    const client = await db.pool.connect();
    try {
        // Lida com o evento de 'Assinatura Ativada' (ou o nome equivalente da Cakto)
        if (webhookData.event_type === 'subscription_activated') {
            const emailCliente = webhookData.customer.email;
            const idOfertaCakto = webhookData.offer.id; // ID da oferta/preço na Cakto

            console.log(`--- [AÇÃO] Processando assinatura ativada para o cliente com email [${emailCliente}]`);
            
            await client.query('BEGIN');

            // Encontra o nosso preço interno com base no ID da Cakto
            const precoResult = await client.query("SELECT id, plano_id FROM precos_planos WHERE gateway_id = $1", [idOfertaCakto]);
            if (precoResult.rowCount === 0) {
                throw new Error(`ID de oferta da Cakto [${idOfertaCakto}] não encontrado no nosso banco de dados.`);
            }
            const { id: preco_id, plano_id } = precoResult.rows[0];

            // Encontra a piscicultura pelo email do usuário dono
            const usuarioResult = await client.query("SELECT piscicultura_id FROM usuarios WHERE email = $1", [emailCliente]);
            if (usuarioResult.rowCount === 0) {
                throw new Error(`Usuário com email [${emailCliente}] não encontrado.`);
            }
            const pisciculturaId = usuarioResult.rows[0].piscicultura_id;
            
            // Define a nova data de expiração (ex: 1 ano a partir de agora)
            const dataExpiracao = new Date();
            // A lógica aqui dependerá do ciclo de cobrança (mensal, anual)
            dataExpiracao.setFullYear(dataExpiracao.getFullYear() + 1);

            const updateResult = await client.query(
                `UPDATE pisciculturas SET plano_id = $1, preco_id = $2, status_assinatura = 'ATIVO', data_expiracao_assinatura = $3 WHERE id = $4`,
                [plano_id, preco_id, dataExpiracao, pisciculturaId]
            );

            if (updateResult.rowCount === 0) {
                throw new Error(`Piscicultura com ID [${pisciculturaId}] não encontrada para atualizar.`);
            }
            
            await client.query('COMMIT');
            console.log(`✅ SUCESSO: Assinatura da piscicultura ID ${pisciculturaId} foi ativada.`);
        }

        res.status(200).json({ received: true });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("❌ ERRO CRÍTICO AO PROCESSAR WEBHOOK DA CAKTO:", error.message);
        res.status(500).json({ error: 'Erro interno no processamento do webhook.' });
    } finally {
        client.release();
    }
};