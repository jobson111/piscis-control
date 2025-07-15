// backend/src/routes/relatorio.routes.js
const { Router } = require('express');
const RelatorioController = require('../controllers/RelatorioController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');

const relatorioRouter = Router();
relatorioRouter.use(authMiddleware);

// Rota para o nosso novo relatório de estoque
relatorioRouter.get('/estoque-atual', checkPermission('relatorios:ler'), RelatorioController.getEstoqueAtual);

module.exports = relatorioRouter;