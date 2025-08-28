// backend/src/controllers/CaktoController.js (VERSÃO FINAL)

const db = require('../config/db');
const registrarLog = require('../helpers/logHelper');



exports.createCheckoutLink = async (req, res) => {
    const { pisciculturaId, email, nome } = req.user;
    const { preco_id } = req.body;

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Busca os dados da nossa piscicultura e do preço escolhido
        const pisciculturaResult = await client.query('SELECT * FROM pisciculturas WHERE id = $1', [pisciculturaId]);
        if (pisciculturaResult.rowCount === 0) throw new Error('Piscicultura não encontrada.');
        
        const piscicultura = pisciculturaResult.rows[0];
        let gatewayCustomerId = piscicultura.gateway_customer_id;

        // 2. Se a piscicultura ainda não tem um ID da Cakto, cria um agora
        if (!gatewayCustomerId) {
            console.log(`--- A criar novo cliente na Cakto para o email: ${email}`);
            const caktoCustomerPayload = {
                name: nome,
                email: email,
                doc_number: piscicultura.cnpj || '' // Supondo que temos o CNPJ
            };
            const customerResponse = await caktoApi.post('/customers', caktoCustomerPayload);
            gatewayCustomerId = customerResponse.data.id;

            // 3. Salva o novo ID da Cakto no nosso banco de dados
            await client.query('UPDATE pisciculturas SET gateway_customer_id = $1 WHERE id = $2', [gatewayCustomerId, pisciculturaId]);
            console.log(`--- Cliente Cakto ID [${gatewayCustomerId}] salvo com sucesso.`);
        }

        // 4. Busca o ID da oferta (gateway_id) do nosso banco
        const precoResult = await client.query("SELECT gateway_id FROM precos_planos WHERE id = $1", [preco_id]);
        if (precoResult.rowCount === 0 || !precoResult.rows[0].gateway_id) {
            throw new Error('Link de pagamento para este plano não foi configurado.');
        }
        const gatewayOfferId = precoResult.rows[0].gateway_id;

        // 5. Monta o link de checkout final
        const checkoutLink = `https://pay.cakto.com.br/${gatewayOfferId}?customer_id=${gatewayCustomerId}`;
        
        await client.query('COMMIT');
        res.status(200).json({ checkoutUrl: checkoutLink });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Erro ao criar link de checkout da Cakto:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Erro ao comunicar com o sistema de pagamento.' });
    } finally {
        client.release();
    }
};

exports.handleWebhook = async (req, res) => {
    const webhookData = req.body;
    const nossoTokenSecreto = process.env.CAKTO_WEBHOOK_SECRET;

    // 1. Verificação de segurança, lendo o campo 'secret'
    if (webhookData.secret !== nossoTokenSecreto) {
        console.warn("⚠️ Webhook da Cakto recebido com token de segurança inválido.");
        return res.status(403).json({ error: 'Token inválido.' });
    }

    // 2. Lê o tipo de evento do campo correto ('event')
    const eventType = webhookData.event;
    console.log(`✅ Webhook da Cakto verificado com sucesso. Evento: ${eventType}`);

    const client = await db.pool.connect();
    try {
        // Focamos nos eventos que indicam uma assinatura paga
        if (eventType === 'subscription_activated' || eventType === 'subscription_created') {
            
            const dadosDoEvento = webhookData.data;
            const emailCliente = dadosDoEvento.customer.email;
            const idOfertaCakto = dadosDoEvento.offer.id;

            console.log(`--- [AÇÃO] Processando assinatura para o cliente com email [${emailCliente}]`);
            
            await client.query('BEGIN');

            const usuarioResult = await client.query("SELECT piscicultura_id FROM usuarios WHERE email = $1", [emailCliente]);
            if (usuarioResult.rowCount === 0) throw new Error(`Utilizador com email [${emailCliente}] não foi encontrado no nosso sistema.`);
            const pisciculturaId = usuarioResult.rows[0].piscicultura_id;

            const precoResult = await client.query("SELECT id, plano_id, ciclo_cobranca FROM precos_planos WHERE gateway_id = $1", [idOfertaCakto]);
            if (precoResult.rowCount === 0) throw new Error(`ID de oferta da Cakto [${idOfertaCakto}] não encontrado na nossa tabela precos_planos.`);
            
            const { id: preco_id, plano_id, ciclo_cobranca } = precoResult.rows[0];

            let intervalo;
            if (ciclo_cobranca === 'MENSAL') intervalo = '1 month';
            else if (ciclo_cobranca === 'SEMESTRAL') intervalo = '6 months';
            else if (ciclo_cobranca === 'ANUAL') intervalo = '1 year';
            else intervalo = '1 month';

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
        console.error("❌ ERRO CRÍTICO AO PROCESSAR WEBHOOK DA CAKTO:", error.message);
        res.status(500).json({ error: 'Erro interno no processamento do webhook.' });
    } finally {
        client.release();
    }
};