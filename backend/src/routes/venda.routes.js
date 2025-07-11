// backend/src/routes/venda.routes.js (VERSÃO CORRIGIDA)

const { Router } = require('express');
const VendaController = require('../controllers/VendaController');
const authMiddleware = require('../middleware/authMiddleware');

const vendaRouter = Router();

// REMOVEMOS a linha 'vendaRouter.use(authMiddleware);'

// E aplicamos o middleware individualmente em cada rota que precisa de proteção
vendaRouter.post('/', authMiddleware, VendaController.create);
vendaRouter.get('/', authMiddleware, VendaController.list);

module.exports = vendaRouter;