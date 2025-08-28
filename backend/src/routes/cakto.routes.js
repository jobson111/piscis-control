// backend/src/routes/cakto.routes.js (VERSÃO FINAL)

const { Router } = require('express');
const CaktoController = require('../controllers/CaktoController');
const authMiddleware = require('../middleware/authMiddleware');

const caktoRouter = Router();

// Rota que o nosso frontend chama, precisa que o usuário esteja logado
caktoRouter.post('/create-checkout-link', authMiddleware, CaktoController.createCheckoutLink);

// Rota que a Cakto chama (webhook). É pública, a segurança é feita dentro do controller.
caktoRouter.post('/webhook', CaktoController.handleWebhook);

module.exports = caktoRouter;