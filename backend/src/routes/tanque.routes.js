// src/routes/tanque.routes.js

const { Router } = require('express');
const TanqueController = require('../controllers/TanqueController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware'); // 1. Importa



const tanqueRouter = Router();

//tanqueRouter.use(authMiddleware);
tanqueRouter.get('/:id', authMiddleware, checkPermission('tanques:ler'), TanqueController.getById);
tanqueRouter.put('/:id', authMiddleware, checkPermission('tanques:editar'), TanqueController.update);
tanqueRouter.delete('/:id', authMiddleware, checkPermission('tanques:apagar'), TanqueController.delete);
tanqueRouter.post('/', authMiddleware, checkPermission('tanques:criar'), TanqueController.create);
tanqueRouter.get('/', authMiddleware, checkPermission('tanques:ler'), TanqueController.listByPiscicultura); // Lista tanques por piscicultura


module.exports = tanqueRouter;