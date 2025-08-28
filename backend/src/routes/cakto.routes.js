// backend/src/routes/cakto.routes.js (VERSÃO FINAL E CORRIGIDA)

const { Router } = require('express');
const CaktoController = require('../controllers/CaktoController');
const authMiddleware = require('../middleware/authMiddleware');

const caktoRouter = Router();

// Rota para criar o link de checkout.
// Precisa que o usuário esteja logado, por isso usa o nosso authMiddleware.
caktoRouter.post('/create-checkout-link', authMiddleware, CaktoController.createCheckoutLink);

// Rota para o webhook.
// É uma rota PÚBLICA, pois é a Cakto que a chama. A segurança é feita
// pela verificação do token secreto DENTRO do controller.
// Não usa o nosso authMiddleware.
caktoRouter.post('/webhook', CaktoController.handleWebhook);

module.exports = caktoRouter;