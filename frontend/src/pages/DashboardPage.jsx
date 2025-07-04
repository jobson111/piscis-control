// src/pages/DashboardPage.jsx (VERSÃO ATUALIZADA)

import { useState, useEffect } from 'react';
import { Paper, Typography, Grid, Box, CircularProgress, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext'; // Importa o useAuth
import EmptyStateDashboard from '../components/EmptyStateDashboard'; // Importa o novo componente

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
  const { user } = useAuth(); // Pega os dados do usuário logado do contexto
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return; // Se o usuário ainda não carregou, não faz nada
      setLoading(true);
      try {
        const response = await api.get('/dashboard'); // A API já sabe o ID pelo token
        setDashboardData(response.data);
      } catch (error) {
        console.error("Erro ao buscar dados do dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, [user]); // Roda o efeito quando o 'user' estiver disponível

  if (loading) return <CircularProgress />;
  if (!dashboardData) return <Typography>Não foi possível carregar os dados do dashboard.</Typography>;

  // --- A LÓGICA PRINCIPAL ESTÁ AQUI ---
  // Se não há tanques, mostra o painel de boas-vindas
  if (dashboardData.total_tanques === 0) {
    return <EmptyStateDashboard pisciculturaId={user.pisciculturaId} />;
  }

  // Se há tanques, mostra o dashboard normal
  return (
    <Box>
      <Typography variant="h5" gutterBottom>Dashboard Principal</Typography>
      <Grid container spacing={3}>
        {/* ... (o Grid com os StatCards continua o mesmo) ... */}
      </Grid>
      
      <Box sx={{mt: 4}}>
        <Button component={RouterLink} to={`/pisciculturas/${user.pisciculturaId}`} variant="contained">
            Ver Detalhes e Gerenciar
        </Button>
      </Box>
    </Box>
  );
}

export default DashboardPage;

