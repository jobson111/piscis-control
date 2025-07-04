// src/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // Pega o token do cabeçalho da requisição
    const authHeader = req.header('Authorization');

    // Verifica se o token existe
    if (!authHeader) {
        return res.status(401).json({ msg: 'Token não fornecido. Acesso negado.' });
    }

    // O token geralmente vem no formato "Bearer TOKEN_LONGO_AQUI"
    // Nós queremos apenas a parte do token.
    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ msg: 'Formato de token inválido. Acesso negado.' });
    }

    try {
        // Verifica se o token é válido usando a mesma chave secreta
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Adiciona o payload decodificado (que contém userId e pisciculturaId) ao objeto da requisição
        req.user = decoded; 
        
        // Deixa o pedido continuar para a rota final
        next(); 
    } catch (error) {
        res.status(401).json({ msg: 'Token inválido.' });
    }
};