// backend/src/routes/financeiro.routes.js
const { Router } = require('express');
const FinanceiroController = require('../controllers/FinanceiroController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');

const financeiroRouter = Router();
financeiroRouter.use(authMiddleware);

// Rota para a nossa nova funcionalidade de prestação de contas
financeiroRouter.post('/prestacao-contas', checkPermission('financeiro:conciliar'), FinanceiroController.createPrestacaoContas);

module.exports = financeiroRouter;