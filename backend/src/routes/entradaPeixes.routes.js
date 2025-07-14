// src/routes/entradaPeixes.routes.js
const { Router } = require('express');
const EntradaPeixesController = require('../controllers/EntradaPeixesController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware'); // 1. Importa


const entradaPeixesRouter = Router();

// Aplica a segurança em todas as rotas
entradaPeixesRouter.use(authMiddleware);

// Rota para listar todas as entradas
entradaPeixesRouter.get('/', checkPermission('entradas:ler'), EntradaPeixesController.list);

// Rota para criar uma nova entrada (com seus lotes)
entradaPeixesRouter.post('/', checkPermission('entradas:criar'), EntradaPeixesController.create);

// Futuramente, podemos adicionar rotas para deletar ou editar uma entrada
// entradaPeixesRouter.delete('/:id', EntradaPeixesController.delete);

module.exports = entradaPeixesRouter;