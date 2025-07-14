// backend/src/routes/cargo.routes.js

const { Router } = require('express');
const CargoController = require('../controllers/CargoController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware'); // 1. Importa


const cargoRouter = Router();
cargoRouter.use(authMiddleware);

// Rota para listar todas as permissões disponíveis (para montar os checkboxes no frontend)
cargoRouter.get('/permissoes', CargoController.listAllPermissoes);

// Rotas CRUD para os Cargos
cargoRouter.post('/', checkPermission('cargos:gerir'), CargoController.create);
cargoRouter.get('/:id', checkPermission('cargos:gerir'), CargoController.getById);
cargoRouter.put('/:id', checkPermission('cargos:gerir'), CargoController.update);
cargoRouter.get('/', checkPermission('cargos:gerir'), CargoController.list);

// A rota de delete pode ser adicionada aqui no futuro se necessário

module.exports = cargoRouter;