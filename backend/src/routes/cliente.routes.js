// backend/src/routes/cliente.routes.js (VERSÃO COMPLETA E CORRIGIDA)

const { Router } = require('express');
const ClienteController = require('../controllers/ClienteController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware'); // 1. Importa


const clienteRouter = Router();

// Aplica a segurança a todas as rotas
clienteRouter.use(authMiddleware);

// --- ROTAS DO CRUD ---

// Rota para buscar um cliente específico (mais específica, vem primeiro)
clienteRouter.get('/:id', checkPermission('clientes:ler'), ClienteController.getById);

// Rota para listar todos os clientes (mais genérica, vem depois)
clienteRouter.get('/', checkPermission('clientes:ler'), ClienteController.listByPiscicultura);

// Rota para criar um novo cliente
clienteRouter.post('/', checkPermission('clientes:criar'), ClienteController.create);

// Rota para atualizar um cliente
clienteRouter.put('/:id', checkPermission('clientes:editar'), ClienteController.update);

// Rota para deletar um cliente
clienteRouter.delete('/:id', checkPermission('clientes:apagar'), ClienteController.delete);


module.exports = clienteRouter;