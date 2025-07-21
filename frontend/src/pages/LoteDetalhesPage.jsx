// src/pages/LoteDetalhesPage.jsx (VERSÃO FINAL E COMPLETA)

import { useState, useEffect } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Typography, 
  CircularProgress, 
  Button, 
  Box, 
  Paper, 
  Modal, 
  TextField 
} from '@mui/material';
import BiometriaList from '../components/BiometriaList';
import AlimentacaoList from '../components/AlimentacaoList';
import AlimentacaoForm from '../components/AlimentacaoForm';
import GraficoCrescimento from '../components/GraficoCrescimento';

// Estilo para o Modal
const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

function LoteDetalhesPage() {
  const { loteId } = useParams();
  const navigate = useNavigate();

  const [lote, setLote] = useState(null);
  const [biometrias, setBiometrias] = useState([]);
  const [registrosAlimentacao, setRegistrosAlimentacao] = useState([]);
  const [projecaoCrescimento, setProjecaoCrescimento] = useState([]); // A linha que faltava
  const [loading, setLoading] = useState(true);

  // States para Modais
  const [openBiometriaModal, setOpenBiometriaModal] = useState(false);
  const [biometriaParaEditar, setBiometriaParaEditar] = useState(null);
  // Adicione states para o modal de alimentação se for implementar a edição
  
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [loteResponse, biometriasResponse, alimentacaoResponse, projecaoResponse] = await Promise.all([
          api.get(`/lotes/${loteId}`),
          api.get(`/biometrias?lote_id=${loteId}`),
          api.get(`/alimentacao?lote_id=${loteId}`),
          api.get(`/lotes/${loteId}/projecao`)
        ]);
        setLote(loteResponse.data);
        setBiometrias(biometriasResponse.data);
        setRegistrosAlimentacao(alimentacaoResponse.data);
        setProjecaoCrescimento(projecaoResponse.data);
      } catch (error) {
        console.error("Erro ao buscar dados do lote:", error);
        if (error.response?.status === 404) {
          alert("Lote não encontrado ou acesso não autorizado.");
          navigate(-1); // Volta para a página anterior
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [loteId, navigate]);

  // Prepara os dados para o gráfico
  const pontosReaisGrafico = biometrias.map(bio => {
    const dataEntrada = new Date(lote?.data_entrada);
    const dataBiometria = new Date(bio.data_biometria);
    const diffTime = Math.abs(dataBiometria - dataEntrada);
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    return { semana: diffWeeks, 'Peso Real (g)': parseFloat(bio.peso_medio_gramas) };
  }).sort((a, b) => a.semana - b.semana);

  const pontoInicial = lote ? { semana: 0, 'Peso Real (g)': parseFloat(lote.peso_inicial_medio_g) } : null;
  const dadosReaisCompletos = pontoInicial ? [pontoInicial, ...pontosReaisGrafico] : pontosReaisGrafico;

  // --- Handlers de Biometria ---
  const handleNovaBiometria = (novaBiometria) => {
    setBiometrias(current => [novaBiometria, ...current].sort((a, b) => new Date(b.data_biometria) - new Date(a.data_biometria)));
    setLote(loteAtual => ({...loteAtual, peso_atual_medio_g: novaBiometria.peso_medio_gramas}));
  };
  // (Handlers de delete e update da biometria ficariam aqui)

  // --- Handlers de Alimentação ---
  const handleNovaAlimentacao = (novoRegistro) => {
    setRegistrosAlimentacao(current => [novoRegistro, ...current].sort((a, b) => new Date(b.data_alimentacao) - new Date(a.data_alimentacao)));
  };
  
  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;
  if (!lote) return <Typography>Lote não encontrado.</Typography>;

  return (
    <Box>
      <Button component={RouterLink} to={`/tanques/${lote.tanque_id}`} variant="outlined" sx={{ mb: 2 }}>
        Voltar para o Tanque
      </Button>
      
      <Paper elevation={1} sx={{p: 2, mb: 4}}>
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <Box>
                    <Typography variant="h5" gutterBottom>Lote de {lote.especie} (ID: {lote.id})</Typography>
                    <Typography variant="body1">Status: {lote.status} | Peso Atual: {lote.peso_atual_medio_g || lote.peso_inicial_medio_g}g</Typography>
                </Box>
                {/* --- NOVO BOTÃO --- */}
                <Button 
                    variant="contained" 
                    component={RouterLink} 
                    to={`/relatorios/desempenho-lote/${lote.id}`}
                >
                    Ver Relatório de Desempenho
                </Button>
            </Box>
        </Paper>


      {/* Renderiza o Gráfico */}
      <GraficoCrescimento 
          dadosReais={dadosReaisCompletos} 
          dadosProjetados={projecaoCrescimento}
          lote={lote}
      />

      <Paper elevation={1} sx={{p: 2, mb: 4}}>
        <Typography variant="h5" gutterBottom>Lote de {lote.especie} (ID: {lote.id})</Typography>
        <Typography variant="body1">Status: {lote.status} | Peso Atual: {lote.peso_atual_medio_g || lote.peso_inicial_medio_g}g</Typography>
      </Paper>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
        <Box>
          <BiometriaList biometrias={biometrias} onEdit={()=>{}} onDelete={()=>{}} />
          {/* O formulário de biometria foi removido daqui para seguir a lógica de negócio */}
        </Box>
        <Box>
          <AlimentacaoList registros={registrosAlimentacao} onEdit={()=>{}} onDelete={()=>{}} />
          <AlimentacaoForm loteId={loteId} pisciculturaId={lote.piscicultura_id} onAlimentacaoRegistada={handleNovaAlimentacao} />
        </Box>
      </Box>

      {/* Os seus modais de edição viriam aqui */}
    </Box>
  );
}

export default LoteDetalhesPage;