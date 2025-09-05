// backend/src/controllers/CaktoController.js (VERSÃO FINAL COM CICLO DE VIDA COMPLETO)

const db = require('../config/db');
// Não precisamos do registrarLog aqui, pois as ações são iniciadas pela Cakto
// Mas o log de auditoria já foi registado quando o usuário clicou para assinar.

// --- Função para gerar o Link de Pagamento (Checkout) ---
exports.createCheckoutLink = async (req, res) => {
    const { preco_id } = req.body;
    try {
        const precoResult = await db.query("SELECT gateway_id FROM precos_planos WHERE id = $1", [preco_id]);
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

// --- Função de Webhook para receber notificações da Cakto ---
exports.handleWebhook = async (req, res) => {
    const webhookData = req.body;
    const nossoTokenSecreto = process.env.CAKTO_WEBHOOK_SECRET;

    // 1. Verificação de segurança
    if (webhookData.secret !== nossoTokenSecreto) {
        console.warn("⚠️ Webhook da Cakto recebido com token de segurança inválido.");
        return res.status(403).json({ error: 'Token inválido.' });
    }

    // 2. Lê o tipo de evento
    const eventType = webhookData.event;
    console.log(`✅ Webhook da Cakto verificado. Evento: ${eventType}`);

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        
        // Usamos um 'switch' para lidar com cada tipo de evento de forma organizada
        switch (eventType) {
            
            case 'subscription_activated':
            case 'subscription_renewed': {
                const dadosDoEvento = webhookData.data;
                const emailCliente = dadosDoEvento.customer.email;
                const idOfertaCakto = dadosDoEvento.offer.id;

                console.log(`--- [AÇÃO] Processando ATIVAÇÃO/RENOVAÇÃO para o cliente [${emailCliente}]`);
                
                const usuarioResult = await client.query("SELECT piscicultura_id FROM usuarios WHERE email = $1", [emailCliente]);
                if (usuarioResult.rowCount === 0) throw new Error(`Utilizador com email [${emailCliente}] não encontrado.`);
                
                const pisciculturaId = usuarioResult.rows[0].piscicultura_id;

                const precoResult = await client.query("SELECT id, plano_id, ciclo_cobranca FROM precos_planos WHERE gateway_id = $1", [idOfertaCakto]);
                if (precoResult.rowCount === 0) throw new Error(`ID de oferta da Cakto [${idOfertaCakto}] não encontrado.`);
                
                const { id: preco_id, plano_id, ciclo_cobranca } = precoResult.rows[0];
                let intervalo = ciclo_cobranca === 'ANUAL' ? '1 year' : '1 month';

                // Este comando funciona tanto para a primeira ativação quanto para renovações
                const updateResult = await client.query(
                    `UPDATE pisciculturas SET plano_id = $1, preco_id = $2, status_assinatura = 'ATIVO', data_expiracao_assinatura = NOW() + interval '${intervalo}' WHERE id = $3`,
                    [plano_id, preco_id, pisciculturaId]
                );

                if (updateResult.rowCount === 0) throw new Error(`Piscicultura com ID [${pisciculturaId}] não encontrada.`);
                
                console.log(`✅ SUCESSO: Assinatura da piscicultura ID ${pisciculturaId} foi ATIVADA/RENOVADA.`);
                break;
            }

            case 'subscription_canceled': {
                const dadosDoEvento = webhookData.data;
                const emailCliente = dadosDoEvento.customer.email;
                console.log(`--- [AÇÃO] Processando CANCELAMENTO para o cliente [${emailCliente}]`);

                const usuarioResult = await client.query("SELECT piscicultura_id FROM usuarios WHERE email = $1", [emailCliente]);
                if (usuarioResult.rowCount > 0) {
                    const pisciculturaId = usuarioResult.rows[0].piscicultura_id;
                    await client.query(
                        "UPDATE pisciculturas SET status_assinatura = 'CANCELADO' WHERE id = $1", 
                        [pisciculturaId]
                    );
                    console.log(`🛑 SUCESSO: Assinatura da piscicultura ID ${pisciculturaId} foi CANCELADA.`);
                }
                break;
            }
            
            default:
                console.log(`- Evento do tipo [${eventType}] recebido, mas sem ação definida.`);
        }
        
        await client.query('COMMIT');
        res.status(200).json({ received: true });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("❌ ERRO CRÍTICO AO PROCESSAR WEBHOOK DA CAKTO:", error.message);
        res.status(500).json({ error: 'Erro interno no processamento do webhook.' });
    } finally {
        client.release();
    }
};