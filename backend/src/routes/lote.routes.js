// src/routes/lote.routes.js (VERSÃO FINAL E ROBUSTA)
const { Router } = require('express');
const LoteController = require('../controllers/LoteController');
const authMiddleware = require('../middleware/authMiddleware');

const loteRouter = Router();

// Aplica a segurança em todas as rotas
//loteRouter.use(authMiddleware);

// Agora temos UMA rota GET que lida com tudo, graças à nossa nova função 'find'
loteRouter.get('/:id', LoteController.find); // Para /lotes/1, /lotes/2, etc.
loteRouter.get('/', LoteController.find);   // Para /lotes?piscicultura_id=1 ou ?tanque_id=1

loteRouter.post('/', authMiddleware, LoteController.create);
loteRouter.put('/:id', authMiddleware, LoteController.update);
loteRouter.delete('/:id', authMiddleware, LoteController.delete);

module.exports = loteRouter;