// src/routes/biometria.routes.js (VERSÃO CORRIGIDA)
const { Router } = require('express');
const BiometriaController = require('../controllers/BiometriaController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware'); // 1. Importa


const biometriaRouter = Router();

// Aplicando o middleware individualmente
biometriaRouter.post('/', authMiddleware, checkPermission('biometria:criar'), BiometriaController.create);
biometriaRouter.get('/', authMiddleware, checkPermission('biometria:ler'), BiometriaController.listByLote);
biometriaRouter.delete('/:id', authMiddleware, checkPermission('biometria:apagar'), BiometriaController.delete);

module.exports = biometriaRouter;