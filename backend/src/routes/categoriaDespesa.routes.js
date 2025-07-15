// backend/src/routes/categoriaDespesa.routes.js (VERSÃO COMPLETA)
const { Router } = require('express');
const CategoriaDespesaController = require('../controllers/CategoriaDespesaController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');

const categoriaDespesaRouter = Router();
categoriaDespesaRouter.use(authMiddleware);

const checkAccess = checkPermission('financeiro:configurar');

categoriaDespesaRouter.post('/', checkAccess, CategoriaDespesaController.create);
categoriaDespesaRouter.get('/', checkAccess, CategoriaDespesaController.list);
categoriaDespesaRouter.put('/:id', checkAccess, CategoriaDespesaController.update);
categoriaDespesaRouter.delete('/:id', checkAccess, CategoriaDespesaController.delete);

module.exports = categoriaDespesaRouter;