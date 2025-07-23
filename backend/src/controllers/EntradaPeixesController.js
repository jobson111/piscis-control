// src/controllers/EntradaPeixesController.js (VERSÃO FINAL COM LÓGICA INTELIGENTE)

const db = require('../config/db');
const registrarLog = require('../helpers/logHelper'); // Importe a ferramenta de log


// --- LISTAR todas as entradas de uma piscicultura ---
exports.list = async (req, res) => {
    const pisciculturaId = req.user.pisciculturaId;
    try {
        const result = await db.query(
            'SELECT * FROM entradas_de_peixes WHERE piscicultura_id = $1 ORDER BY data_entrada DESC',
            [pisciculturaId]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao listar entradas de peixes:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};


// --- CRIAR uma nova entrada e seus lotes (COM LÓGICA DE TANQUE OCUPADO) ---
exports.create = async (req, res) => {
     // A ÚNICA fonte de verdade para o ID da piscicultura agora é o token do usuário.
    const { pisciculturaId, userId, nome: nomeUsuario } = req.user; 

    // Os dados que vêm do frontend não precisam mais de incluir o piscicultura_id.
    const { entradaData, lotesData } = req.body;
    // Ao inserir no banco, usamos a variável segura 'pisciculturaId' vinda do req.user

    if (!entradaData || !lotesData || lotesData.length === 0) {
        return res.status(400).json({ error: 'Dados de entrada ou de lotes em falta.' });
    }

    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        const entradaSql = `
            INSERT INTO entradas_de_peixes (piscicultura_id, nr_nota_fiscal, fornecedor, data_entrada, valor_total_nota, observacoes)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id; 
        `;
        const entradaValues = [
            pisciculturaId, entradaData.nr_nota_fiscal, entradaData.fornecedor,
            entradaData.data_entrada, entradaData.valor_total_nota, entradaData.observacoes
        ];
        const entradaResult = await client.query(entradaSql, entradaValues);
        const novaEntradaId = entradaResult.rows[0].id;

        for (const lote of lotesData) {
            
            const loteExistenteResult = await client.query(
                "SELECT * FROM lotes WHERE tanque_id = $1 AND status = 'Ativo'",
                [lote.tanque_id]
            );
            const loteExistente = loteExistenteResult.rows[0];

            if (loteExistente) {
                if (lote.acao_tanque_ocupado === 'zerar') {
                    await client.query(
                        "UPDATE lotes SET status = 'Arquivado' WHERE id = $1",
                        [loteExistente.id]
                    );
                    
                    const loteSql = `
                        INSERT INTO lotes (piscicultura_id, tanque_id, especie, quantidade_inicial, peso_inicial_medio_g, data_entrada, entrada_id, quantidade_atual)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $4);
                    `;
                    await client.query(loteSql, [
                        pisciculturaId, lote.tanque_id, lote.especie, lote.quantidade_inicial,
                        lote.peso_inicial_medio_g, entradaData.data_entrada, novaEntradaId
                    ]);

                } else { 
                    // --- A LÓGICA CORRIGIDA ESTÁ AQUI ---
                    const qtdAntiga = parseInt(loteExistente.quantidade_atual, 10);
                    const qtdNova = parseInt(lote.quantidade_inicial, 10);
                    const novaQtdTotal = qtdAntiga + qtdNova;

                    // O novo peso médio é simplesmente o peso do novo grupo de peixes
                    const novoPesoMedio = parseFloat(lote.peso_inicial_medio_g);
                    
                    // Atualiza o lote existente com a nova quantidade e o novo peso de referência
                    await client.query(
                        "UPDATE lotes SET quantidade_atual = $1, peso_atual_medio_g = $2 WHERE id = $3",
                        [novaQtdTotal, novoPesoMedio, loteExistente.id]
                    );
                }

            } else {
                // ... (lógica para tanque vazio continua a mesma)
                const loteSql = `
                    INSERT INTO lotes (piscicultura_id, tanque_id, especie, quantidade_inicial, peso_inicial_medio_g, data_entrada, entrada_id, quantidade_atual)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $4);
                `;
                await client.query(loteSql, [
                    pisciculturaId, lote.tanque_id, lote.especie, lote.quantidade_inicial,
                    lote.peso_inicial_medio_g, entradaData.data_entrada, novaEntradaId
                ]);
            }
        }

        await client.query('COMMIT');

        await registrarLog(
            pisciculturaId,
            userId,
            nomeUsuario,
            `Registou uma nova Entrada de Peixes (ID: ${novaEntradaId}) com ${lotesData.length} lote(s), baseada na NF '${entradaData.nr_nota_fiscal || 'N/A'}'.`
        );
        
        res.status(201).json({ success: true, message: 'Entrada e lotes criados/atualizados com sucesso!', entrada_id: novaEntradaId });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro na transação de criação de entrada:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao criar entrada.' });
    } finally {
        client.release();
    }
};