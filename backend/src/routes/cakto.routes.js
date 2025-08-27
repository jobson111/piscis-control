// backend/src/routes/cakto.routes.js
const { Router } = require('express');
const CaktoController = require('../controllers/CaktoController');
const authMiddleware = require('../middleware/authMiddleware');

const caktoRouter = Router();

// A rota para criar o link de checkout precisa que o usuário esteja logado
caktoRouter.post('/create-checkout-link', authMiddleware, CaktoController.createCheckoutLink);

// A rota do webhook é PÚBLICA, pois é a Cakto que a chama.
// A segurança é feita pela verificação do token secreto dentro do controller.
caktoRouter.post('/webhook', CaktoController.handleWebhook);


module.exports = caktoRouter;