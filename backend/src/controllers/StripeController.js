// backend/src/controllers/StripeController.js (VERSÃO REVISADA E MELHORADA)

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../config/db');

// Esta função está correta, a incluímos para garantir que o ficheiro está completo.
exports.createCheckoutSession = async (req, res) => {
    console.log("--- [API] Iniciando createCheckoutSession ---");
    const { pisciculturaId, email, nome } = req.user;
    const { priceId } = req.body;

    console.log(`> Dados recebidos do token: pisciculturaId=${pisciculturaId}, email=${email}, nome=${nome}`);
    
    if (!priceId) return res.status(400).json({ error: 'O ID do preço é obrigatório.' });
    if (!pisciculturaId || !email) {
        console.error("--- ERRO CRÍTICO: pisciculturaId ou email estão em falta no token JWT.");
        return res.status(500).json({ error: 'Erro de autenticação: dados do usuário incompletos.' });
    }

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        const pisciculturaResult = await client.query('SELECT * FROM pisciculturas WHERE id = $1', [pisciculturaId]);
        if (pisciculturaResult.rowCount === 0) throw new Error('Piscicultura não encontrada.');
        
        const piscicultura = pisciculturaResult.rows[0];
        let stripeCustomerId = piscicultura.stripe_customer_id;

        if (!stripeCustomerId) {
            console.log(`--- [API] Criando novo cliente na Stripe...`);
            const customer = await stripe.customers.create({ 
                name: piscicultura.nome_fantasia, 
                email: email,
                metadata: { piscicultura_id: piscicultura.id, nome_responsavel: nome } 
            });
            stripeCustomerId = customer.id;
            await client.query('UPDATE pisciculturas SET stripe_customer_id = $1 WHERE id = $2', [stripeCustomerId, pisciculturaId]);
            console.log(`--- [API] Cliente Stripe ID [${stripeCustomerId}] salvo com sucesso.`);
        }

        const session = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            payment_method_types: ['card', 'boleto'],
            line_items: [{ price: priceId, quantity: 1 }],
            mode: 'subscription',
            success_url: `${process.env.FRONTEND_URL}/assinatura/sucesso`,
            cancel_url: `${process.env.FRONTEND_URL}/planos`,
        });
        
        await client.query('COMMIT');
        console.log(`--- [API] Sessão de checkout [${session.id}] criada com sucesso.`);
        res.status(200).json({ sessionId: session.id });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('--- [API] ERRO na transação de checkout:', error.message);
        res.status(500).json({ error: 'Erro ao comunicar com o sistema de pagamento.' });
    } finally {
        client.release();
    }
};


// Esta função também está correta.
exports.createPortalSession = async (req, res) => {
    const { pisciculturaId } = req.user;
    try {
        const pisciculturaResult = await db.query('SELECT stripe_customer_id FROM pisciculturas WHERE id = $1', [pisciculturaId]);
        const stripeCustomerId = pisciculturaResult.rows?.stripe_customer_id;
        if (!stripeCustomerId) return res.status(404).json({ error: 'Cliente não encontrado no sistema de pagamento.' });
        const portalSession = await stripe.billingPortal.sessions.create({ customer: stripeCustomerId, return_url: `${process.env.FRONTEND_URL}/planos` });
        res.status(200).json({ url: portalSession.url });
    } catch (error) {
        console.error("Erro ao criar sessão do portal da Stripe:", error);
        res.status(500).json({ error: 'Erro ao comunicar com o sistema de pagamento.' });
    }
};

// --- A FUNÇÃO DE WEBHOOK FINAL, ROBUSTA E COMPLETA ---
// --- A FUNÇÃO DE WEBHOOK FINAL ---
exports.handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.log(`❌ Erro na verificação da assinatura do Webhook: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    let subscription;
    let status;

    // Lida com os diferentes tipos de eventos de assinatura
    switch (event.type) {
        case 'customer.subscription.trial_will_end':
            subscription = event.data.object;
            status = subscription.status;
            console.log(`Assinatura trial a terminar para ${subscription.id}. Status: ${status}`);
            break;
        case 'customer.subscription.deleted':
            subscription = event.data.object;
            status = subscription.status;
            console.log(`Assinatura cancelada: ${subscription.id}. Status: ${status}`);
            // Aqui podemos atualizar o status no nosso banco para 'CANCELADO'
            break;
        case 'customer.subscription.created':
            subscription = event.data.object;
            status = subscription.status;
            console.log(`Assinatura criada: ${subscription.id}. Status: ${status}`);
            // A subscrição é criada mas ainda pode não estar paga, então esperamos pelo invoice.payment_succeeded
            break;
        case 'customer.subscription.updated':
            subscription = event.data.object;
            status = subscription.status;
            console.log(`Assinatura atualizada: ${subscription.id}. Status: ${status}`);
            // Este evento é útil para upgrades/downgrades
            break;
        case 'invoice.payment_succeeded':
            const invoice = event.data.object;
            // Se o motivo do pagamento for a criação de uma subscrição, então atualizamos a nossa base de dados
            if (invoice.billing_reason === 'subscription_create') {
                const stripeCustomerId = invoice.customer;
                const subscriptionId = invoice.subscription;
                
                try {
                    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                    const priceId = subscription.items.data[0].price.id;
                    const dataExpiracao = new Date(subscription.current_period_end * 1000);
                    
                    const precoResult = await db.query("SELECT id, plano_id FROM precos_planos WHERE gateway_price_id = $1", [priceId]);
                    if (precoResult.rowCount === 0) throw new Error(`Price ID [${priceId}] não encontrado.`);
                    
                    const { id: preco_id, plano_id } = precoResult.rows[0];

                    const updateResult = await db.query(
                        `UPDATE pisciculturas SET plano_id = $1, preco_id = $2, status_assinatura = 'ATIVO', data_expiracao_assinatura = $3 WHERE stripe_customer_id = $4`,
                        [plano_id, preco_id, dataExpiracao, stripeCustomerId]
                    );
                    
                    if (updateResult.rowCount === 0) throw new Error(`Piscicultura com stripe_customer_id [${stripeCustomerId}] não encontrada.`);
                    
                    console.log(`✅ SUCESSO: Assinatura ATIVADA no banco de dados para o cliente [${stripeCustomerId}]`);
                } catch(error) {
                    console.error("❌ ERRO ao processar 'invoice.payment_succeeded':", error.message);
                }
            }
            break;
        default:
            console.log(`- Evento não tratado: ${event.type}`);
    }

    res.status(200).json({ received: true });
};