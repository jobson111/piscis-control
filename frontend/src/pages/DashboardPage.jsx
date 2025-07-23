import { useState, useEffect } from 'react';
import { Paper, Typography, Grid, Box, CircularProgress, Button, Divider } from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import EmptyStateDashboard from '../components/EmptyStateDashboard';
import TanquesDiagram from '../components/TanquesDiagram';
import StatCard from '../components/StatCard';

// Importação completa de Ícones
import WavesIcon from '@mui/icons-material/Waves';
import ViewListIcon from '@mui/icons-material/ViewList';
import ScaleIcon from '@mui/icons-material/Scale';
import PhishingIcon from '@mui/icons-material/Phishing';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';

function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;
      
      setLoading(true);
      try {
        const response = await api.get('/dashboard/kpis');
        setDashboardData(response.data);
      } catch (error) {
        console.error("Erro ao buscar dados do dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchDashboardData();
  }, [user]);

  const handleTanqueClick = (tanqueId) => {
    navigate(`/tanques/${tanqueId}`);
  };

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;
  if (!dashboardData) return <Typography>Não foi possível carregar os dados do dashboard.</Typography>;

  const { kpis, diagrama_tanques } = dashboardData;

  // Se for um novo usuário sem tanques, mostre o painel de boas-vindas
  if (kpis.total_tanques === 0) {
    return <EmptyStateDashboard pisciculturaId={user.pisciculturaId} />;
  }

  // Se houver dados, mostre o dashboard completo
  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Dashboard Principal
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard 
            title="Faturamento do Mês" 
            value={parseFloat(kpis.faturamento_mes).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
            icon={<AttachMoneyIcon fontSize="large" />} 
            variation={kpis.faturamento_variacao_percentual}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard 
            title="Biomassa Total Estimada" 
            value={`${parseFloat(kpis.biomassa_total_kg).toLocaleString('pt-BR')} kg`} 
            icon={<ScaleIcon fontSize="large" />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard 
            title="Total de Peixes Alojados" 
            value={parseInt(kpis.peixes_alojados, 10).toLocaleString('pt-BR')} 
            icon={<PhishingIcon fontSize="large" />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Lotes Ativos" value={kpis.lotes_ativos} icon={<ViewListIcon fontSize="large" />} color="info" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Tanques Ocupados" value={`${kpis.tanques_ocupados} / ${kpis.total_tanques}`} icon={<WavesIcon fontSize="large" />} color="success" />
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 7 }}>
        <TanquesDiagram tanques={diagrama_tanques} onTanqueClick={handleTanqueClick} />
      </Box>

      <Divider sx={{ my: 4 }} /> 

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Ações Rápidas</Typography>
        <Box sx={{mt: 2, display: 'flex', flexWrap: 'wrap', gap: 2}}>
          <Button component={RouterLink} to="/manejos/transferencia" variant="contained" startIcon={<CompareArrowsIcon />}>
              Realizar Transferência
          </Button>
          <Button component={RouterLink} to="/entradas" variant="outlined" startIcon={<AddShoppingCartIcon />}>
              Registar Entrada
          </Button>
          <Button component={RouterLink} to="/vendas" variant="outlined" startIcon={<PointOfSaleIcon />}>
              Registar Venda
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default DashboardPage;