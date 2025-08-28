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


// --- A FUNÇÃO DE WEBHOOK FINAL E CORRIGIDA ---
exports.handleWebhook = async (req, res) => {
    const webhookData = req.body;
    const nossoTokenSecreto = process.env.CAKTO_WEBHOOK_SECRET;

    // 1. Verificação de segurança (lendo o campo 'secret')
    if (webhookData.secret !== nossoTokenSecreto) {
        console.warn("⚠️ Webhook da Cakto recebido com token de segurança inválido.");
        return res.status(403).json({ error: 'Token inválido.' });
    }

    // 2. Lê o tipo de evento do campo correto ('event')
    const eventType = webhookData.event;
    console.log(`✅ Webhook da Cakto verificado com sucesso. Evento: ${eventType}`);

    const client = await db.pool.connect();
    try {
        // Focamos no evento que nos interessa (pode ser 'subscription_activated' ou similar na Cakto)
        if (eventType === 'subscription_created' || eventType === 'subscription_activated') { // Use o nome real do evento de sucesso
            
            const dadosDoEvento = webhookData.data;
            const emailCliente = dadosDoEvento.customer.email;
            const idOfertaCakto = dadosDoEvento.offer.id;

            console.log(`--- [AÇÃO] Processando assinatura ativada para o cliente com email [${emailCliente}]`);
            
            await client.query('BEGIN');

            // 3. Encontra a piscicultura no NOSSO banco de dados usando o email
            const usuarioResult = await client.query("SELECT piscicultura_id FROM usuarios WHERE email = $1", [emailCliente]);
            if (usuarioResult.rowCount === 0) {
                throw new Error(`Utilizador com email [${emailCliente}] não foi encontrado no nosso sistema.`);
            }
            const pisciculturaId = usuarioResult.rows[0].piscicultura_id;
            console.log(`> Piscicultura ID [${pisciculturaId}] encontrada para o email.`);

            // Encontra o nosso plano interno com base no ID da oferta da Cakto
            const precoResult = await client.query("SELECT id, plano_id FROM precos_planos WHERE gateway_id = $1", [idOfertaCakto]);
            if (precoResult.rowCount === 0) {
                throw new Error(`ID de oferta da Cakto [${idOfertaCakto}] não encontrado na nossa tabela precos_planos.`);
            }
            const { id: preco_id, plano_id } = precoResult.rows[0];

            // Define a nova data de expiração (ex: 1 ano a partir de agora)
            const dataExpiracao = new Date();
            // Esta lógica precisa ser ajustada para ler o ciclo (mensal/anual) do plano
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