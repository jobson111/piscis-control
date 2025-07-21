// src/testServer.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importamos o nosso StripeController completo
const StripeController = require('./controllers/StripeController');

const app = express();
app.use(cors());

console.log("--- SERVIDOR DE TESTE INICIADO ---");
console.log("A escutar apenas na rota /stripe/webhook");

// A nossa única rota, configurada da forma correta para receber o corpo bruto da requisição
app.post('/stripe/webhook', express.raw({ type: 'application/json' }), StripeController.handleWebhook);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor de TESTE a rodar na porta ${PORT}`));