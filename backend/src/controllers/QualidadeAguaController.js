// src/controllers/QualidadeAguaController.js (VERSÃO COMPLETA E ATUALIZADA)

const db = require('../config/db');

// --- CRIAR um novo registro (lógica atualizada) ---
exports.create = async (request, response) => {
    // Agora podemos receber tanque_id OU corpo_dagua_id
    const { tanque_id, corpo_dagua_id, piscicultura_id, ph, temperatura_celsius, oxigenio_dissolvido_mg_l, amonia_total_mg_l, nitrito_mg_l, transparencia_cm, observacoes } = request.body;

    // Validação: garante que ou tanque_id ou corpo_dagua_id foi enviado, mas não ambos.
    if ((!tanque_id && !corpo_dagua_id) || (tanque_id && corpo_dagua_id)) {
        return response.status(400).json({ error: 'Forneça `tanque_id` OU `corpo_dagua_id`, mas não ambos.' });
    }

    try {
        let sql, values;
        // Monta a query dinamicamente baseado no que foi recebido
        if (tanque_id) {
            sql = `INSERT INTO registros_qualidade_agua (tanque_id, piscicultura_id, ph, temperatura_celsius, ...) VALUES ($1, $2, $3, $4, ...) RETURNING *`;
            // Adapte os $ e os valores para todas as suas colunas
            sql = `INSERT INTO registros_qualidade_agua (tanque_id, piscicultura_id, ph, temperatura_celsius, oxigenio_dissolvido_mg_l, amonia_total_mg_l, nitrito_mg_l, transparencia_cm, observacoes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`;
            values = [tanque_id, piscicultura_id, ph, temperatura_celsius, oxigenio_dissolvido_mg_l, amonia_total_mg_l, nitrito_mg_l, transparencia_cm, observacoes];
        } else { // se não for tanque_id, é corpo_dagua_id
            sql = `INSERT INTO registros_qualidade_agua (corpo_dagua_id, piscicultura_id, ph, temperatura_celsius, oxigenio_dissolvido_mg_l, amonia_total_mg_l, nitrito_mg_l, transparencia_cm, observacoes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`;
            values = [corpo_dagua_id, piscicultura_id, ph, temperatura_celsius, oxigenio_dissolvido_mg_l, amonia_total_mg_l, nitrito_mg_l, transparencia_cm, observacoes];
        }
        
        const result = await db.query(sql, values);
        return response.status(201).json(result.rows[0]);

    } catch (error) {
        console.error('Erro ao registrar qualidade da água:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// --- LISTAR registros (lógica atualizada) ---
exports.list = async (request, response) => {
    const { tanque_id, corpo_dagua_id } = request.query;

    if (!tanque_id && !corpo_dagua_id) {
        return response.status(400).json({ error: 'Forneça um `tanque_id` ou `corpo_dagua_id` para filtrar.' });
    }

    try {
        let sql, values;
        if (tanque_id) {
            sql = 'SELECT * FROM registros_qualidade_agua WHERE tanque_id = $1 ORDER BY data_medicao DESC';
            values = [tanque_id];
        } else {
            sql = 'SELECT * FROM registros_qualidade_agua WHERE corpo_dagua_id = $1 ORDER BY data_medicao DESC';
            values = [corpo_dagua_id];
        }

        const result = await db.query(sql, values);
        return response.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao listar registros de qualidade da água:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// ... a função delete pode permanecer a mesma, pois deleta por 'id' do registro ...
exports.delete = async (request, response) => {
    const { id } = request.params;
    try {
        const result = await db.query('DELETE FROM registros_qualidade_agua WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return response.status(404).json({ error: 'Registro de qualidade da água não encontrado' });
        }
        return response.status(204).send();
    } catch (error) {
        console.error('Erro ao deletar registro de qualidade da água:', error);
        return response.status(500).json({ error: 'Erro interno do servidor' });
    }
};