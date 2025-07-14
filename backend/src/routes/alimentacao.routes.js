// src/routes/alimentacao.routes.js (VERSÃO CORRIGIDA)
const { Router } = require('express');
const AlimentacaoController = require('../controllers/AlimentacaoController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware'); // 1. Importa


const alimentacaoRouter = Router();

// Aplicando o middleware individualmente
alimentacaoRouter.post('/', authMiddleware, checkPermission('alimentacao:criar'), AlimentacaoController.create);
alimentacaoRouter.get('/', authMiddleware, checkPermission('alimentacao:ler'), AlimentacaoController.listByLote);
alimentacaoRouter.delete('/:id', authMiddleware, checkPermission('alimentacao:apagar'), AlimentacaoController.delete);

module.exports = alimentacaoRouter;