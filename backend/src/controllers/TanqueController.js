// backend/src/controllers/TanqueController.js (VERSÃO COMPLETA E SEGURA)

const db = require('../config/db');
const registrarLog = require('../helpers/logHelper'); // 1. Importamos a nossa nova ferramenta


// --- LISTAR todos os tanques da piscicultura do usuário logado ---
exports.listByPiscicultura = async (request, response) => {
    const { pisciculturaId } = request.user;

    try {
        // A consulta SQL agora também busca a quantidade e espécie do lote ativo, se houver
        const sql = `
            SELECT 
                t.*, 
                l.id as lote_ativo_id,
                l.quantidade_atual as lote_ativo_quantidade,
                l.especie as lote_ativo_especie,
                COUNT(l.id) > 0 as ocupado
            FROM 
                tanques t
            LEFT JOIN 
                lotes l ON t.id = l.tanque_id AND l.status = 'Ativo'
            WHERE 
                t.piscicultura_id = $1
            GROUP BY 
                t.id, l.id, l.quantidade_atual, l.especie
            ORDER BY 
                LENGTH(t.nome_identificador), t.nome_identificador ASC;
        `;
        
        const result = await db.query(sql, [pisciculturaId]);
        return response.status(200).json(result.rows);

    } catch (error) {
        console.error('Erro ao listar tanques:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// --- BUSCAR um tanque específico por ID ---
exports.getById = async (request, response) => {
    const { pisciculturaId } = request.user;
    const { id } = request.params;

    try {
        const result = await db.query(
            'SELECT * FROM tanques WHERE id = $1 AND piscicultura_id = $2',
            [id, pisciculturaId]
        );
        if (result.rowCount === 0) {
            return response.status(404).json({ error: 'Tanque não encontrado' });
        }
        return response.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar tanque por ID:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// --- CRIAR um novo tanque ---
exports.create = async (request, response) => {
    // 1. Pegamos TODOS os dados de que precisamos do request.user
    const { pisciculturaId, userId, nome: nomeUsuario } = request.user; 
    const { corpo_dagua_id, nome_identificador, tipo, dimensoes, capacidade_estimada_kg } = request.body;
    
    try {
        const sql = `
            INSERT INTO tanques (piscicultura_id, corpo_dagua_id, nome_identificador, tipo, dimensoes, capacidade_estimada_kg)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
        const values = [pisciculturaId, corpo_dagua_id, nome_identificador, tipo, dimensoes, capacidade_estimada_kg];
        const result = await db.query(sql, values);
        const novoTanque = result.rows[0];

                // 2. Registamos a ação no log
        await registrarLog(pisciculturaId, userId, nomeUsuario, `Criou o tanque '${novoTanque.nome_identificador}' (ID: ${novoTanque.id}).`);


        return response.status(201).json(novoTanque);
    } catch (error) {
        console.error('Erro ao criar tanque:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// --- ATUALIZAR um tanque ---
exports.update = async (request, response) => {
// 1. Pegamos TODOS os dados de que precisamos do request.user
    const { pisciculturaId, userId, nome: nomeUsuario } = request.user;     const { id } = request.params;
    const { nome_identificador, tipo, dimensoes, capacidade_estimada_kg, status, data_ultima_manutencao, corpo_dagua_id } = request.body;

    try {
        const sql = `
            UPDATE tanques 
            SET nome_identificador = $1, tipo = $2, dimensoes = $3, capacidade_estimada_kg = $4, status = $5, data_ultima_manutencao = $6, corpo_dagua_id = $7
            WHERE id = $8 AND piscicultura_id = $9
            RETURNING *
        `;
        const values = [nome_identificador, tipo, dimensoes, capacidade_estimada_kg, status, data_ultima_manutencao, corpo_dagua_id, id, pisciculturaId];

        const result = await db.query(sql, values);
        const novoTanque = result.rows[0];
        if (result.rowCount === 0) {
            return response.status(404).json({ error: 'Tanque não encontrado ou não pertence à sua piscicultura.' });
        }

                // 2. Registamos a ação no log
        await registrarLog(pisciculturaId, userId, nomeUsuario, `Atualizou o tanque '${novoTanque.nome_identificador}' (ID: ${novoTanque.id}).`);

        return response.status(200).json(novoTanque);
    } catch (error) {
        console.error('Erro ao atualizar tanque:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// --- DELETAR um tanque ---
exports.delete = async (request, response) => {
// 1. Pegamos TODOS os dados de que precisamos do request.user
    const { pisciculturaId, userId, nome: nomeUsuario } = request.user; 
    const { id } = request.params;

    try {
        // PASSO 1: Buscar o nome do tanque ANTES de o apagar
        const tanqueParaApagarResult = await db.query(
            'SELECT nome_identificador FROM tanques WHERE id = $1 AND piscicultura_id = $2', 
            [id, pisciculturaId]
        );
        
        if (tanqueParaApagarResult.rowCount === 0) {
            return response.status(404).json({ error: 'Tanque não encontrado ou não pertence à sua piscicultura.' });
        }
        const nomeTanqueApagado = tanqueParaApagarResult.rows[0].nome_identificador;

        const result = await db.query(
            'DELETE FROM tanques WHERE id = $1 AND piscicultura_id = $2', 
            [id, pisciculturaId]
        );

        // PASSO 3: Finalmente, registar a ação no log com o nome que guardámos
        await registrarLog(
            pisciculturaId, 
            userId, 
            nomeUsuario, 
            `Apagou o tanque '${nomeTanqueApagado}' (ID: ${id}).`
        );
        if (result.rowCount === 0) {
            return response.status(404).json({ error: 'Tanque não encontrado ou não pertence à sua piscicultura.' });
        }

        
        return response.status(204).send();
    } catch (error) {
        console.error('Erro ao deletar tanque:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};