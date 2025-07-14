// backend/src/routes/usuario.routes.js
const { Router } = require('express');
const UsuarioController = require('../controllers/UsuarioController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware'); // 1. Importa


const usuarioRouter = Router();
usuarioRouter.use(authMiddleware);

usuarioRouter.get('/', checkPermission('vendas:ler'), UsuarioController.list);
usuarioRouter.post('/', checkPermission('vendas:criar'), UsuarioController.create);

module.exports = usuarioRouter;