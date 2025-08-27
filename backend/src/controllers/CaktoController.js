// backend/src/controllers/CaktoController.js

const db = require('../config/db');
const registrarLog = require('../helpers/logHelper');

// --- Função para gerar o Link de Pagamento (Checkout) ---
// NOTA: A API da Cakto para criar um checkout dinâmico não é publicamente documentada da mesma forma que a da Stripe.
// A abordagem mais comum é gerar o link manualmente ou usar a estrutura que eles fornecem.
// Por agora, esta função irá buscar o link que você PODE ter cadastrado no seu produto na Cakto.
// Se a Cakto tiver uma API para gerar links dinâmicos, esta lógica será expandida.
exports.createCheckoutLink = async (req, res) => {
    const { pisciculturaId } = req.user;
    const { preco_id } = req.body; // Recebemos o ID do nosso preço interno

    try {
        // Buscamos o ID do produto/oferta que guardámos no nosso banco de dados
        const precoResult = await db.query(
            "SELECT gateway_id FROM precos_planos WHERE id = $1",
            [preco_id]
        );
        if (precoResult.rowCount === 0 || !precoResult.rows[0].gateway_id) {
            return res.status(404).json({ error: 'Link de pagamento para este plano não foi configurado no sistema.' });
        }

        const checkoutLink = `https://pay.cakto.com.br/${precoResult.rows[0].gateway_id}`;

        res.status(200).json({ checkoutUrl: checkoutLink });

    } catch (error) {
        console.error("Erro ao criar link de checkout da Cakto:", error);
        res.status(500).json({ error: 'Erro ao comunicar com o sistema de pagamento.' });
    }
};


// --- Função para receber e processar os Webhooks da Cakto ---
exports.handleWebhook = async (req, res) => {
    // A Cakto envia os dados no corpo da requisição
    const webhookData = req.body;
    const nossoTokenSecreto = process.env.CAKTO_WEBHOOK_SECRET;

    // 1. Verificação de segurança (se a Cakto enviar um token/segredo)
    // Supondo que a Cakto envia um campo 'token' ou similar no corpo do webhook.
    // Verifique a documentação para o nome exato do campo.
    if (webhookData.token !== nossoTokenSecreto) {
        console.warn("⚠️ Webhook da Cakto recebido com token inválido.");
        return res.status(403).json({ error: 'Acesso negado.' });
    }

    console.log(`✅ Webhook da Cakto Recebido: ${webhookData.event_type}`); // Verifique o nome real do campo de evento

    const client = await db.pool.connect();
    try {
        // Exemplo para um evento de 'Assinatura Ativada'
        if (webhookData.event_type === 'assinatura.ativada') {
            const emailCliente = webhookData.customer.email;
            const idOfertaCakto = webhookData.offer.id;

            console.log(`--- [AÇÃO] Processando assinatura ativada para o cliente com email [${emailCliente}]`);
            
            await client.query('BEGIN');

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