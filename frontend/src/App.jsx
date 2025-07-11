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
import ManejoTransferenciaPage from './pages/ManejoTransferenciaPage'; 
import ClientesPage from './pages/ClientesPage'; // Importe a nova página
import FormasPagamentoPage from './pages/FormasPagamentoPage'; // Importa pagina de pagamento
import VendasPage from './pages/VendasPage'; // Importe a nova página de vendas
import CargosPage from './pages/CargosPage'; // Importe a nova página de Cargos
import UsuariosPage from './pages/UsuariosPage'; // Importe a nova pagina usuarios






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
        <Route path="/manejos/transferencia" element={<MainLayout><ManejoTransferenciaPage /></MainLayout>} />
        <Route path="/clientes" element={<MainLayout><ClientesPage /></MainLayout>} />
        <Route path="/formas-pagamento" element={<MainLayout><FormasPagamentoPage /></MainLayout>} />
        <Route path="/vendas" element={<MainLayout><VendasPage /></MainLayout>} />
        <Route path="/cargos" element={<MainLayout><CargosPage /></MainLayout>} />
        <Route path="/usuarios" element={<MainLayout><UsuariosPage /></MainLayout>} />



        {/* Adicione outras rotas principais aqui */}
      </Routes>
  );
}

export default App;