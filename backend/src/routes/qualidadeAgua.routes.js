// src/routes/qualidadeAgua.routes.js (VERSÃO CORRIGIDA)
const { Router } = require('express');
const QualidadeAguaController = require('../controllers/QualidadeAguaController');
const authMiddleware = require('../middleware/authMiddleware');

const qualidadeAguaRouter = Router();

// Aplicando o middleware individualmente
qualidadeAguaRouter.post('/', authMiddleware, QualidadeAguaController.create);
qualidadeAguaRouter.get('/', authMiddleware, QualidadeAguaController.list);
qualidadeAguaRouter.delete('/:id', authMiddleware, QualidadeAguaController.delete);

module.exports = qualidadeAguaRouter;