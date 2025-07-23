// backend/src/routes/piscicultura.routes.js (VERSÃO COMPLETA E CORRIGIDA)

const { Router } = require('express');
const PisciculturaController = require('../controllers/PisciculturaController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');

const pisciculturaRouter = Router();

// Aplica a segurança a todas as rotas abaixo
pisciculturaRouter.use(authMiddleware);

// --- Rotas ---

// Lista os dados da sua própria piscicultura
pisciculturaRouter.get('/', PisciculturaController.listAll);

// Busca os detalhes da sua própria piscicultura por ID
pisciculturaRouter.get('/:id', PisciculturaController.getById);

// Atualiza os dados da sua própria piscicultura
pisciculturaRouter.put('/:id', checkPermission('piscicultura:configurar'), PisciculturaController.update);

// --- NOVA ROTA PARA AS CONFIGURAÇÕES ---
pisciculturaRouter.put('/configuracoes/financeiro', checkPermission('piscicultura:configurar'), PisciculturaController.updateConfiguracoes);


module.exports = pisciculturaRouter;