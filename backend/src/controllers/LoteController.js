// backend/src/controllers/LoteController.js (VERSÃO COMPLETA E SEGURA)

const db = require('../config/db');

// A função de 'create' foi removida, pois a criação de lotes agora
// é da responsabilidade exclusiva do EntradaPeixesController para garantir a integridade dos dados.

// --- FUNÇÃO DE BUSCA UNIFICADA (LISTAR E BUSCAR POR ID) ---
// Esta função agora é 100% segura, usando o ID do token.
// --- FUNÇÃO DE BUSCA UNIFICADA E SEGURA (LISTAR E BUSCAR POR ID) ---
exports.find = async (request, response) => {
    // ID seguro vindo do token de autenticação
    const { pisciculturaId } = request.user;
    
    // Parâmetros que podem vir da requisição
    const loteIdParam = request.params.id;         // da URL, ex: /lotes/5
    const { tanque_id, status } = request.query;   // da query string, ex: /lotes?status=Ativo

    try {
        const baseQuery = `
            SELECT 
                l.*, 
                t.nome_identificador as nome_tanque 
            FROM lotes l
            LEFT JOIN tanques t ON l.tanque_id = t.id
        `;
        
        let conditions = ['l.piscicultura_id = $1'];
        let values = [pisciculturaId];
        let paramIndex = 2;

        if (loteIdParam) {
            // Se um ID foi passado na URL, busca um lote específico
            conditions.push(`l.id = $${paramIndex++}`);
            values.push(parseInt(loteIdParam, 10));
        }

        if (tanque_id) {
            // Se um tanque_id foi passado na query, adiciona o filtro
            conditions.push(`l.tanque_id = $${paramIndex++}`);
            values.push(tanque_id);
        }

        if (status) {
            // Se um status foi passado na query, adiciona o filtro
            conditions.push(`l.status = $${paramIndex++}`);
            values.push(status);
        }

        // Monta a consulta final
        const sql = `${baseQuery} WHERE ${conditions.join(' AND ')} ORDER BY l.data_entrada DESC, l.id DESC`;

        const result = await db.query(sql, values);

        // Se a busca foi por um ID específico e não encontrou nada, retorna 404
        if (loteIdParam && result.rowCount === 0) {
            return response.status(404).json({ error: 'Lote não encontrado ou não pertence à sua piscicultura.' });
        }
        
        // Se a busca foi por ID, retorna um único objeto; senão, retorna a lista (array)
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