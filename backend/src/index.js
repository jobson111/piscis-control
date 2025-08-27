// backend/src.js/index.js (VERSÃO FINAL E COMPLETA)

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// --- IMPORTAÇÃO DE TODOS OS ROUTERS ATIVOS ---
const authRouter = require('./routes/auth.routes');
const planoRouter = require('./routes/plano.routes');
const pisciculturaRouter = require('./routes/piscicultura.routes');
const tanqueRouter = require('./routes/tanque.routes');
const loteRouter = require('./routes/lote.routes.js');
const corpoDaguaRouter = require('./routes/corpoDagua.routes');
const biometriaRouter = require('./routes/biometria.routes');
const alimentacaoRouter = require('./routes/alimentacao.routes');
const qualidadeAguaRouter = require('./routes/qualidadeAgua.routes');
const formaPagamentoRouter = require('./routes/formaPagamento.routes');
const vendaRouter = require('./routes/venda.routes');
const clienteRouter = require('./routes/cliente.routes');
const categoriaDespesaRouter = require('./routes/categoriaDespesa.routes');
const contaFinanceiraRouter = require('./routes/contaFinanceira.routes');
const movimentacaoRouter = require('./routes/movimentacaoFinanceira.routes');
const financeiroRouter = require('./routes/financeiro.routes');
const relatorioRouter = require('./routes/relatorio.routes');
const manejoRouter = require('./routes/manejo.routes');
const usuarioRouter = require('./routes/usuario.routes');
const cargoRouter = require('./routes/cargo.routes');
const dashboardRouter = require('./routes/dashboard.routes');
const entradaPeixesRouter = require('./routes/entradaPeixes.routes');
const logRouter = require('./routes/log.routes');
const caktoRouter = require('./routes/cakto.routes'); // O nosso novo router

const app = express();

// --- MIDDLEWARES GLOBAIS ---
// Aplica o CORS para permitir pedidos do nosso frontend
app.use(cors());
// Aplica o parser de JSON para ler o corpo de TODAS as requisições
app.use(express.json());


// --- REGISTO DE TODAS AS ROTAS DA API ---
app.use('/auth', authRouter);
app.use('/planos', planoRouter);
app.use('/dashboard', dashboardRouter);
app.use('/pisciculturas', pisciculturaRouter);
app.use('/tanques', tanqueRouter);
app.use('/lotes', loteRouter);
app.use('/corpos-dagua', corpoDaguaRouter);
app.use('/manejos', manejoRouter);
app.use('/entradas', entradaPeixesRouter);
app.use('/clientes', clienteRouter);
app.use('/vendas', vendaRouter);
app.use('/formas-pagamento', formaPagamentoRouter);
app.use('/financeiro', financeiroRouter);
app.use('/contas-financeiras', contaFinanceiraRouter);
app.use('/categorias-despesa', categoriaDespesaRouter);
app.use('/movimentacoes', movimentacaoRouter);
app.use('/biometrias', biometriaRouter);
app.use('/alimentacao', alimentacaoRouter);
app.use('/qualidade-agua', qualidadeAguaRouter);
app.use('/usuarios', usuarioRouter);
app.use('/cargos', cargoRouter);
app.use('/relatorios', relatorioRouter);
app.use('/logs', logRouter);
app.use('/cakto', caktoRouter);


// --- INICIALIZAÇÃO DO SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor a rodar na porta ${PORT}`);
});