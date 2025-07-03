// src/pages/DashboardPage.jsx (VERSÃO CORRIGIDA)

import { useState, useEffect } from 'react';
import { Paper, Typography, Grid, Box, CircularProgress, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import api from '../services/api';
import ViewListIcon from '@mui/icons-material/ViewList';
import WavesIcon from '@mui/icons-material/Waves';
import ScaleIcon from '@mui/icons-material/Scale';

// Componente para um card do dashboard
const StatCard = ({ title, value, icon }) => (
  <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
      <Typography color="text.secondary" gutterBottom>
        {title}
      </Typography>
      {icon}
    </Box>
    <Typography component="p" variant="h4">
      {value}
    </Typography>
  </Paper>
);

function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Definimos a função de busca AQUI DENTRO
    async function fetchDashboardData() {
      setLoading(true);
      try {
        const response = await api.get('/dashboard');
        setDashboardData(response.data);
      } catch (error) {
        console.error("Erro ao buscar dados do dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    // E a chamamos AQUI DENTRO
    fetchDashboardData();
  }, []); // O array vazio garante que isto só roda uma vez

  if (loading) return <CircularProgress />;
  if (!dashboardData) return <Typography>Não foi possível carregar os dados do dashboard.</Typography>;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Dashboard Principal</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Total de Tanques" value={dashboardData.total_tanques} icon={<WavesIcon />} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Lotes Ativos" value={dashboardData.lotes_ativos} icon={<ViewListIcon />} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Biomassa Total (kg)" value={dashboardData.biomassa_total_kg} icon={<ScaleIcon />} />
        </Grid>
      </Grid>
      
      <Box sx={{mt: 4}}>
        <Button component={RouterLink} to="/pisciculturas" variant="contained">
            Gerenciar Pisciculturas
        </Button>
      </Box>
    </Box>
  );
}

export default DashboardPage;