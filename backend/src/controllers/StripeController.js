// backend/src/controllers/StripeController.js (VERSÃO FINAL E DEFINITIVA)

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../config/db');

// Esta função está correta e não precisa de alterações.
exports.createCheckoutSession = async (req, res) => {
    const { pisciculturaId, email } = req.user;
    const { priceId } = req.body;
    if (!priceId) return res.status(400).json({ error: 'O ID do preço é obrigatório.' });
    if (!process.env.FRONTEND_URL) return res.status(500).json({ error: 'A URL do Frontend não está configurada no servidor.' });

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        const pisciculturaResult = await client.query('SELECT * FROM pisciculturas WHERE id = $1', [pisciculturaId]);
        if (pisciculturaResult.rowCount === 0) throw new Error('Piscicultura não encontrada.');
        
        const piscicultura = pisciculturaResult.rows[0];
        let stripeCustomerId = piscicultura.stripe_customer_id;

        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({ name: piscicultura.nome_fantasia, email: email, metadata: { piscicultura_id: piscicultura.id } });
            stripeCustomerId = customer.id;
            await client.query('UPDATE pisciculturas SET stripe_customer_id = $1 WHERE id = $2', [stripeCustomerId, pisciculturaId]);
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
        console.error('Erro em createCheckoutSession:', error.message);
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
        const stripeCustomerId = pisciculturaResult.rows[0]?.stripe_customer_id;
        if (!stripeCustomerId) return res.status(404).json({ error: 'Cliente não encontrado no sistema de pagamento.' });
        const portalSession = await stripe.billingPortal.sessions.create({ customer: stripeCustomerId, return_url: `${process.env.FRONTEND_URL}/planos` });
        res.status(200).json({ url: portalSession.url });
    } catch (error) {
        console.error("Erro ao criar sessão do portal da Stripe:", error);
        res.status(500).json({ error: 'Erro ao comunicar com o sistema de pagamento.' });
    }
};

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
    
    console.log(`✅ Webhook Recebido: ${event.type}`);

    // Agimos APENAS no evento que confirma que uma fatura de assinatura foi PAGA.
    if (event.type === 'invoice.payment_succeeded') {
        const invoice = event.data.object;
        
        // Verificamos se a fatura está relacionada a uma subscrição e foi paga.
        if (invoice.subscription && invoice.status === 'paid') {
            const stripeCustomerId = invoice.customer;
            const priceId = invoice.lines.data[0].price.id; // O ID do preço está na linha da fatura
            const dataExpiracao = new Date(invoice.period_end * 1000); // A data de expiração está na fatura

            console.log(`--- [AÇÃO] Processando fatura paga para cliente [${stripeCustomerId}]`);
            
            try {
                const precoResult = await db.query("SELECT id, plano_id FROM precos_planos WHERE gateway_price_id = $1", [priceId]);
                if (precoResult.rowCount === 0) {
                    throw new Error(`Price ID [${priceId}] da Stripe não foi encontrado na nossa tabela precos_planos.`);
                }
                
                const { id: preco_id, plano_id } = precoResult.rows[0];
                console.log(`> Encontrado Plano interno ID: ${plano_id}, Preço interno ID: ${preco_id}`);

                const updateResult = await db.query(
                    `UPDATE pisciculturas 
                     SET plano_id = $1, preco_id = $2, status_assinatura = 'ATIVO', data_expiracao_assinatura = $3 
                     WHERE stripe_customer_id = $4`,
                    [plano_id, preco_id, dataExpiracao, stripeCustomerId]
                );

                if (updateResult.rowCount === 0) {
                    throw new Error(`Piscicultura com stripe_customer_id [${stripeCustomerId}] não encontrada para atualizar.`);
                }
                
                console.log(`✅ SUCESSO: Assinatura da piscicultura foi atualizada no banco de dados.`);
            } catch (dbError) {
                console.error("❌ ERRO CRÍTICO AO ATUALIZAR BANCO DE DADOS:", dbError.message);
            }
        }
    }
    
    // Respondemos 200 OK para todos os eventos para que a Stripe não continue a enviá-los.
    res.status(200).json({ received: true });
};