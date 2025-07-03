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
        // 1. Encontra o usuário pelo email
        const userResult = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (userResult.rowCount === 0) {
            return res.status(401).json({ error: 'Credenciais inválidas' }); // Usuário não encontrado
        }
        const usuario = userResult.rows[0];

        // 2. Compara a senha enviada com a senha criptografada no banco
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);
        if (!senhaCorreta) {
            return res.status(401).json({ error: 'Credenciais inválidas' }); // Senha incorreta
        }

        // 3. Se a senha estiver correta, cria o token de acesso (JWT)
        const token = jwt.sign(
            { 
                userId: usuario.id, 
                pisciculturaId: usuario.piscicultura_id 
            },
            process.env.JWT_SECRET, // Chave secreta. Em produção, isso deve vir de uma variável de ambiente!
            { expiresIn: '8h' } // Token expira em 8 horas
        );

        res.status(200).json({
            message: 'Login bem-sucedido!',
            token: token
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};