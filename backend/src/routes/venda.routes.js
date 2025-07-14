// backend/src/routes/venda.routes.js (VERSÃO CORRIGIDA)

const { Router } = require('express');
const VendaController = require('../controllers/VendaController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware'); // 1. Importa


const vendaRouter = Router();

// REMOVEMOS a linha 'vendaRouter.use(authMiddleware);'

// E aplicamos o middleware individualmente em cada rota que precisa de proteção
vendaRouter.post('/', authMiddleware, checkPermission('vendas:criar'), VendaController.create);
vendaRouter.get('/', authMiddleware, checkPermission('vendas:ler'), VendaController.list);

module.exports = vendaRouter;