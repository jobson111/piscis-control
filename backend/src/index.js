// backend/src/index.js (VERSÃO FINAL COM CORS FLEXÍVEL)

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// --- IMPORTAÇÕES (coloque todas as suas aqui) ---
const CaktoController = require('./controllers/CaktoController');
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
const caktoRouter = require('./routes/cakto.routes');
// ... etc ...

const app = express();

// --- CONFIGURAÇÃO DE CORS FINAL E ROBUSTA ---
// Lista de todos os endereços que têm permissão para aceder à nossa API
const allowedOrigins = [
    'http://localhost:5173', // Para o nosso desenvolvimento local
    'https://piscis-control.vercel.app', // A sua URL de produção sem a barra
    'https://piscis-control.vercel.app/'  // A sua URL de produção COM a barra
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permite pedidos sem 'origin' (como o Insomnia ou apps móveis)
    if (!origin) return callback(null, true);
    
    // Verifica se a origem do pedido está na nossa lista de permissões
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'A política de CORS para este site não permite acesso a partir da origem especificada.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
// --- FIM DA CONFIGURAÇÃO ---


// --- ORDEM DE EXECUÇÃO CRÍTICA ---
app.post('/webhooks/cakto', express.json(), CaktoController.handleWebhook);
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
// A nossa rota do Cakto, incluindo o webhook, é registada aqui
app.use('/cakto', caktoRouter); 


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor a rodar na porta ${PORT}`);
});