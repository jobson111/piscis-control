// backend/src/middleware/authMiddleware.js (VERSÃO FINAL COM LÓGICA DE TRIAL)
const jwt = require('jsonwebtoken');
const db = require('../config/db');

module.exports = async function (req, res, next) {
    const authHeader = req.header('Authorization');
    if (!authHeader) return res.status(401).json({ msg: 'Token não fornecido.' });

    try {
        const token = authHeader.split(' ')[1];
        if (!token) return res.status(401).json({ msg: 'Formato de token inválido.' });
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        const pisciculturaResult = await db.query(
            'SELECT status_assinatura, data_expiracao_assinatura FROM pisciculturas WHERE id = $1',
            [req.user.pisciculturaId]
        );
        if (pisciculturaResult.rowCount === 0) return res.status(403).json({ error: 'Piscicultura não encontrada.' });
        
        const assinatura = pisciculturaResult.rows[0];
        const hoje = new Date();
        const dataExpiracao = new Date(assinatura.data_expiracao_assinatura);

        // Se o trial expirou, bloqueia o acesso
        if (assinatura.status_assinatura === 'TRIAL' && hoje > dataExpiracao) {
             return res.status(403).json({ error: 'O seu período de teste expirou. Por favor, escolha um plano para continuar.' });
        }
        
        // Se estiver em TRIAL (e não expirado), ou se a assinatura estiver ATIVA
        if (assinatura.status_assinatura === 'TRIAL' || assinatura.status_assinatura === 'ATIVO') {
            const permissoesResult = await db.query(
                `SELECT DISTINCT p.acao FROM usuarios u
                 JOIN usuario_cargos uc ON u.id = uc.usuario_id
                 JOIN cargo_permissoes cp ON uc.cargo_id = cp.cargo_id
                 JOIN permissoes p ON cp.permissao_id = p.id
                 WHERE u.id = $1;`,
                [req.user.userId]
            );
            req.user.permissoes = permissoesResult.rows.map(p => p.acao);
        } else {
            // Se não for nem trial nem ativo (ex: CANCELADO), não carrega permissões
            req.user.permissoes = [];
        }

        next();
    } catch (error) {
        res.status(401).json({ msg: 'Token inválido.' });
    }
};