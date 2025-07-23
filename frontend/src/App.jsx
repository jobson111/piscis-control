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
import ContasFinanceirasPage from './pages/ContasFinanceirasPage'; // Importe pagina de contas financeiras
import CategoriasDespesaPage from './pages/CategoriasDespesaPage'; // importe para categorias de despesas
import FluxoDeCaixaPage from './pages/FluxoDeCaixaPage'; // Importe a nova página
import PrestacaoContasPage from './pages/PrestacaoContasPage'; //import prestaçao de contas
import RelatorioEstoquePage from './pages/RelatorioEstoquePage'; // Importe a nova página relatorio estoque
import RelatorioVendasPage from './pages/RelatorioVendasPage'; // Importe a nova página relatorio vendas
import RelatorioDesempenhoLotePage from './pages/RelatorioDesempenhoLotePage'; // Importe lotes
import RelatorioTransferenciasPage from './pages/RelatorioTransferenciasPage'; // Importe a nova página
import PlanosPage from './pages/PlanosPage'; //import planos
import AssinaturaSucessoPage from './pages/AssinaturaSucessoPage'; //importa assinaturas de planos
import LogAtividadesPage from './pages/LogAtividadesPage'; // Importe a nova página de logs
import ConfiguracoesPage from './pages/ConfiguracoesPage'; // Importe a nova página
import RelatorioFluxoCaixaPage from './pages/RelatorioFluxoCaixaPage'; // Importe a nova página
















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
        <Route path="/contas-financeiras" element={<MainLayout><ContasFinanceirasPage /></MainLayout>} />
        <Route path="/categorias-despesa" element={<MainLayout><CategoriasDespesaPage /></MainLayout>} />
        <Route path="/financeiro/fluxo-caixa" element={<MainLayout><FluxoDeCaixaPage /></MainLayout>} />
        <Route path="/financeiro/prestacao-contas" element={<MainLayout><PrestacaoContasPage /></MainLayout>} />
        <Route path="/relatorios/estoque" element={<MainLayout><RelatorioEstoquePage /></MainLayout>} />
        <Route path="/relatorios/vendas" element={<MainLayout><RelatorioVendasPage /></MainLayout>} />
        <Route path="/relatorios/desempenho-lote/:loteId" element={<MainLayout><RelatorioDesempenhoLotePage /></MainLayout>} />
        <Route path="/planos" element={<MainLayout><PlanosPage /></MainLayout>} />
        <Route path="/assinatura/sucesso" element={<MainLayout><AssinaturaSucessoPage /></MainLayout>} />
        <Route path="/relatorios/transferencias" element={<MainLayout><RelatorioTransferenciasPage /></MainLayout>} />
        <Route path="/logs" element={<MainLayout><LogAtividadesPage /></MainLayout>} />
        <Route path="/configuracoes" element={<MainLayout><ConfiguracoesPage /></MainLayout>} />
        <Route path="/relatorios/fluxo-caixa" element={<MainLayout><RelatorioFluxoCaixaPage /></MainLayout>} />














        {/* Adicione outras rotas principais aqui */}
      </Routes>
  );
}

export default App;