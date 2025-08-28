const { Router } = require('express');
const CaktoController = require('../controllers/CaktoController');
const authMiddleware = require('../middleware/authMiddleware');

const caktoRouter = Router();

// Rota que o nosso frontend chama, precisa de autenticação
caktoRouter.post('/create-checkout-link', authMiddleware, CaktoController.createCheckoutLink);

// A rota do webhook NÃO está aqui, ela será tratada diretamente no index.js

module.exports = caktoRouter;