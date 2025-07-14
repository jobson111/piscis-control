// backend/src/routes/lote.routes.js (VERSÃO ATUALIZADA)

const { Router } = require('express');
const LoteController = require('../controllers/LoteController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware'); // 1. Importa


const loteRouter = Router();

// Aplica a segurança em todas as rotas
loteRouter.use(authMiddleware);

// A nossa nova função 'find' serve tanto para buscar por ID quanto para listar
loteRouter.get('/:id', checkPermission('lotes:ler'), LoteController.find);
// --- NOVA ROTA PARA PROJEÇÃO ---
loteRouter.get('/:id/projecao', checkPermission('lotes:ler'), LoteController.getProjecaoCrescimento);
 
loteRouter.get('/', checkPermission('lotes:ler'), LoteController.find);   

// As rotas de update e delete continuam as mesmas
loteRouter.put('/:id', LoteController.update);
loteRouter.delete('/:id', LoteController.delete);

// A rota POST foi removida deste router.

module.exports = loteRouter;