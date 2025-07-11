// backend/src/routes/usuario.routes.js
const { Router } = require('express');
const UsuarioController = require('../controllers/UsuarioController');
const authMiddleware = require('../middleware/authMiddleware');

const usuarioRouter = Router();
usuarioRouter.use(authMiddleware);

usuarioRouter.get('/', UsuarioController.list);
usuarioRouter.post('/', UsuarioController.create);

module.exports = usuarioRouter;