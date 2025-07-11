// src/pages/DashboardPage.jsx (VERSÃO COMPLETA E CORRIGIDA)

import { useState, useEffect } from 'react';
import { Paper, Typography, Grid, Box, CircularProgress, Button, Divider } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import EmptyStateDashboard from '../components/EmptyStateDashboard';
import TanquesDiagram from '../components/TanquesDiagram';

// --- IMPORTAÇÃO COMPLETA DE ÍCONES ---
import ViewListIcon from '@mui/icons-material/ViewList';
import WavesIcon from '@mui/icons-material/Waves';
import ScaleIcon from '@mui/icons-material/Scale';
import PhishingIcon from '@mui/icons-material/Phishing';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';

// Componente reutilizável para um card de estatística do dashboard
const StatCard = ({ title, value, icon, color = 'text.secondary' }) => (
  <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', color }}>
      <Typography gutterBottom>
        {title}
      </Typography>
      {icon}
    </Box>
    <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
        <Typography component="p" variant="h4">
            {value}
        </Typography>
    </Box>
  </Paper>
);

function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [kpis, setKpis] = useState(null);
  const [diagramaTanques, setDiagramaTanques] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;
      
      setLoading(true);
      try {
        const response = await api.get('/dashboard/kpis');
        setKpis(response.data.kpis);
        setDiagramaTanques(response.data.diagrama_tanques);
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
  if (!kpis) return <Typography>Não foi possível carregar os dados do dashboard.</Typography>;

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
          <StatCard title="Faturamento do Mês" value={parseFloat(kpis.faturamento_mes).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={<AttachMoneyIcon />} color="success.main" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Biomassa Total Estimada" value={`${parseFloat(kpis.biomassa_total_kg).toLocaleString('pt-BR')} kg`} icon={<ScaleIcon />} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Total de Peixes Alojados" value={parseInt(kpis.peixes_alojados, 10).toLocaleString('pt-BR')} icon={<PhishingIcon />} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Lotes Ativos" value={kpis.lotes_ativos} icon={<ViewListIcon />} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Tanques Ocupados" value={`${kpis.tanques_ocupados} / ${kpis.total_tanques}`} icon={<WavesIcon />} />
        </Grid>
      </Grid>
      
      {/* Renderiza o novo componente de diagrama */}
      <Box sx={{ mt: 8 }}> {/* Adiciona uma margem no topo de 4 unidades (32px) */}
        <TanquesDiagram tanques={diagramaTanques} onTanqueClick={handleTanqueClick} />
      </Box>

      {/* Ações Rápidas */}
      <Paper variant="outlined" sx={{ p: 2, mt: 4 }}>
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