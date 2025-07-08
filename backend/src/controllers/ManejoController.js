// backend/src/controllers/ManejoController.js (VERSÃO COM CORREÇÃO DEFINITIVA)

const db = require('../config/db');

exports.transferirLote = async (req, res) => {
    const { pisciculturaId } = req.user;
    const { loteOrigemId, dataManejo, observacoes, destinos, zerarLoteOrigem } = req.body;

    // --- 1. VALIDAÇÃO DOS DADOS DE ENTRADA ---
    if (!loteOrigemId || !dataManejo || !destinos || !Array.isArray(destinos) || destinos.length === 0) {
        return res.status(400).json({ error: 'Dados insuficientes para a transferência. Verifique o lote de origem e os destinos.' });
    }
    for (let i = 0; i < destinos.length; i++) {
        const dest = destinos[i];
        if (!dest.tanqueId || !dest.quantidade || !dest.pesoMedio || parseFloat(dest.quantidade) <= 0 || parseFloat(dest.pesoMedio) <= 0) {
            return res.status(400).json({ error: `Destino inválido na linha ${i + 1}: Todos os campos (Tanque, Quantidade, Peso) são obrigatórios e devem ser maiores que zero.` });
        }
    }

    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // --- 2. BUSCAR E VALIDAR O LOTE DE ORIGEM ---
        const loteOrigemResult = await client.query("SELECT * FROM lotes WHERE id = $1 AND piscicultura_id = $2 AND status = 'Ativo'", [loteOrigemId, pisciculturaId]);
        if (loteOrigemResult.rowCount === 0) {
            throw new Error('Lote de origem não encontrado, não pertence à sua piscicultura ou não está ativo.');
        }
        const loteOrigem = loteOrigemResult.rows[0];
        const quantidadeAtualOrigem = parseInt(loteOrigem.quantidade_atual, 10);
        const quantidadeTotalTransferida = destinos.reduce((sum, dest) => sum + parseInt(dest.quantidade, 10), 0);
        const quantidadeRestante = quantidadeAtualOrigem - quantidadeTotalTransferida;
        const obsManejo = observacoes ? `\n[MANEJO ${dataManejo}]: ${observacoes}` : '';

        // --- 3. LÓGICA ATUALIZADA E CORRIGIDA PARA O LOTE DE ORIGEM ---
        if (zerarLoteOrigem) {
            const perda = quantidadeRestante;
            if (perda < 0) throw new Error('A quantidade transferida não pode ser maior que a quantidade original ao zerar o lote.');
            
            const obsPerda = `\n[PERDA REGISTADA]: ${perda} unidades.`;
            const novasObservacoes = (loteOrigem.observacoes || '') + obsManejo + obsPerda;

            await client.query(
                "UPDATE lotes SET status = 'Finalizado com Perda', quantidade_atual = 0, observacoes = $1, data_saida_real = $2 WHERE id = $3",
                [novasObservacoes, dataManejo, loteOrigemId]
            );
            await client.query("UPDATE tanques SET status = 'Vazio' WHERE id = $1", [loteOrigem.tanque_id]);

        } else {
            // Lógica para transferência normal (parcial ou total)
            if (quantidadeRestante < 0) throw new Error(`A soma das quantidades de destino (${quantidadeTotalTransferida}) excede a quantidade do lote de origem (${quantidadeAtualOrigem}).`);
            
            const novasObservacoes = (loteOrigem.observacoes || '') + obsManejo;
            
            if (quantidadeRestante === 0) {
                // Cenário em que a transferência esvazia o lote, mas sem registrar perdas
                await client.query(
                    "UPDATE lotes SET status = 'Transferido', quantidade_atual = 0, observacoes = $1, data_saida_real = $2 WHERE id = $3",
                    [novasObservacoes, dataManejo, loteOrigemId]
                );
                await client.query("UPDATE tanques SET status = 'Vazio' WHERE id = $1", [loteOrigem.tanque_id]);
            } else {
                // Cenário de transferência parcial, onde o lote de origem continua ativo com menos peixes
                await client.query(
                    "UPDATE lotes SET quantidade_atual = $1, observacoes = $2 WHERE id = $3",
                    [quantidadeRestante, novasObservacoes, loteOrigemId]
                );
            }
        }
        
        // --- 4. LÓGICA DOS LOTES DE DESTINO ---
        for (const destino of destinos) {
            const destinoTanqueId = parseInt(destino.tanqueId, 10);
            const destinoQuantidade = parseInt(destino.quantidade, 10);
            const destinoPesoMedio = parseFloat(destino.pesoMedio);

            const loteDestinoExistenteResult = await client.query("SELECT * FROM lotes WHERE tanque_id = $1 AND status = 'Ativo' AND piscicultura_id = $2", [destinoTanqueId, pisciculturaId]);
            const loteDestinoExistente = loteDestinoExistenteResult.rows[0];

            if (loteDestinoExistente) {
                const qtdAntiga = parseInt(loteDestinoExistente.quantidade_atual, 10);
                const qtdNova = parseInt(destino.quantidade, 10);
                const novaQtdTotal = qtdAntiga + qtdNova;
                
                // A linha que faltava foi adicionada aqui:
                const novoPesoMedio = parseFloat(destino.pesoMedio); 
                
                await client.query(
                    "UPDATE lotes SET quantidade_atual = $1, peso_atual_medio_g = $2 WHERE id = $3", 
                    [novaQtdTotal, novoPesoMedio, loteDestinoExistente.id]);
            }
        }

        await client.query('COMMIT');
        res.status(200).json({ success: true, message: 'Manejo de transferência realizado com sucesso!' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro na transação de transferência:', error.message);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};