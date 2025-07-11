// backend/src/routes/formaPagamento.routes.js
const { Router } = require('express');
const FormaPagamentoController = require('../controllers/FormaPagamentoController');
const authMiddleware = require('../middleware/authMiddleware');

const formaPagamentoRouter = Router();
formaPagamentoRouter.use(authMiddleware);

formaPagamentoRouter.post('/', FormaPagamentoController.create);
formaPagamentoRouter.get('/', FormaPagamentoController.list);
formaPagamentoRouter.put('/:id', FormaPagamentoController.update);

module.exports = formaPagamentoRouter;