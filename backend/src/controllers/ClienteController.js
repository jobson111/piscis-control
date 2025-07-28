// backend/src/controllers/ClienteController.js (VERSÃO FINAL COM LOGS CORRIGIDOS)

const db = require('../config/db');
const registrarLog = require('../helpers/logHelper');

exports.create = async (req, res) => {
    // É crucial extrair os dados do usuário AQUI, no início da função
    const { pisciculturaId, userId, nome: nomeUsuario } = req.user;
    const { 
        nome, tipo_pessoa, cpf_cnpj, email, telefone, endereco,
        contato_nome, contato_cargo, contato_email, contato_telefone 
    } = req.body;

    try {
        const sql = `
            INSERT INTO clientes (piscicultura_id, nome, tipo_pessoa, cpf_cnpj, email, telefone, endereco, contato_nome, contato_cargo, contato_email, contato_telefone)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *;
        `;
        const values = [
            pisciculturaId, nome, tipo_pessoa, cpf_cnpj, email, telefone, endereco,
            contato_nome, contato_cargo, contato_email, contato_telefone
        ];

        const result = await db.query(sql, values);
        const novoCliente = result.rows[0];

        // A chamada de log agora tem todas as variáveis de que precisa
        await registrarLog(pisciculturaId, userId, nomeUsuario, `Criou o cliente '${novoCliente.nome}' (ID: ${novoCliente.id}).`);

        res.status(201).json(novoCliente);
    } catch (error) {
        console.error('Erro ao criar cliente:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

exports.listByPiscicultura = async (req, res) => {
    const { pisciculturaId } = req.user;
    try {
        const result = await db.query('SELECT * FROM clientes WHERE piscicultura_id = $1 ORDER BY nome ASC', [pisciculturaId]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao listar clientes:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

exports.getById = async (req, res) => {
    const { pisciculturaId } = req.user;
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM clientes WHERE id = $1 AND piscicultura_id = $2', [id, pisciculturaId]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Cliente não encontrado.' });
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar cliente por ID:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

exports.update = async (req, res) => {
    const { pisciculturaId, userId, nome: nomeUsuario } = req.user;
    const { id } = req.params;
    const { nome, tipo_pessoa, cpf_cnpj, email, telefone, endereco, contato_nome, contato_cargo, contato_email, contato_telefone, status } = req.body;

    try {
        const sql = `UPDATE clientes SET nome = $1, tipo_pessoa = $2, cpf_cnpj = $3, email = $4, telefone = $5, endereco = $6, contato_nome = $7, contato_cargo = $8, contato_email = $9, contato_telefone = $10, status = $11 WHERE id = $12 AND piscicultura_id = $13 RETURNING *;`;
        const values = [nome, tipo_pessoa, cpf_cnpj, email, telefone, endereco, contato_nome, contato_cargo, contato_email, contato_telefone, status, id, pisciculturaId];
        
        const result = await db.query(sql, values);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Cliente não encontrado.' });

        await registrarLog(pisciculturaId, userId, nomeUsuario, `Atualizou os dados do cliente '${result.rows[0].nome}' (ID: ${id}).`);
        
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar cliente:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

exports.delete = async (req, res) => {
    const { pisciculturaId, userId, nome: nomeUsuario } = req.user;
    const { id } = req.params;
    try {
        const clienteParaApagar = await db.query('SELECT nome FROM clientes WHERE id = $1 AND piscicultura_id = $2', [id, pisciculturaId]);
        if (clienteParaApagar.rowCount === 0) return res.status(404).json({ error: 'Cliente não encontrado.' });
        
        const nomeClienteApagado = clienteParaApagar.rows[0].nome;
        
        await db.query('DELETE FROM clientes WHERE id = $1 AND piscicultura_id = $2', [id, pisciculturaId]);

        await registrarLog(pisciculturaId, userId, nomeUsuario, `Apagou o cliente '${nomeClienteApagado}' (ID: ${id}).`);

        res.status(204).send();
    } catch (error) {
        console.error('Erro ao deletar cliente:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};