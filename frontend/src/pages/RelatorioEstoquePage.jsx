// src/pages/RelatorioEstoquePage.jsx

import { useState, useEffect } from 'react';
import { 
    Box, Typography, CircularProgress, Paper, Table, TableBody, 
    TableCell, TableContainer, TableHead, TableRow, TableFooter 
} from '@mui/material';
import api from '../services/api';

function RelatorioEstoquePage() {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        api.get('/relatorios/estoque-atual')
            .then(res => {
                setReportData(res.data);
            })
            .catch(err => console.error("Erro ao buscar relatório de estoque:", err))
            .finally(() => setLoading(false));
    }, []);

    const formatNumber = (num) => new Intl.NumberFormat('pt-BR').format(num);
    const formatDecimal = (num) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);

    if (loading) return <CircularProgress />;
    if (!reportData) return <Typography>Não foi possível gerar o relatório.</Typography>;

    return (
        <Box>
            <Typography variant="h5" gutterBottom>Relatório de Estoque Atual</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Uma visão geral de todos os lotes ativos na sua piscicultura.
            </Typography>

            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="relatorio de estoque">
                    <TableHead sx={{ backgroundColor: 'primary.main' }}>
                        <TableRow>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tanque</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Lote ID</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Espécie</TableCell>
                            <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Qtd. Peixes</TableCell>
                            <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Peso Médio (g)</TableCell>
                            <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Biomassa (kg)</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {reportData.detalhes.map((lote) => (
                            <TableRow key={lote.lote_id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                <TableCell component="th" scope="row">{lote.nome_tanque}</TableCell>
                                <TableCell>{lote.lote_id}</TableCell>
                                <TableCell>{lote.especie}</TableCell>
                                <TableCell align="right">{formatNumber(lote.quantidade_atual)}</TableCell>
                                <TableCell align="right">{formatDecimal(lote.peso_medio_g)}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatDecimal(lote.biomassa_kg)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter sx={{ backgroundColor: 'grey.200' }}>
                        <TableRow>
                            <TableCell colSpan={3} sx={{ fontWeight: 'bold', fontSize: '1rem' }}>TOTAIS</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>{formatNumber(reportData.resumo.total_peixes)}</TableCell>
                            <TableCell align="right" colSpan={2} sx={{ fontWeight: 'bold', fontSize: '1rem' }}>{formatDecimal(reportData.resumo.biomassa_total_kg)} kg</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </TableContainer>
        </Box>
    );
}

export default RelatorioEstoquePage;