// Importa as dependências necessárias: o nosso cliente de banco de dados e a ferramenta de log.
const db = require('../config/db');
const registrarLog = require('../helpers/logHelper');

/**
 * Orquestra a operação complexa de classificação e transferência de um lote.
 * Esta função é transacional, garantindo que todas as operações (atualizar origem,
 * criar/atualizar destinos, registar o manejo) aconteçam com sucesso, ou nada é salvo.
 */
exports.transferirLote = async (req, res) => {
    // Extrai os dados do utilizador logado (do token) e os dados do formulário.
    const { pisciculturaId, userId, nome: nomeUsuario } = req.user;
    const { loteOrigemId, dataManejo, observacoes, destinos, zerarLoteOrigem } = req.body;

    // --- 1. VALIDAÇÃO DOS DADOS DE ENTRADA ---
    // Garante que todos os dados essenciais foram enviados pelo frontend.
    if (!loteOrigemId || !dataManejo || !destinos || !Array.isArray(destinos) || destinos.length === 0) {
        return res.status(400).json({ error: 'Dados insuficientes. É necessário selecionar um lote de origem e pelo menos um destino.' });
    }
    // Valida cada item dentro da lista de destinos para garantir que estão completos.
    for (let i = 0; i < destinos.length; i++) {
        const dest = destinos[i];
        if (!dest.tanqueId || !dest.quantidade || !dest.pesoMedio || parseFloat(dest.quantidade) <= 0 || parseFloat(dest.pesoMedio) <= 0) {
            return res.status(400).json({ error: `Destino inválido na linha ${i + 1}: Todos os campos (Tanque, Quantidade, Peso) são obrigatórios e devem ser maiores que zero.` });
        }
    }

    // Pega uma conexão do pool para poder controlar a transação (BEGIN, COMMIT, ROLLBACK).
    const client = await db.pool.connect();

    try {
        // Inicia a transação. A partir daqui, todas as operações são um bloco único.
        await client.query('BEGIN');

        // --- 2. LÓGICA DO LOTE DE ORIGEM ---
        // Busca e bloqueia (FOR UPDATE) o lote de origem para evitar que outra operação o altere ao mesmo tempo.
        const loteOrigemResult = await client.query("SELECT * FROM lotes WHERE id = $1 AND piscicultura_id = $2 AND status = 'Ativo' FOR UPDATE", [loteOrigemId, pisciculturaId]);
        if (loteOrigemResult.rowCount === 0) {
            throw new Error('Lote de origem não encontrado, não pertence à sua piscicultura ou não está ativo.');
        }
        
        const loteOrigem = loteOrigemResult.rows[0];
        const quantidadeAtualOrigem = parseInt(loteOrigem.quantidade_atual, 10);
        const quantidadeTotalTransferida = destinos.reduce((sum, dest) => sum + parseInt(dest.quantidade, 10), 0);

        // Atualiza o lote de origem com base na escolha do utilizador.
        if (zerarLoteOrigem) {
            const perda = quantidadeAtualOrigem - quantidadeTotalTransferida;
            if (perda < 0) throw new Error('A quantidade transferida não pode ser maior que a quantidade original ao zerar o lote.');
            
            const obsManejo = observacoes ? `\n[MANEJO ${dataManejo}]: ${observacoes}` : '';
            const obsPerda = `\n[PERDA REGISTADA]: ${perda} unidades.`;
            const novasObservacoes = (loteOrigem.observacoes || '') + obsManejo + obsPerda;

            await client.query(
                "UPDATE lotes SET status = 'Finalizado com Perda', quantidade_atual = 0, observacoes = $1, data_saida_real = $2 WHERE id = $3",
                [novasObservacoes, dataManejo, loteOrigemId]
            );
            await client.query("UPDATE tanques SET status = 'Vazio' WHERE id = $1", [loteOrigem.tanque_id]);
        } else {
            const quantidadeRestante = quantidadeAtualOrigem - quantidadeTotalTransferida;
            if (quantidadeRestante < 0) throw new Error(`A soma das quantidades de destino (${quantidadeTotalTransferida}) excede a quantidade do lote de origem (${quantidadeAtualOrigem}).`);
            
            if (quantidadeRestante === 0) {
                await client.query("UPDATE lotes SET status = 'Transferido', quantidade_atual = 0, data_saida_real = $1 WHERE id = $2", [dataManejo, loteOrigemId]);
                await client.query("UPDATE tanques SET status = 'Vazio' WHERE id = $1", [loteOrigem.tanque_id]);
            } else {
                await client.query("UPDATE lotes SET quantidade_atual = $1 WHERE id = $2", [quantidadeRestante, loteOrigemId]);
            }
        }
        
        // --- 3. NOVA LÓGICA: REGISTAR O EVENTO DE MANEJO ---
        // Cria um registo na nossa nova tabela 'manejos', que é a nossa fonte da verdade para os relatórios.
        const detalhesManejo = { observacoes_manejo: observacoes, zerado_com_perda: zerarLoteOrigem, destinos: destinos };
        await client.query(
            `INSERT INTO manejos (piscicultura_id, usuario_id, tipo_manejo, data_manejo, lote_origem_id, detalhes)
             VALUES ($1, $2, 'TRANSFERENCIA_CLASSIFICACAO', $3, $4, $5)`,
            [pisciculturaId, userId, dataManejo, loteOrigemId, detalhesManejo]
        );

        // --- 4. LÓGICA DOS LOTES DE DESTINO ---
        // Itera sobre cada destino e cria um novo lote ou atualiza um existente.
        for (const destino of destinos) {
            const destinoTanqueId = parseInt(destino.tanqueId, 10);
            const destinoQuantidade = parseInt(destino.quantidade, 10);
            const destinoPesoMedio = parseFloat(destino.pesoMedio);

            const loteDestinoExistenteResult = await client.query("SELECT * FROM lotes WHERE tanque_id = $1 AND status = 'Ativo' AND piscicultura_id = $2", [destinoTanqueId, pisciculturaId]);
            const loteDestinoExistente = loteDestinoExistenteResult.rows[0];

            if (loteDestinoExistente) {
                // Se o tanque de destino já está ocupado, "mistura" os lotes.
                const qtdAntiga = parseInt(loteDestinoExistente.quantidade_atual, 10);
                const novaQtdTotal = qtdAntiga + destinoQuantidade;
                await client.query("UPDATE lotes SET quantidade_atual = $1, peso_atual_medio_g = $2 WHERE id = $3", [novaQtdTotal, destinoPesoMedio, loteDestinoExistente.id]);
            } else {
                // Se o tanque de destino está vazio, cria um novo lote.
                const loteSql = `INSERT INTO lotes (piscicultura_id, tanque_id, especie, quantidade_inicial, peso_inicial_medio_g, data_entrada, lote_origem_id, quantidade_atual) VALUES ($1, $2, $3, $4, $5, $6, $7, $4);`;
                await client.query(loteSql, [pisciculturaId, destinoTanqueId, loteOrigem.especie, destinoQuantidade, destinoPesoMedio, dataManejo, loteOrigemId]);
            }
        }

        // Se todos os passos acima funcionaram, confirma todas as alterações no banco de dados.
        await client.query('COMMIT');
        
        // Regista a ação no nosso log de auditoria.
        const nomesTanquesDestino = destinos.map(d => d.tanqueId).join(', ');
        await registrarLog(pisciculturaId, userId, nomeUsuario, `Realizou a transferência do Lote #${loteOrigemId} para ${destinos.length} destino(s) (Tanques: ${nomesTanquesDestino}).`);
        
        // Envia a resposta de sucesso para o frontend.
        res.status(200).json({ success: true, message: 'Manejo de transferência realizado com sucesso!' });

    } catch (error) {
        // Se qualquer passo dentro do 'try' falhar, desfaz TODAS as alterações.
        await client.query('ROLLBACK');
        console.error('Erro na transação de transferência:', error.message);
        res.status(500).json({ error: error.message });
    } finally {
        // Libera a conexão de volta para o pool, quer tenha dado sucesso ou erro.
        client.release();
    }
};