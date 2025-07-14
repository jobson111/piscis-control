// src/routes/manejo.routes.js
const { Router } = require('express');
const ManejoController = require('../controllers/ManejoController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware'); // 1. Importa


const manejoRouter = Router();

// Aplica a segurança a todas as rotas de manejo
manejoRouter.use(authMiddleware);

// Rota para a nossa nova funcionalidade de transferência
manejoRouter.post('/transferencia', checkPermission('lotes:transferir'), ManejoController.transferirLote);

module.exports = manejoRouter;