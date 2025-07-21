// backend/src/routes/assinatura.routes.js
const { Router } = require('express');
const AssinaturaController = require('../controllers/AssinaturaController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');

const assinaturaRouter = Router();
assinaturaRouter.use(authMiddleware);

// Um usuário logado pode subscrever um plano para a sua própria piscicultura
assinaturaRouter.post('/', AssinaturaController.subscribe);

module.exports = assinaturaRouter;