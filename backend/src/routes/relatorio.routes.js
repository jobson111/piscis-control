// backend/src/routes/relatorio.routes.js
const { Router } = require('express');
const RelatorioController = require('../controllers/RelatorioController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');

const relatorioRouter = Router();
relatorioRouter.use(authMiddleware);

// Rota para o nosso novo relatório de estoque
relatorioRouter.get('/extrato-tanque/:tanqueId', checkPermission('relatorios:ler'), RelatorioController.getExtratoTanque);
relatorioRouter.get('/estoque-atual', checkPermission('relatorios:ler'), RelatorioController.getEstoqueAtual);
relatorioRouter.get('/desempenho-lote/:loteId', checkPermission('relatorios:ler'), RelatorioController.getDesempenhoLote);
relatorioRouter.get('/transferencias', checkPermission('relatorios:ler'), RelatorioController.getHistoricoTransferencias);
relatorioRouter.get('/fluxo-caixa', checkPermission('relatorios:ler'), RelatorioController.getFluxoDeCaixa);




module.exports = relatorioRouter;