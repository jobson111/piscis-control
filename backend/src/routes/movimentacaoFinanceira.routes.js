// backend/src/routes/movimentacaoFinanceira.routes.js (VERSÃO COMPLETA)

const { Router } = require('express');
const MovimentacaoController = require('../controllers/MovimentacaoFinanceiraController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');

const movimentacaoRouter = Router();
movimentacaoRouter.use(authMiddleware);

const podeLer = checkPermission('financeiro:ler');
const podeMovimentar = checkPermission('financeiro:movimentar');

// Rota para listar todas as movimentações (extrato)
movimentacaoRouter.get('/', podeLer, MovimentacaoController.list);
    
// Rotas específicas para criar cada tipo de movimentação
movimentacaoRouter.post('/despesa', podeMovimentar, MovimentacaoController.createDespesa);
movimentacaoRouter.post('/receita', podeMovimentar, MovimentacaoController.createReceita);
movimentacaoRouter.post('/transferencia', podeMovimentar, MovimentacaoController.createTransferencia);

module.exports = movimentacaoRouter;