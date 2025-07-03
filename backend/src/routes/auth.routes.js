// src/routes/auth.routes.js
const { Router } = require('express');
const AuthController = require('../controllers/AuthController');

const authRouter = Router();

authRouter.post('/register', AuthController.register);
authRouter.post('/login', AuthController.login);

module.exports = authRouter;