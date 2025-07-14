// src/controllers/AuthController.js

const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- REGISTRO DE UM NOVO USUÁRIO E SUA PISCICULTURA ---
exports.register = async (req, res) => {
    const { nomePiscicultura, cnpj, nomeUsuario, email, senha } = req.body;

    const client = await db.pool.connect(); // Pega um cliente do pool para a transação

    try {
        await client.query('BEGIN'); // Inicia a transação

        // 1. Criptografa a senha
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);

        // 2. Cria a nova piscicultura
        const pisciculturaSql = 'INSERT INTO pisciculturas (nome_fantasia, cnpj) VALUES ($1, $2) RETURNING id';
        const pisciculturaResult = await client.query(pisciculturaSql, [nomePiscicultura, cnpj]);
        const novaPisciculturaId = pisciculturaResult.rows[0].id;

        // 3. Cria o novo usuário e o associa à piscicultura recém-criada
        const usuarioSql = 'INSERT INTO usuarios (piscicultura_id, nome, email, senha_hash) VALUES ($1, $2, $3, $4) RETURNING id, nome, email';
        const usuarioResult = await client.query(usuarioSql, [novaPisciculturaId, nomeUsuario, email, senhaHash]);

        await client.query('COMMIT'); // Se tudo deu certo, confirma as operações

        res.status(201).json({
            message: "Piscicultura e usuário registrados com sucesso!",
            usuario: usuarioResult.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK'); // Se algo deu errado, desfaz tudo
        console.error('Erro no registro:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao tentar registrar.' });
    } finally {
        client.release(); // Libera o cliente de volta para o pool
    }
};


// --- LOGIN DE UM USUÁRIO EXISTENTE ---
exports.login = async (req, res) => {
    const { email, senha } = req.body;
    try {
        const userResult = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (userResult.rowCount === 0) return res.status(400).json({ msg: 'Credenciais inválidas.' });

        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(senha, user.senha_hash);
        if (!isMatch) return res.status(400).json({ msg: 'Credenciais inválidas.' });

        // --- NOVA LÓGICA ---
        // Busca as permissões do usuário
        const permissoesResult = await db.query(`
            SELECT DISTINCT p.acao FROM usuarios u
            JOIN usuario_cargos uc ON u.id = uc.usuario_id
            JOIN cargo_permissoes cp ON uc.cargo_id = cp.cargo_id
            JOIN permissoes p ON cp.permissao_id = p.id
            WHERE u.id = $1;
        `, [user.id]);
        const permissoes = permissoesResult.rows.map(p => p.acao);

        // Cria o payload com os dados do usuário E suas permissões
        const payload = {
            userId: user.id,
            nome: user.nome,
            pisciculturaId: user.piscicultura_id,
            permissoes: permissoes // Inclui o array de permissões
        };
        // --- FIM DA NOVA LÓGICA ---

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (error) {
        res.status(500).send('Erro no servidor');
    }
};