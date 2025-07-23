// src/controllers/CorpoDaguaController.js
const db = require('../config/db');
const registrarLog = require('../helpers/logHelper'); // Não se esqueça de importar no topo do ficheiro


exports.create = async (req, res) => {
    // A fonte de verdade para o ID da piscicultura é o token do usuário
     // 1. Pegamos TODOS os dados de que precisamos do request.user
    const { pisciculturaId, userId, nomeL: nomeUsuario } = request.user; 
    // Pegamos apenas os dados relevantes do corpo da requisição
    const { nome, tipo, tamanho_hectares } = req.body;

    try {
        const result = await db.query(
            'INSERT INTO corpos_dagua (piscicultura_id, nome, tipo, tamanho_hectares) VALUES ($1, $2, $3, $4) RETURNING *',
            [pisciculturaId, nome, tipo, tamanho_hectares] // Usamos o ID seguro
        );
        const novoCorpoDagua = result.rows[0];
        // 2. Registamos a ação no log com as variáveis corretas e o campo certo
        await registrarLog(
            pisciculturaId, 
            userId, 
            nomeUsuario, 
            `Criou o CorpoDagua '${novoCorpoDagua.nome}' (ID: ${novoCorpoDagua.id}).`
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao criar corpo dágua:', error);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
};

exports.listByPiscicultura = async (req, res) => {
    const { piscicultura_id } = req.query;
    if (!piscicultura_id) {
        return res.status(400).json({ error: 'O piscicultura_id é obrigatório.' });
    }
    try {
        const result = await db.query('SELECT * FROM corpos_dagua WHERE piscicultura_id = $1 AND piscicultura_id = $2 ORDER BY nome', [piscicultura_id]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
};
// Funções de Update e Delete podem ser adicionadas aqui seguindo o mesmo padrão, se necessário.