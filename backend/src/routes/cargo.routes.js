// backend/src/routes/cargo.routes.js

const { Router } = require('express');
const CargoController = require('../controllers/CargoController');
const authMiddleware = require('../middleware/authMiddleware');

const cargoRouter = Router();
cargoRouter.use(authMiddleware);

// Rota para listar todas as permissões disponíveis (para montar os checkboxes no frontend)
cargoRouter.get('/permissoes', CargoController.listAllPermissoes);

// Rotas CRUD para os Cargos
cargoRouter.post('/', CargoController.create);
cargoRouter.get('/', CargoController.list);
cargoRouter.get('/:id', CargoController.getById);
cargoRouter.put('/:id', CargoController.update);
// A rota de delete pode ser adicionada aqui no futuro se necessário

module.exports = cargoRouter;