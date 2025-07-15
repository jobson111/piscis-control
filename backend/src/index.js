// src/index.js


const express = require('express');
const pisciculturaRouter = require('./routes/piscicultura.routes'); // 1. Importa nossas rotas
const authRouter = require('./routes/auth.routes');

const tanqueRouter = require('./routes/tanque.routes');
const loteRouter = require('./routes/lote.routes');
const biometriaRouter = require('./routes/biometria.routes');
const alimentacaoRouter = require('./routes/alimentacao.routes');
const qualidadeAguaRouter = require('./routes/qualidadeAgua.routes');
const corpoDaguaRouter = require('./routes/corpoDagua.routes');
const dashboardRouter = require('./routes/dashboard.routes');
const entradaPeixesRouter = require('./routes/entradaPeixes.routes'); 
const manejoRouter = require('./routes/manejo.routes');
const clienteRouter = require('./routes/cliente.routes');
const formaPagamentoRouter = require('./routes/formaPagamento.routes');
const vendaRouter = require('./routes/venda.routes');
const cargoRouter = require('./routes/cargo.routes');
const usuarioRouter = require('./routes/usuario.routes');
const contaFinanceiraRouter = require('./routes/contaFinanceira.routes');
const categoriaDespesaRouter = require('./routes/categoriaDespesa.routes');
const movimentacaoRouter = require('./routes/movimentacaoFinanceira.routes');
const financeiroRouter = require('./routes/financeiro.routes');
const relatorioRouter = require('./routes/relatorio.routes');










const cors = require('cors');




const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors()); // Habilita o CORS para todas as origens
// 2. Middleware para o Express entender JSON no corpo das requisições
app.use(express.json());

// 3. Diz ao app para usar o nosso roteador na rota base /pisciculturas
app.use('/auth', authRouter); // Rotas de autenticação


app.use('/pisciculturas', pisciculturaRouter);
app.use('/tanques', tanqueRouter);
app.use('/lotes', loteRouter);
app.use('/biometrias', biometriaRouter);
app.use('/alimentacao', alimentacaoRouter);
app.use('/qualidade-agua', qualidadeAguaRouter); // Usando um nome amigável para a URL
app.use('/corpos-dagua', corpoDaguaRouter);
app.use('/dashboard', dashboardRouter);
app.use('/entradas', entradaPeixesRouter); 
app.use('/manejos', manejoRouter);
app.use('/clientes', clienteRouter);
app.use('/formas-pagamento', formaPagamentoRouter);
app.use('/vendas', vendaRouter);
app.use('/cargos', cargoRouter);
app.use('/usuarios', usuarioRouter);
app.use('/contas-financeiras', contaFinanceiraRouter);
app.use('/categorias-despesa', categoriaDespesaRouter);
app.use('/movimentacoes', movimentacaoRouter);
app.use('/financeiro', financeiroRouter);
app.use('/relatorios', relatorioRouter);











// Rota raiz da aplicação
app.get('/', (request, response) => {
    response.json({ message: 'API do Piscis Control no ar!' });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta http://localhost:${PORT}`);
});