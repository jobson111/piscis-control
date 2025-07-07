// backend/src/controllers/LoteController.js (VERSÃO COMPLETA E SEGURA)

const db = require('../config/db');

// A função de 'create' foi removida, pois a criação de lotes agora
// é da responsabilidade exclusiva do EntradaPeixesController para garantir a integridade dos dados.

// --- FUNÇÃO DE BUSCA UNIFICADA (LISTAR E BUSCAR POR ID) ---
// Esta função agora é 100% segura, usando o ID do token.
exports.find = async (request, response) => {
    const { pisciculturaId } = request.user; // ID seguro vindo do token
    const loteIdParam = request.params.id;   // ID do lote vindo da URL (ex: /lotes/5)
    const { tanque_id } = request.query;   // ID do tanque vindo da query (ex: /lotes?tanque_id=3)

    try {
        const baseQuery = `
            SELECT 
                l.*, 
                t.nome_identificador as nome_tanque 
            FROM lotes l
            LEFT JOIN tanques t ON l.tanque_id = t.id
        `;
        
        let sql;
        let values;

        if (loteIdParam) {
            // Cenário 1: Buscar um lote específico pelo seu ID
            const id = parseInt(loteIdParam, 10);
            if (isNaN(id)) return response.status(400).json({ error: 'ID de lote inválido.' });
            
            sql = `${baseQuery} WHERE l.id = $1 AND l.piscicultura_id = $2`;
            values = [id, pisciculturaId];

        } else if (tanque_id) {
            // Cenário 2: Listar todos os lotes de um tanque específico
            sql = `${baseQuery} WHERE l.tanque_id = $1 AND l.piscicultura_id = $2 ORDER BY l.data_entrada DESC`;
            values = [tanque_id, pisciculturaId];

        } else {
            // Cenário 3: Listar todos os lotes da piscicultura
            sql = `${baseQuery} WHERE l.piscicultura_id = $1 ORDER BY l.data_entrada DESC`;
            values = [pisciculturaId];
        }

        const result = await db.query(sql, values);

        // Se a busca for por ID e não encontrar nada, retorna 404. Senão, retorna o resultado.
        if (loteIdParam && result.rowCount === 0) {
            return response.status(404).json({ error: 'Lote não encontrado ou não pertence à sua piscicultura.' });
        }
        
        // Se a busca for por ID, retorna um único objeto, senão retorna a lista.
        return response.status(200).json(loteIdParam ? result.rows[0] : result.rows);

    } catch (error) {
        console.error('Erro ao buscar lotes:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};


// --- ATUALIZAR um lote (Update) ---
exports.update = async (request, response) => {
    const { pisciculturaId } = request.user;
    const { id } = request.params;
    const { tanque_id, status, quantidade_atual, peso_atual_medio_g, data_saida_estimada, data_saida_real } = request.body;

    try {
        const sql = `
            UPDATE lotes 
            SET tanque_id = $1, status = $2, quantidade_atual = $3, peso_atual_medio_g = $4, data_saida_estimada = $5, data_saida_real = $6
            WHERE id = $7 AND piscicultura_id = $8
            RETURNING *
        `;
        const values = [tanque_id, status, quantidade_atual, peso_atual_medio_g, data_saida_estimada, data_saida_real, id, pisciculturaId];

        const result = await db.query(sql, values);
        if (result.rowCount === 0) {
            return response.status(404).json({ error: 'Lote não encontrado ou não pertence à sua piscicultura.' });
        }
        return response.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar lote:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// --- DELETAR um lote (Delete) ---
exports.delete = async (request, response) => {
    const { pisciculturaId } = request.user;
    const { id } = request.params;

    try {
        const result = await db.query(
            'DELETE FROM lotes WHERE id = $1 AND piscicultura_id = $2',
            [id, pisciculturaId]
        );
        if (result.rowCount === 0) {
            return response.status(404).json({ error: 'Lote não encontrado ou não pertence à sua piscicultura.' });
        }
        return response.status(204).send();
    } catch (error) {
        console.error('Erro ao deletar lote:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};