// backend/src/routes/cliente.routes.js (VERSÃO COMPLETA E CORRIGIDA)

const { Router } = require('express');
const ClienteController = require('../controllers/ClienteController');
const authMiddleware = require('../middleware/authMiddleware');

const clienteRouter = Router();

// Aplica a segurança a todas as rotas
clienteRouter.use(authMiddleware);

// --- ROTAS DO CRUD ---

// Rota para buscar um cliente específico (mais específica, vem primeiro)
clienteRouter.get('/:id', ClienteController.getById);

// Rota para listar todos os clientes (mais genérica, vem depois)
clienteRouter.get('/', ClienteController.listByPiscicultura);

// Rota para criar um novo cliente
clienteRouter.post('/', ClienteController.create);

// Rota para atualizar um cliente
clienteRouter.put('/:id', ClienteController.update);

// Rota para deletar um cliente
clienteRouter.delete('/:id', ClienteController.delete);


module.exports = clienteRouter;