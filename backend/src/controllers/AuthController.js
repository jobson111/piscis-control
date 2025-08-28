// src/controllers/AuthController.js

const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const registrarLog = require('../helpers/logHelper');


// --- REGISTRO DE UM NOVO USUÁRIO E SUA PISCICULTURA ---
// SUBSTITUA a função 'register' por esta

// Em backend/src/controllers/AuthController.js
// SUBSTITUA a função 'register' por esta
exports.register = async (req, res) => {
    const { nomePiscicultura, cnpj, nomeUsuario, email, senha } = req.body;
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Cria a nova piscicultura com plano_id NULO e status TRIAL
        const pisciculturaSql = `
            INSERT INTO pisciculturas (nome_fantasia, cnpj, plano_id, status_assinatura, data_expiracao_assinatura) 
            VALUES ($1, $2, NULL, 'TRIAL', NOW() + interval '30 days') RETURNING id;
        `;
        const pisciculturaResult = await client.query(pisciculturaSql, [nomePiscicultura, cnpj]);
        const novaPisciculturaId = pisciculturaResult.rows[0].id;

        // 2. Cria o usuário Dono
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);
        const usuarioResult = await client.query(
            'INSERT INTO usuarios (piscicultura_id, nome, email, senha_hash) VALUES ($1, $2, $3, $4) RETURNING id',
            [novaPisciculturaId, nomeUsuario, email, senhaHash]
        );
        const novoUsuarioId = usuarioResult.rows[0].id;

        // 3. Cria o cargo "Administrador" e atribui TODAS as permissões a ele
        const cargoResult = await client.query("INSERT INTO cargos (piscicultura_id, nome, descricao) VALUES ($1, 'Administrador', 'Acesso total.') RETURNING id", [novaPisciculturaId]);
        const adminCargoId = cargoResult.rows[0].id;
        await client.query("INSERT INTO cargo_permissoes (cargo_id, permissao_id) SELECT $1, id FROM permissoes", [adminCargoId]);
        await client.query("INSERT INTO usuario_cargos (usuario_id, cargo_id) VALUES ($1, $2)", [novoUsuarioId, adminCargoId]);

        await client.query('COMMIT');
        await registrarLog(novaPisciculturaId, novoUsuarioId, nomeUsuario, `Registou a piscicultura '${nomePiscicultura}'.`);
        res.status(201).json({ success: true, message: "Registado com sucesso no período de teste!" });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro no registro:', error.message);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    } finally {
        client.release();
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
            email: user.email, // A linha que faltava
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