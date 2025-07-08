// backend/src/routes/qualidadeAgua.routes.js (VERSÃO COMPLETA)

const { Router } = require('express');
const QualidadeAguaController = require('../controllers/QualidadeAguaController');
const authMiddleware = require('../middleware/authMiddleware');

const qualidadeAguaRouter = Router();

// Aplicando o middleware individualmente para clareza e segurança
qualidadeAguaRouter.post('/', authMiddleware, QualidadeAguaController.create);
qualidadeAguaRouter.get('/', authMiddleware, QualidadeAguaController.list);
qualidadeAguaRouter.delete('/:id', authMiddleware, QualidadeAguaController.delete);

// --- NOVA ROTA ADICIONADA ---
qualidadeAguaRouter.put('/:id', authMiddleware, QualidadeAguaController.update);

module.exports = qualidadeAguaRouter;