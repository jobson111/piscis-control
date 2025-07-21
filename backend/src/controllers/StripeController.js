// backend/src/controllers/StripeController.js (VERSÃO REVISADA E MELHORADA)

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../config/db');

// Esta função está correta, a incluímos para garantir que o ficheiro está completo.
exports.createCheckoutSession = async (req, res) => {
    const { pisciculturaId, email } = req.user; // O email agora vem do token
    const { priceId } = req.body;
    if (!priceId) return res.status(400).json({ error: 'O ID do preço é obrigatório.' });

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        const pisciculturaResult = await client.query('SELECT * FROM pisciculturas WHERE id = $1', [pisciculturaId]);
        if (pisciculturaResult.rowCount === 0) throw new Error('Piscicultura não encontrada.');
        
        const piscicultura = pisciculturaResult.rows[0];
        let stripeCustomerId = piscicultura.stripe_customer_id;

        if (!stripeCustomerId) {
            console.log(`--- Criando novo cliente na Stripe para a piscicultura ID: ${pisciculturaId}`);
            // Garante que o email é passado para a Stripe
            const customer = await stripe.customers.create({ 
                name: piscicultura.nome_fantasia, 
                email: email, // Usa o email do token
                metadata: { piscicultura_id: piscicultura.id } 
            });
            stripeCustomerId = customer.id;
            await client.query('UPDATE pisciculturas SET stripe_customer_id = $1 WHERE id = $2', [stripeCustomerId, pisciculturaId]);
            console.log(`--- Cliente Stripe ID [${stripeCustomerId}] salvo com sucesso.`);
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
        res.status(200).json({ sessionId: session.id });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro em createCheckoutSession:', error);
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
exports.handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error(`❌ Erro na verificação da assinatura: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const client = await db.pool.connect();
    try {
        console.log(`✅ Webhook Recebido: ${event.type} (ID: ${event.id})`);
        await client.query('BEGIN');

        const eventoJaProcessado = await client.query('SELECT 1 FROM eventos_stripe_processados WHERE event_id = $1', [event.id]);
        if (eventoJaProcessado.rowCount > 0) {
            console.log(`> Evento ${event.id} já processado anteriormente. A ignorar.`);
            await client.query('COMMIT');
            return res.status(200).json({ received: true, message: 'Evento já processado.' });
        }

        if (event.type === 'invoice.payment_succeeded') {
            const invoice = event.data.object;
            if (invoice.subscription && invoice.status === 'paid') {
                const stripeCustomerId = invoice.customer;
                const priceId = invoice.lines.data[0].price.id;
                const dataExpiracao = new Date(invoice.period_end * 1000);

                const precoResult = await client.query("SELECT id, plano_id FROM precos_planos WHERE gateway_price_id = $1", [priceId]);
                if (precoResult.rowCount > 0) {
                    const { id: preco_id, plano_id } = precoResult.rows[0];
                    await client.query(
                        `UPDATE pisciculturas SET plano_id = $1, preco_id = $2, status_assinatura = 'ATIVO', data_expiracao_assinatura = $3 WHERE stripe_customer_id = $4`,
                        [plano_id, preco_id, dataExpiracao, stripeCustomerId]
                    );
                    console.log(`✅ Assinatura ativada para o cliente ${stripeCustomerId}`);
                }
            }
        }

        await client.query('INSERT INTO eventos_stripe_processados (event_id) VALUES ($1)', [event.id]);
        await client.query('COMMIT');
        res.status(200).json({ received: true });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ ERRO CRÍTICO ao processar webhook:', err.message);
        res.status(500).json({ error: 'Erro interno no processamento do webhook' });
    } finally {
        client.release();
    }
};