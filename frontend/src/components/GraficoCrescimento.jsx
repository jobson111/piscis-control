// src/components/GraficoCrescimento.jsx

import { Paper, Typography, Box } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function GraficoCrescimento({ dadosReais, dadosProjetados, lote }) {

    // Prepara os dados para o gráfico
    const dadosParaGrafico = dadosReais.map(ponto => ({
        semana: ponto.semana,
        'Peso Real (g)': ponto.peso_real,
    }));

    // Combina os dados projetados, garantindo que não haja sobreposição de semanas
    dadosProjetados.forEach(ponto => {
        const indexExistente = dadosParaGrafico.findIndex(p => p.semana === ponto.semana);
        if (indexExistente > -1) {
            // Se a semana já existe, adiciona a projeção a ela
            dadosParaGrafico[indexExistente]['Peso Estimado (g)'] = ponto.peso_estimado;
        } else {
            // Se não, adiciona um novo ponto com a projeção
            dadosParaGrafico.push({
                semana: ponto.semana,
                'Peso Estimado (g)': ponto.peso_estimado,
            });
        }
    });

    // Ordena os dados por semana
    dadosParaGrafico.sort((a, b) => a.semana - b.semana);

    return (
        <Paper elevation={3} sx={{ p: 2, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
                Curva de Crescimento - Lote de {lote.especie} (ID: {lote.id})
            </Typography>
            <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <LineChart
                        data={dadosParaGrafico}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="semana" label={{ value: 'Semanas de Cultivo', position: 'insideBottom', offset: -5 }} />
                        <YAxis label={{ value: 'Peso (g)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip formatter={(value) => `${value}g`} />
                        <Legend />
                        <Line type="monotone" dataKey="Peso Real (g)" stroke="#8884d8" strokeWidth={2} />
                        <Line type="monotone" dataKey="Peso Estimado (g)" stroke="#82ca9d" strokeDasharray="5 5" />
                    </LineChart>
                </ResponsiveContainer>
            </Box>
        </Paper>
    );
}

export default GraficoCrescimento;