const { Router } = require('express');
const StripeController = require('../controllers/StripeController');
const authMiddleware = require('../middleware/authMiddleware');

const stripeRouter = Router();

// As rotas que o nosso frontend chama diretamente precisam de autenticação
stripeRouter.post('/create-checkout-session', authMiddleware, StripeController.createCheckoutSession);
stripeRouter.post('/create-portal-session', authMiddleware, StripeController.createPortalSession);

// A rota do webhook NÃO usa o nosso authMiddleware, pois é a Stripe que a chama.
// A sua segurança é feita pela verificação da assinatura dentro do controller.
// Esta rota está definida no index.js para vir antes do express.json().

module.exports = stripeRouter;