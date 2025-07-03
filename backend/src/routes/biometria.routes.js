// src/routes/biometria.routes.js (VERSÃO CORRIGIDA)
const { Router } = require('express');
const BiometriaController = require('../controllers/BiometriaController');
const authMiddleware = require('../middleware/authMiddleware');

const biometriaRouter = Router();

// Aplicando o middleware individualmente
biometriaRouter.post('/', authMiddleware, BiometriaController.create);
biometriaRouter.get('/', authMiddleware, BiometriaController.listByLote);
biometriaRouter.delete('/:id', authMiddleware, BiometriaController.delete);

module.exports = biometriaRouter;