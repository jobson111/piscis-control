// src/pages/RelatorioDesempenhoLotePage.jsx (VERSÃO FINAL COM KPIs FINANCEIROS)

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, Paper, Grid, Divider, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '../services/api';

const KpiDisplay = ({ title, value, unit = '', color = 'text.primary' }) => (
    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', height: '100%' }}>
        <Typography variant="caption" color="text.secondary">{title}</Typography>
        <Typography variant="h5" component="p" sx={{ fontWeight: 'bold', color }}>
            {value} <Typography variant="body1" component="span">{unit}</Typography>
        </Typography>
    </Paper>
);

function RelatorioDesempenhoLotePage() {
    const { loteId } = useParams();
    const navigate = useNavigate();
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (loteId) {
            setLoading(true);
            api.get(`/relatorios/desempenho-lote/${loteId}`)
                .then(res => setReportData(res.data))
                .catch(err => console.error("Erro ao buscar relatório:", err))
                .finally(() => setLoading(false));
        }
    }, [loteId]);

    if (loading) return <CircularProgress />;
    if (!reportData) return <Typography>Não foi possível gerar o relatório.</Typography>;

    const formatCurrency = (value) => parseFloat(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <Box>
            <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
                Voltar
            </Button>
            <Typography variant="h4" gutterBottom>Relatório de Desempenho do Lote #{reportData.lote_id}</Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                Espécie: {reportData.especie} | Status: {reportData.status}
            </Typography>

            <Divider sx={{mb: 3}}><Typography variant="overline">Desempenho Zootécnico</Typography></Divider>
            <Grid container spacing={2}>
                <Grid item xs={6} md={3}><KpiDisplay title="Dias de Cultivo" value={reportData.dias_de_ciclo} unit="dias" /></Grid>
                <Grid item xs={6} md={3}><KpiDisplay title="Conversão Alimentar (FCR)" value={reportData.fcr} unit=": 1" /></Grid>
                <Grid item xs={6} md={3}><KpiDisplay title="Ganho de Peso Diário (GPD)" value={reportData.gpd_g_dia} unit="g/dia" /></Grid>
                <Grid item xs={6} md={3}><KpiDisplay title="Mortalidade / Perdas" value={reportData.mortalidade.toLocaleString('pt-BR')} unit="peixes" /></Grid>
            </Grid>

            <Divider sx={{my: 3}}><Typography variant="overline">Análise Financeira</Typography></Divider>
            <Grid container spacing={2}>
                <Grid item xs={6} md={3}><KpiDisplay title="Custo Total com Ração" value={formatCurrency(reportData.custo_total_racao)} color="error.main"/></Grid>
                <Grid item xs={6} md={3}><KpiDisplay title="Receita Bruta Gerada" value={formatCurrency(reportData.receita_total_bruta)} color="success.main"/></Grid>
                <Grid item xs={6} md={3}><KpiDisplay title="Custo por Kg Produzido" value={formatCurrency(reportData.custo_por_kg_produzido)} /></Grid>
                <Grid item xs={12} md={3}><KpiDisplay title="Lucro Bruto (Receita - Custo Ração)" value={formatCurrency(reportData.lucro_bruto)} color="primary.main" /></Grid>
            </Grid>
        </Box>
    );
}

export default RelatorioDesempenhoLotePage;