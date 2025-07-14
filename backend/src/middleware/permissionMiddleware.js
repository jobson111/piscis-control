// backend/src/middleware/permissionMiddleware.js

// Esta função não é um middleware, ela RETORNA um middleware.
const checkPermission = (requiredPermission) => {
    return (req, res, next) => {
        // Pega na lista de permissões que o authMiddleware já buscou
        const userPermissions = req.user?.permissoes || [];

        if (userPermissions.includes(requiredPermission)) {
            next(); // O usuário tem a permissão, pode passar.
        } else {
            // Se não tiver a permissão, retorna o erro 403 Forbidden (Proibido)
            res.status(403).json({ error: 'Acesso negado. Você não tem permissão para executar esta ação.' });
        }
    };
};

module.exports = checkPermission;