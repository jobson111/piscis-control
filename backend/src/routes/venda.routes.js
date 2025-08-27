// backend/src/routes/venda.routes.js (VERSÃO FINAL E CORRIGIDA)

const { Router } = require('express');
const VendaController = require('../controllers/VendaController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');

const vendaRouter = Router();

// Aplica a autenticação a todas as rotas deste ficheiro
vendaRouter.use(authMiddleware);

// --- ROTAS ---

// A rota mais específica vem primeiro para evitar conflitos.
vendaRouter.get(
    '/ultima-nota', 
    checkPermission('vendas:ler'), 
    VendaController.getUltimaNotaFiscal
);

// A rota para criar uma nova venda.
vendaRouter.post(
    '/', 
    checkPermission('vendas:criar'), 
    VendaController.create
);

// A rota genérica para listar todas as vendas vem por último.
vendaRouter.get(
    '/', 
    checkPermission('vendas:ler'), 
    VendaController.list
);

// Futuramente, as rotas de update e delete viriam aqui.
// vendaRouter.put('/:id', checkPermission('vendas:editar'), VendaController.update);
// vendaRouter.delete('/:id', checkPermission('vendas:apagar'), VendaController.delete);

module.exports = vendaRouter;