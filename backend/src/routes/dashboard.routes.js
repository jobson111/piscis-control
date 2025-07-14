// backend/src/routes/dashboard.routes.js
const { Router } = require('express');
const DashboardController = require('../controllers/DashboardController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware'); // 1. Importa


const dashboardRouter = Router();
dashboardRouter.use(authMiddleware);

// Rota para buscar os nossos novos KPIs
dashboardRouter.get('/kpis', checkPermission('dashboard:ver'), DashboardController.getKpis);

module.exports = dashboardRouter;