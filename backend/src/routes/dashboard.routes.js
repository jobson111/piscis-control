// src/routes/dashboard.routes.js
const { Router } = require('express');
const DashboardController = require('../controllers/DashboardController');
const authMiddleware = require('../middleware/authMiddleware');

const dashboardRouter = Router();

// A rota será GET /dashboard e já está protegida pelo middleware
dashboardRouter.get('/', authMiddleware, DashboardController.getDashboardData);

module.exports = dashboardRouter;