// src/controllers/LoteController.js (VERSÃO FINAL E ROBUSTA)

const db = require('../config/db');

// --- CRIAR um novo lote (Create) ---
// (Esta função permanece a mesma)
exports.create = async (request, response) => {
    const { piscicultura_id, tanque_id, especie, quantidade_inicial, peso_inicial_medio_g, data_entrada } = request.body;
    try {
        const sql = `
            INSERT INTO lotes (piscicultura_id, tanque_id, especie, quantidade_inicial, peso_inicial_medio_g, data_entrada)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const values = [piscicultura_id, tanque_id, especie, quantidade_inicial, peso_inicial_medio_g, data_entrada];
        const result = await db.query(sql, values);
        const loteCriado = result.rows[0];
        await db.query('UPDATE lotes SET quantidade_atual = $1 WHERE id = $2', [loteCriado.quantidade_inicial, loteCriado.id]);
        loteCriado.quantidade_atual = loteCriado.quantidade_inicial;
        return response.status(201).json(loteCriado);
    } catch (error) {
        console.error('Erro ao criar lote:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// --- FUNÇÃO DE BUSCA UNIFICADA (LISTAR E BUSCAR POR ID) ---
exports.find = async (request, response) => {
    const loteId = request.params.id; // Pega o ID da rota, se existir
    const { piscicultura_id, tanque_id } = request.query; // Pega filtros da query

    try {
        const baseQuery = `
            SELECT 
                l.*, 
                t.nome_identificador as nome_tanque 
            FROM lotes l
            LEFT JOIN tanques t ON l.tanque_id = t.id
        `;
        
        let result;

        if (loteId) {
            // Se um ID foi passado na rota, busca um lote específico
            const id = parseInt(loteId, 10);
            if (isNaN(id)) return response.status(400).json({ error: 'ID de lote inválido.' });
            
            result = await db.query(`${baseQuery} WHERE l.id = $1`, [id]);
            if (result.rowCount === 0) {
                return response.status(404).json({ error: 'Lote não encontrado' });
            }
            return response.status(200).json(result.rows[0]); // Retorna um único objeto

        } else if (tanque_id) {
            // Se não, se um tanque_id foi passado na query, filtra por ele
            result = await db.query(`${baseQuery} WHERE l.tanque_id = $1 ORDER BY l.data_entrada DESC`, [tanque_id]);
            return response.status(200).json(result.rows); // Retorna uma lista

        } else if (piscicultura_id) {
            // Se não, se um piscicultura_id foi passado, filtra por ele
            result = await db.query(`${baseQuery} WHERE l.piscicultura_id = $1 ORDER BY l.data_entrada DESC`, [piscicultura_id]);
            return response.status(200).json(result.rows); // Retorna uma lista
            
        } else {
            // Se nenhum filtro foi fornecido
            return response.status(400).json({ error: 'É obrigatório fornecer um filtro (piscicultura_id ou tanque_id).' });
        }

    } catch (error) {
        console.error('Erro ao buscar lotes:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};


// --- ATUALIZAR um lote (Update) ---
// (Esta função permanece a mesma)
exports.update = async (request, response) => {
    const { id } = request.params;
    const { tanque_id, status, quantidade_atual, peso_atual_medio_g, data_saida_estimada, data_saida_real } = request.body;
    try {
        const sql = `
            UPDATE lotes SET tanque_id = $1, status = $2, quantidade_atual = $3, peso_atual_medio_g = $4, data_saida_estimada = $5, data_saida_real = $6
            WHERE id = $7 RETURNING *
        `;
        const values = [tanque_id, status, quantidade_atual, peso_atual_medio_g, data_saida_estimada, data_saida_real, id];
        const result = await db.query(sql, values);
        if (result.rowCount === 0) {
            return response.status(404).json({ error: 'Lote não encontrado' });
        }
        return response.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar lote:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// --- DELETAR um lote (Delete) ---
// (Esta função permanece a mesma)
exports.delete = async (request, response) => {
    const { id } = request.params;
    try {
        const result = await db.query('DELETE FROM lotes WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return response.status(404).json({ error: 'Lote não encontrado' });
        }
        return response.status(204).send();
    } catch (error) {
        console.error('Erro ao deletar lote:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};