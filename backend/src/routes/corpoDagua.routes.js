// src/routes/corpoDagua.routes.js
const { Router } = require('express');
const CorpoDaguaController = require('../controllers/CorpoDaguaController');
const authMiddleware = require('../middleware/authMiddleware');

const corpoDaguaRouter = Router();

//corpoDaguaRouter.use(authMiddleware);

corpoDaguaRouter.post('/', authMiddleware, CorpoDaguaController.create);
corpoDaguaRouter.get('/', authMiddleware, CorpoDaguaController.listByPiscicultura);

module.exports = corpoDaguaRouter;