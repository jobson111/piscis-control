// backend/src/controllers/UsuarioController.js
const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Lista todos os usuários da piscicultura do admin logado
exports.list = async (req, res) => {
    const { pisciculturaId } = req.user;
    try {
        const sql = `
            SELECT u.id, u.nome, u.email, c.nome as cargo_nome
            FROM usuarios u
            LEFT JOIN usuario_cargos uc ON u.id = uc.usuario_id
            LEFT JOIN cargos c ON uc.cargo_id = c.id
            WHERE u.piscicultura_id = $1
            ORDER BY u.nome;
        `;
        const result = await db.query(sql, [pisciculturaId]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

// Cria um novo usuário (convite)
exports.create = async (req, res) => {
    const { pisciculturaId } = req.user;
    const { nome, email, senha, cargo_id } = req.body;
    
    if (!nome || !email || !senha || !cargo_id) {
        return res.status(400).json({ error: "Nome, email, senha e cargo são obrigatórios."});
    }

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);

        const usuarioResult = await client.query(
            'INSERT INTO usuarios (piscicultura_id, nome, email, senha_hash) VALUES ($1, $2, $3, $4) RETURNING id',
            [pisciculturaId, nome, email, senhaHash]
        );
        const novoUsuarioId = usuarioResult.rows[0].id;

        await client.query(
            'INSERT INTO usuario_cargos (usuario_id, cargo_id) VALUES ($1, $2)',
            [novoUsuarioId, cargo_id]
        );

        await client.query('COMMIT');
        res.status(201).json({ success: true, message: 'Usuário criado com sucesso.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao criar usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    } finally {
        client.release();
    }
};

// Adicione funções de update e delete aqui no futuro, se necessário