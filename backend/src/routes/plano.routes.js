// backend/src/routes/plano.routes.js
const { Router } = require('express');
const PlanoController = require('../controllers/PlanoController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');

const planoRouter = Router();

// A rota para listar os planos pode ser vista por qualquer usuário logado (para a página de escolha de plano)
planoRouter.get('/', authMiddleware, PlanoController.list);

// As rotas para criar e atualizar planos são protegidas pela nossa nova permissão de super admin
const podeGerirPlanos = checkPermission('planos:gerir');
planoRouter.post('/', authMiddleware, podeGerirPlanos, PlanoController.create);
planoRouter.put('/:id', authMiddleware, podeGerirPlanos, PlanoController.update);

module.exports = planoRouter;