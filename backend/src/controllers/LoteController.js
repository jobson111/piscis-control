// backend/src/controllers/LoteController.js (VERSÃO COMPLETA E SEGURA)

const db = require('../config/db');

// A função de 'create' foi removida, pois a criação de lotes agora
// é da responsabilidade exclusiva do EntradaPeixesController para garantir a integridade dos dados.

// --- FUNÇÃO DE BUSCA UNIFICADA (LISTAR E BUSCAR POR ID) ---
// Esta função agora é 100% segura, usando o ID do token.
// --- FUNÇÃO DE BUSCA UNIFICADA E SEGURA (LISTAR E BUSCAR POR ID) ---
exports.find = async (request, response) => {
    const { pisciculturaId } = request.user;
    const loteIdParam = request.params.id;
    const { tanque_id, status } = request.query;

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
            conditions.push(`l.id = $${paramIndex++}`);
            values.push(parseInt(loteIdParam, 10));
        }
        if (tanque_id) {
            conditions.push(`l.tanque_id = $${paramIndex++}`);
            values.push(tanque_id);
        }
        
        // --- AQUI ESTÁ A MUDANÇA ---
        // O filtro de status só é adicionado se ele for explicitamente enviado pelo frontend
        if (status) {
            conditions.push(`l.status = $${paramIndex++}`);
            values.push(status);
        }

        const sql = `${baseQuery} WHERE ${conditions.join(' AND ')} ORDER BY l.id DESC`;

        const result = await db.query(sql, values);

        if (loteIdParam && result.rowCount === 0) {
            return response.status(404).json({ error: 'Lote não encontrado ou não pertence à sua piscicultura.' });
        }
        
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

// --- FUNÇÃO DE PROJEÇÃO DE CRESCIMENTO (LÓGICA CORRIGIDA) ---
exports.getProjecaoCrescimento = async (req, res) => {
    const { pisciculturaId } = req.user;
    const loteId = parseInt(req.params.id, 10);

    if (isNaN(loteId)) {
        return res.status(400).json({ error: 'ID de lote inválido.' });
    }

    try {
        // 1. Busca todos os dados de referência
        const [loteResult, curvaResult, fatoresResult] = await Promise.all([
            db.query("SELECT * FROM lotes WHERE id = $1 AND piscicultura_id = $2 AND status = 'Ativo'", [loteId, pisciculturaId]),
            db.query("SELECT * FROM curvas_crescimento WHERE tabela_crescimento_id = 1 ORDER BY semana"),
            db.query("SELECT mes, fator_crescimento FROM fatores_sazonais WHERE piscicultura_id = $1", [pisciculturaId])
        ]);

        if (loteResult.rowCount === 0) return res.status(404).json({ error: 'Lote ativo não encontrado.' });

        const lote = loteResult.rows[0];
        const curvaCrescimento = curvaResult.rows;
        const fatoresMap = new Map(fatoresResult.rows.map(f => [f.mes, parseFloat(f.fator_crescimento)]));

        // 2. Lógica de cálculo da projeção
        const projecao = [];
        let pesoAtual = parseFloat(lote.peso_atual_medio_g || lote.peso_inicial_medio_g);
        const semanasParaProjetar = 12;

        // **LÓGICA NOVA:** Encontra a semana inicial na curva com base no peso atual
        const faixaInicial = curvaCrescimento.find(faixa => pesoAtual >= parseFloat(faixa.peso_inicial_g) && pesoAtual < parseFloat(faixa.peso_final_g));
        if (!faixaInicial) return res.status(200).json([]); // Retorna vazio se o peso for maior que o da tabela

        let semanaAtual = faixaInicial.semana;
        let pesoProjetado = pesoAtual;

        for (let i = 0; i < semanasParaProjetar; i++) {
            const semanaDeReferencia = semanaAtual + i;
            
            // Pega a faixa de referência atual e a da próxima semana
            const faixaAtualReferencia = curvaCrescimento.find(f => f.semana === semanaDeReferencia);
            const faixaSeguinteReferencia = curvaCrescimento.find(f => f.semana === semanaDeReferencia + 1);

            // Se não houver uma próxima semana na tabela, para a projeção
            if (!faixaAtualReferencia || !faixaSeguinteReferencia) break;

            // **LÓGICA NOVA:** O ganho é a diferença do peso final entre a semana seguinte e a atual
            const ganhoSemanalBase = parseFloat(faixaSeguinteReferencia.peso_final_g) - parseFloat(faixaAtualReferencia.peso_final_g);

            const dataFutura = new Date();
            dataFutura.setDate(dataFutura.getDate() + (i * 7));
            const mesFuturo = dataFutura.getMonth() + 1;
            const fatorSazonal = fatoresMap.get(mesFuturo) || 1.0;

            const ganhoAjustado = ganhoSemanalBase * fatorSazonal;
            pesoProjetado += ganhoAjustado;

            projecao.push({
                semana: semanaDeReferencia + 1, // Projetamos o peso no final da semana seguinte
                peso_estimado: parseFloat(pesoProjetado.toFixed(2))
            });
        }
        
        // 3. Retorna a projeção
        res.status(200).json(projecao);

    } catch (error) {
        console.error("Erro ao calcular projeção de crescimento:", error);
        res.status(500).json({ error: "Erro interno do servidor." });
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