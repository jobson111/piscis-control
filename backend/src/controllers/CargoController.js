// backend/src/controllers/CargoController.js

const db = require('../config/db');

// --- LISTAR todos os cargos da piscicultura ---
exports.list = async (req, res) => {
    const { pisciculturaId } = req.user;
    try {
        const result = await db.query(
            'SELECT * FROM cargos WHERE piscicultura_id = $1 ORDER BY nome',
            [pisciculturaId]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao listar cargos:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

// --- BUSCAR um cargo específico com suas permissões ---
exports.getById = async (req, res) => {
    const { pisciculturaId } = req.user;
    const { id } = req.params;
    try {
        const sql = `
            SELECT 
                c.id, c.nome, c.descricao,
                -- Agrega todas as permissões deste cargo num array de JSON
                COALESCE(
                    jsonb_agg(jsonb_build_object('id', p.id, 'acao', p.acao)) FILTER (WHERE p.id IS NOT NULL), 
                    '[]'
                ) as permissoes
            FROM cargos c
            LEFT JOIN cargo_permissoes cp ON c.id = cp.cargo_id
            LEFT JOIN permissoes p ON cp.permissao_id = p.id
            WHERE c.id = $1 AND c.piscicultura_id = $2
            GROUP BY c.id;
        `;
        const result = await db.query(sql, [id, pisciculturaId]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Cargo não encontrado.' });
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar cargo:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

// --- CRIAR um novo cargo e associar suas permissões ---
exports.create = async (req, res) => {
    const { pisciculturaId } = req.user;
    const { nome, descricao, permissoesIds } = req.body; // permissoesIds é um array de IDs: [1, 5, 12]

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        // Cria o cargo
        const cargoResult = await client.query(
            'INSERT INTO cargos (piscicultura_id, nome, descricao) VALUES ($1, $2, $3) RETURNING id',
            [pisciculturaId, nome, descricao]
        );
        const novoCargoId = cargoResult.rows[0].id;

        // Associa as permissões ao novo cargo
        if (permissoesIds && permissoesIds.length > 0) {
            const sqlPermissoes = 'INSERT INTO cargo_permissoes (cargo_id, permissao_id) VALUES ($1, $2)';
            for (const permissaoId of permissoesIds) {
                await client.query(sqlPermissoes, [novoCargoId, permissaoId]);
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ id: novoCargoId, nome, descricao, message: 'Cargo criado com sucesso.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao criar cargo:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    } finally {
        client.release();
    }
};

// --- ATUALIZAR um cargo e suas permissões ---
exports.update = async (req, res) => {
    const { pisciculturaId } = req.user;
    const { id } = req.params;
    const { nome, descricao, permissoesIds } = req.body;

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        // Atualiza os dados do cargo
        await client.query(
            'UPDATE cargos SET nome = $1, descricao = $2 WHERE id = $3 AND piscicultura_id = $4',
            [nome, descricao, id, pisciculturaId]
        );

        // Apaga as permissões antigas
        await client.query('DELETE FROM cargo_permissoes WHERE cargo_id = $1', [id]);

        // Insere as novas permissões
        if (permissoesIds && permissoesIds.length > 0) {
            const sqlPermissoes = 'INSERT INTO cargo_permissoes (cargo_id, permissao_id) VALUES ($1, $2)';
            for (const permissaoId of permissoesIds) {
                await client.query(sqlPermissoes, [id, permissaoId]);
            }
        }
        
        await client.query('COMMIT');
        res.status(200).json({ message: 'Cargo atualizado com sucesso.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao atualizar cargo:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    } finally {
        client.release();
    }
};


// --- ROTA BÓNUS: Listar todas as permissões disponíveis no sistema ---
exports.listAllPermissoes = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM permissoes ORDER BY acao');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao listar permissões:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};