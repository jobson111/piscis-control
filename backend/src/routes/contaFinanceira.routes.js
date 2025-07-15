// backend/src/routes/contaFinanceira.routes.js
const { Router } = require('express');
const ContaFinanceiraController = require('../controllers/ContaFinanceiraController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');

const contaFinanceiraRouter = Router();
contaFinanceiraRouter.use(authMiddleware);

// Todas as rotas abaixo exigem a nova permissão
contaFinanceiraRouter.post('/', checkPermission('financeiro:configurar'), ContaFinanceiraController.create);
contaFinanceiraRouter.get('/', checkPermission('financeiro:configurar'), ContaFinanceiraController.list);
contaFinanceiraRouter.put('/:id', checkPermission('financeiro:configurar'), ContaFinanceiraController.update);

module.exports = contaFinanceiraRouter;