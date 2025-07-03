// src/controllers/DashboardController.js

const db = require('../config/db');

exports.getDashboardData = async (req, res) => {
    // PONTO CHAVE: Estamos a usar o ID da piscicultura que vem do token do usuário logado!
    // O nosso authMiddleware já colocou esta informação em req.user.
    const pisciculturaId = req.user.pisciculturaId;

    try {
        // Vamos executar todas as nossas consultas em paralelo para maior eficiência
        const [tanquesResult, lotesAtivosResult, biomassaResult] = await Promise.all([
            // Query 1: Contar o número total de tanques
            db.query('SELECT COUNT(*) FROM tanques WHERE piscicultura_id = $1', [pisciculturaId]),
            
            // Query 2: Contar o número de lotes com status 'Ativo'
            db.query("SELECT COUNT(*) FROM lotes WHERE piscicultura_id = $1 AND status = 'Ativo'", [pisciculturaId]),

            // Query 3: Somar a (quantidade * peso) de todos os lotes ativos
            // Usamos COALESCE para garantir que o resultado seja 0 se não houver lotes, em vez de null.
            // Dividimos por 1000 para converter de gramas para quilogramas.
           // Agora usamos COALESCE para escolher entre o peso atual e o inicial
            db.query(
                `SELECT COALESCE(SUM(quantidade_atual * COALESCE(peso_atual_medio_g, peso_inicial_medio_g) / 1000), 0) as biomassa_total_kg 
                 FROM lotes 
                 WHERE piscicultura_id = $1 AND status = 'Ativo'`, 
                [pisciculturaId]
            )
        ]);

        // Montamos o objeto de resposta com os resultados
        const dashboardData = {
            total_tanques: parseInt(tanquesResult.rows[0].count, 10),
            lotes_ativos: parseInt(lotesAtivosResult.rows[0].count, 10),
            biomassa_total_kg: parseFloat(biomassaResult.rows[0].biomassa_total_kg).toFixed(2)
        };
        
        res.status(200).json(dashboardData);

    } catch (error) {
        console.error("Erro ao buscar dados do dashboard:", error);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
};