// backend/src/routes/cakto.routes.js (VERSÃO CORRIGIDA)
const { Router } = require('express');
const CaktoController = require('../controllers/CaktoController');
const authMiddleware = require('../middleware/authMiddleware');

const caktoRouter = Router();

// Este router agora só tem as rotas que precisam de autenticação
caktoRouter.post('/create-checkout-link', authMiddleware, CaktoController.createCheckoutLink);

// A rota do webhook foi removida daqui

module.exports = caktoRouter;