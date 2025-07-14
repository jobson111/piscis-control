// backend/src/middleware/authMiddleware.js (VERSÃO ATUALIZADA)

const jwt = require('jsonwebtoken');
const db = require('../config/db');

module.exports = async function (req, res, next) {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({ msg: 'Token não fornecido. Acesso negado.' });
    }

    try {
        const token = authHeader.split(' ')[1];
        if (!token) return res.status(401).json({ msg: 'Formato de token inválido.' });
        
        // Verifica o token e extrai o payload (userId, pisciculturaId)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Guarda o payload em req.user

        // --- NOVA LÓGICA ---
        // Agora, buscamos todas as permissões do usuário e as anexamos à requisição
        const permissoesSql = `
            SELECT DISTINCT p.acao
            FROM usuarios u
            JOIN usuario_cargos uc ON u.id = uc.usuario_id
            JOIN cargo_permissoes cp ON uc.cargo_id = cp.cargo_id
            JOIN permissoes p ON cp.permissao_id = p.id
            WHERE u.id = $1;
        `;
        const permissoesResult = await db.query(permissoesSql, [req.user.userId]);
        
        // Transforma o resultado do banco (array de objetos) num array simples de strings
        req.user.permissoes = permissoesResult.rows.map(p => p.acao);
        // Agora, req.user = { userId, pisciculturaId, permissoes: ['vendas:criar', 'tanques:ler', ...] }
        // --- FIM DA NOVA LÓGICA ---

        next(); // Permite que a requisição continue
    } catch (error) {
        res.status(401).json({ msg: 'Token inválido.' });
    }
};