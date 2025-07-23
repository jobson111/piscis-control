// backend/src/controllers/PisciculturaController.js (VERSÃO COMPLETA E SEGURA)

const db = require('../config/db');

// Lista apenas a piscicultura do usuário logado
exports.listAll = async (req, res) => {
    const { pisciculturaId } = req.user;

    try {
        const result = await db.query('SELECT * FROM pisciculturas WHERE id = $1', [pisciculturaId]);
        return res.status(200).json(result.rows);
    } catch (error) {
        console.error("Erro ao listar piscicultura:", error);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
};

// Busca os detalhes de uma piscicultura, mas só se pertencer ao usuário logado
exports.getById = async (req, res) => {
    const { pisciculturaId } = req.user;
    const { id } = req.params;

    // Converte o ID da URL para número para garantir a comparação correta
    const idDaUrl = parseInt(id, 10);

    // Verificação de autorização: o ID na URL é o mesmo do token?
    if (idDaUrl !== pisciculturaId) {
        return res.status(403).json({ error: 'Acesso não autorizado a esta piscicultura.' });
    }

    try {
        const result = await db.query('SELECT * FROM pisciculturas WHERE id = $1', [idDaUrl]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Piscicultura não encontrada' });
        }
        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar piscicultura por ID:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Adicione esta nova função ao seu PisciculturaController.js

exports.updateConfiguracoes = async (req, res) => {
    const { pisciculturaId } = req.user;
    const { modelo_financeiro } = req.body;

    // Validação para garantir que o valor é um dos esperados
    if (!modelo_financeiro || !['DIRETO', 'CONCILIACAO'].includes(modelo_financeiro)) {
        return res.status(400).json({ error: 'Modelo financeiro inválido.' });
    }

    try {
        const result = await db.query(
            'UPDATE pisciculturas SET modelo_financeiro = $1 WHERE id = $2',
            [modelo_financeiro, pisciculturaId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Piscicultura não encontrada.' });
        }

        res.status(200).json({ success: true, message: 'Configurações salvas com sucesso!' });
    } catch (error) {
        console.error('Erro ao atualizar configurações da piscicultura:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

// Atualiza os dados da piscicultura do usuário logado
exports.update = async (req, res) => {
    const { pisciculturaId } = req.user;
    const { id } = req.params;
    const { nome_fantasia, razao_social } = req.body;

    const idDaUrl = parseInt(id, 10);

    // Verificação de autorização
    if (idDaUrl !== pisciculturaId) {
        return res.status(403).json({ error: 'Não é permitido alterar dados de outra piscicultura.' });
    }

    try {
        const result = await db.query(
            'UPDATE pisciculturas SET nome_fantasia = $1, razao_social = $2 WHERE id = $3 RETURNING *',
            [nome_fantasia, razao_social, idDaUrl]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Piscicultura não encontrada para atualizar.' });
        }
        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar piscicultura:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Nota: Uma função de 'create' não é necessária aqui, pois ela é tratada pelo AuthController no registo.
// Nota: Uma função de 'delete' para pisciculturas é uma operação de alto risco (apagaria tudo)
// e por isso não a implementaremos por agora.