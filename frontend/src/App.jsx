// src/App.jsx (VERSÃO COM LAYOUT)

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import MainLayout from './components/MainLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import EntradasPage from './pages/EntradasPage';
import TanqueDetalhesPage from './pages/TanqueDetalhesPage';
import LoteDetalhesPage from './pages/LoteDetalhesPage';
import PisciculturaDetalhesPage from './pages/PisciculturaDetalhesPage';
import HomePage from './pages/HomePage';

function App() {
  const { token } = useAuth();

  return (
      <Routes>
        {/* Se o usuário estiver logado, a rota "/" o leva para o layout principal. Se não, para o login. */}
        <Route path="/" element={token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
        
        {/* Rotas Públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Rotas Protegidas dentro do Layout Principal */}
        <Route path="/dashboard" element={<MainLayout><DashboardPage /></MainLayout>} />
        <Route path="/pisciculturas/:pisciculturaId" element={<MainLayout><PisciculturaDetalhesPage /></MainLayout>} />
        <Route path="/tanques/:tanqueId" element={<MainLayout><TanqueDetalhesPage /></MainLayout>} />
        <Route path="/lotes/:loteId" element={<MainLayout><LoteDetalhesPage /></MainLayout>} />
        <Route path="/entradas" element={<MainLayout><EntradasPage /></MainLayout>} />

        {/* Adicione outras rotas principais aqui */}
      </Routes>
  );
}

export default App;