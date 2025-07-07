import { useState, useEffect } from 'react';
import { Paper, Typography, Grid, Box, CircularProgress, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import EmptyStateDashboard from '../components/EmptyStateDashboard';

// Ícones para dar um toque visual aos cards
import ViewListIcon from '@mui/icons-material/ViewList';
import WavesIcon from '@mui/icons-material/Waves';
import ScaleIcon from '@mui/icons-material/Scale';

// Componente para um card de estatística do dashboard
const StatCard = ({ title, value, icon }) => (
  <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'text.secondary' }}>
      <Typography gutterBottom>
        {title}
      </Typography>
      {icon}
    </Box>
    <Typography component="p" variant="h4" sx={{ mt: 'auto' }}>
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

  // Se não há tanques, mostra o painel de boas-vindas
  if (dashboardData.total_tanques === 0) {
    return <EmptyStateDashboard pisciculturaId={user.pisciculturaId} />;
  }

  // Se há tanques, mostra o dashboard normal com os cards
  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Dashboard Principal
      </Typography>
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
      
      <Box sx={{mt: 4, display: 'flex', gap: 2}}>
        <Button component={RouterLink} to={`/pisciculturas/${user.pisciculturaId}`} variant="contained">
    Gerenciar Tanques e Lotes
        </Button>
        <Button component={RouterLink} to="/entradas" variant="outlined">
            Histórico de Entradas
        </Button>
      </Box>
    </Box>
  );
}

export default DashboardPage;