// src/routes/tanque.routes.js

const { Router } = require('express');
const TanqueController = require('../controllers/TanqueController');
const authMiddleware = require('../middleware/authMiddleware');


const tanqueRouter = Router();

//tanqueRouter.use(authMiddleware);
tanqueRouter.get('/:id', authMiddleware, TanqueController.getById);
tanqueRouter.put('/:id', authMiddleware, TanqueController.update);
tanqueRouter.delete('/:id', authMiddleware, TanqueController.delete);
tanqueRouter.post('/', authMiddleware, TanqueController.create);
tanqueRouter.get('/', authMiddleware, TanqueController.listByPiscicultura); // Lista tanques por piscicultura


module.exports = tanqueRouter;