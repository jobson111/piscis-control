// src/routes/piscicultura.routes.js (VERSÃO CORRIGIDA E LIMPA)

const { Router } = require('express');
const PisciculturaController = require('../controllers/PisciculturaController');
const authMiddleware = require('../middleware/authMiddleware');

const pisciculturaRouter = Router();

// Aplica a segurança a todas as rotas abaixo
pisciculturaRouter.use(authMiddleware);

// --- Rotas que fazem sentido para um usuário logado ---

// Lista os dados da sua própria piscicultura
pisciculturaRouter.get('/', PisciculturaController.listAll);

// Busca os detalhes da sua própria piscicultura por ID
pisciculturaRouter.get('/:id', PisciculturaController.getById);

// Atualiza os dados da sua própria piscicultura
pisciculturaRouter.put('/:id', PisciculturaController.update);

// A rota POST foi removida pois o AuthController lida com a criação no registo.
// A rota DELETE foi omitida por ser uma operação de alto risco.

module.exports = pisciculturaRouter;