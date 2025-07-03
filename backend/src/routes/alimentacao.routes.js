// src/routes/alimentacao.routes.js (VERSÃO CORRIGIDA)
const { Router } = require('express');
const AlimentacaoController = require('../controllers/AlimentacaoController');
const authMiddleware = require('../middleware/authMiddleware');

const alimentacaoRouter = Router();

// Aplicando o middleware individualmente
alimentacaoRouter.post('/', authMiddleware, AlimentacaoController.create);
alimentacaoRouter.get('/', authMiddleware, AlimentacaoController.listByLote);
alimentacaoRouter.delete('/:id', authMiddleware, AlimentacaoController.delete);

module.exports = alimentacaoRouter;