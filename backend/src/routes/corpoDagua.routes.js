// src/routes/corpoDagua.routes.js
const { Router } = require('express');
const CorpoDaguaController = require('../controllers/CorpoDaguaController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware'); // 1. Importa


const corpoDaguaRouter = Router();

//corpoDaguaRouter.use(authMiddleware);

corpoDaguaRouter.post('/', authMiddleware, checkPermission('corpos_dagua:criar'), CorpoDaguaController.create);
corpoDaguaRouter.get('/', authMiddleware, checkPermission('corpos_dagua:ler'), CorpoDaguaController.listByPiscicultura);

module.exports = corpoDaguaRouter;