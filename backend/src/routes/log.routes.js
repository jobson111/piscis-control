// backend/src/routes/log.routes.js
const { Router } = require('express');
const LogController = require('../controllers/LogController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');

const logRouter = Router();
logRouter.use(authMiddleware);

logRouter.get('/', checkPermission('logs:ler'), LogController.list);

module.exports = logRouter;