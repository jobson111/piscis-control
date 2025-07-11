// backend/src/routes/dashboard.routes.js
const { Router } = require('express');
const DashboardController = require('../controllers/DashboardController');
const authMiddleware = require('../middleware/authMiddleware');

const dashboardRouter = Router();
dashboardRouter.use(authMiddleware);

// Rota para buscar os nossos novos KPIs
dashboardRouter.get('/kpis', DashboardController.getKpis);

module.exports = dashboardRouter;