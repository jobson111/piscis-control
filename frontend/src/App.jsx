// src/App.jsx (VERSÃO ATUALIZADA)

import { Routes, Route, Link as RouterLink } from 'react-router-dom';
import { Container, Typography, CssBaseline, Box, Button } from '@mui/material';
import { useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage';
import PisciculturaDetalhesPage from './pages/PisciculturaDetalhesPage';
import TanqueDetalhesPage from './pages/TanqueDetalhesPage';
import LoteDetalhesPage from './pages/LoteDetalhesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage'; // IMPORTA A NOVA PÁGINA

function App() {
  const { token, logout } = useAuth();

  return (
    <>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4"  gutterBottom
              component={RouterLink} to="/" style={{textDecoration: 'none', color: 'inherit'}}
            >
              Piscis Control
            </Typography>
            {token && <Button variant="outlined" onClick={logout}>Sair</Button>}
          </Box>
          
          <Routes>
            {/* Rotas Públicas */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Rotas Protegidas */}
            {/* A ROTA PRINCIPAL AGORA É O DASHBOARD */}
            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            
            {/* A ANTIGA HOME PAGE AGORA ESTÁ EM /pisciculturas */}
            <Route path="/pisciculturas" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />

            <Route path="/pisciculturas/:pisciculturaId" element={<ProtectedRoute><PisciculturaDetalhesPage /></ProtectedRoute>} />
            <Route path="/tanques/:tanqueId" element={<ProtectedRoute><TanqueDetalhesPage /></ProtectedRoute>} />
            <Route path="/lotes/:loteId" element={<ProtectedRoute><LoteDetalhesPage /></ProtectedRoute>} />
          </Routes>
        </Box>
      </Container>
    </>
  );
}

export default App;