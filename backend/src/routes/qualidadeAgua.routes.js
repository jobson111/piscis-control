// backend/src/routes/qualidadeAgua.routes.js (VERSÃO COMPLETA)

const { Router } = require('express');
const QualidadeAguaController = require('../controllers/QualidadeAguaController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware'); // 1. Importa


const qualidadeAguaRouter = Router();

// Aplicando o middleware individualmente para clareza e segurança
qualidadeAguaRouter.post('/', authMiddleware, checkPermission('qualidade_agua:criar'), QualidadeAguaController.create);
qualidadeAguaRouter.get('/', authMiddleware, checkPermission('qualidade_agua:ler'), QualidadeAguaController.list);
qualidadeAguaRouter.delete('/:id', authMiddleware, checkPermission('qualidade_agua:apagar'), QualidadeAguaController.delete);

// --- NOVA ROTA ADICIONADA ---
qualidadeAguaRouter.put('/:id', authMiddleware, checkPermission('qualidade_agua:editar'), QualidadeAguaController.update);

module.exports = qualidadeAguaRouter;