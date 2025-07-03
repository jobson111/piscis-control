// src/routes/piscicultura.routes.js

const { Router } = require('express');
const PisciculturaController = require('../controllers/PisciculturaController');
const authMiddleware = require('../middleware/authMiddleware');
const pisciculturaRouter = Router();

// Aplica o middleware a todas as rotas deste ficheiro
//pisciculturaRouter.use(authMiddleware);



// Rota para cadastrar uma nova piscicultura
pisciculturaRouter.post('/', authMiddleware, PisciculturaController.create);

// Rota para buscar uma piscicultura por ID
pisciculturaRouter.get('/:id', authMiddleware, PisciculturaController.getById);

// Rota para listar todas as pisciculturas
pisciculturaRouter.get('/', authMiddleware, PisciculturaController.listAll);

// Rota para atualizar uma piscicultura
pisciculturaRouter.put('/:id', authMiddleware, PisciculturaController.update);

// Rota para deletar uma piscicultura
pisciculturaRouter.delete('/:id', authMiddleware, PisciculturaController.delete);


module.exports = pisciculturaRouter;