// src/pages/RelatorioFluxoCaixaPage.jsx

import { useState, useEffect } from 'react';
import { 
    Box, Typography, CircularProgress, Paper, Grid, TextField, Button,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Divider
} from '@mui/material';
import api from '../services/api';

// Componente para um card de resumo financeiro
const SummaryCard = ({ title, value, color = 'text.primary' }) => (
    <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="overline" color="text.secondary">{title}</Typography>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color }}>
            {value}
        </Typography>
    </Paper>
);

function RelatorioFluxoCaixaPage() {
    const [reportData, setReportData] = useState(null);
    const [filtros, setFiltros] = useState({
        // Define o padrão para o primeiro e último dia do mês atual
        data_inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        data_fim: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams({
            data_inicio: filtros.data_inicio,
            data_fim: filtros.data_fim,
        });

        api.get(`/relatorios/fluxo-caixa?${params.toString()}`)
            .then(res => setReportData(res.data))
            .catch(err => console.error("Erro ao buscar relatório de fluxo de caixa:", err))
            .finally(() => setLoading(false));

    }, [filtros]);

    const handleFiltroChange = (e) => {
        setFiltros(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const formatCurrency = (value) => parseFloat(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const saldoFinal = (parseFloat(reportData?.total_receitas || 0) - parseFloat(reportData?.total_despesas || 0));

    return (
        <Box>
            <Typography variant="h5" gutterBottom>Relatório de Fluxo de Caixa (Fechamento)</Typography>
            
            <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                        <TextField name="data_inicio" label="Data de Início" type="date" value={filtros.data_inicio} onChange={handleFiltroChange} InputLabelProps={{ shrink: true }} fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField name="data_fim" label="Data de Fim" type="date" value={filtros.data_fim} onChange={handleFiltroChange} InputLabelProps={{ shrink: true }} fullWidth />
                    </Grid>
                </Grid>
            </Paper>

            {loading ? <CircularProgress /> : !reportData ? <Typography>Não foi possível gerar o relatório.</Typography> : (
                <Box>
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={4}>
                            <SummaryCard title="Total de Receitas" value={formatCurrency(reportData.total_receitas)} color="success.main" />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <SummaryCard title="Total de Despesas" value={formatCurrency(reportData.total_despesas)} color="error.main" />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <SummaryCard title="Saldo do Período" value={formatCurrency(saldoFinal)} color={saldoFinal >= 0 ? 'primary.main' : 'error.main'}/>
                        </Grid>
                    </Grid>

                    <Typography variant="h6" gutterBottom>Detalhamento de Despesas por Categoria</Typography>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{fontWeight: 'bold'}}>Categoria</TableCell>
                                    <TableCell align="right" sx={{fontWeight: 'bold'}}>Valor Total</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {reportData.despesas_por_categoria?.map((item) => (
                                    <TableRow key={item.categoria}>
                                        <TableCell>{item.categoria}</TableCell>
                                        <TableCell align="right">{formatCurrency(item.total)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}
        </Box>
    );
}

export default RelatorioFluxoCaixaPage;