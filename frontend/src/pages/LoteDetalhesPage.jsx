// src/pages/LoteDetalhesPage.jsx (VERSÃO COMPLETA E CORRIGIDA)

import { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import api from '../services/api';
import { 
  Typography, CircularProgress, Button, Box, Paper, Modal, TextField 
} from '@mui/material';
import BiometriaList from '../components/BiometriaList';
//import BiometriaForm from '../components/BiometriaForm';
import AlimentacaoList from '../components/AlimentacaoList';
import AlimentacaoForm from '../components/AlimentacaoForm';

// Estilo para o Modal (pode ser movido para um arquivo de estilos depois)
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
  const [lote, setLote] = useState(null);
  const [biometrias, setBiometrias] = useState([]);
  const [registrosAlimentacao, setRegistrosAlimentacao] = useState([]);
  const [loading, setLoading] = useState(true);

  // State para o Modal de Edição de BIOMETRIA
  const [openBiometriaModal, setOpenBiometriaModal] = useState(false);
  const [biometriaParaEditar, setBiometriaParaEditar] = useState(null);
  const [openAlimentacaoModal, setOpenAlimentacaoModal] = useState(false);
  const [alimentacaoParaEditar, setAlimentacaoParaEditar] = useState(null);


  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [loteResponse, biometriasResponse, alimentacaoResponse] = await Promise.all([
          api.get(`/lotes/${loteId}`),
          api.get(`/biometrias?lote_id=${loteId}`),
          api.get(`/alimentacao?lote_id=${loteId}`)
        ]);
        setLote(loteResponse.data);
        setBiometrias(biometriasResponse.data);
        setRegistrosAlimentacao(alimentacaoResponse.data);
      } catch (error) {
        console.error("Erro ao buscar dados do lote:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [loteId]);

  // --- Handlers de Biometria ---
  const handleNovaBiometria = (novaBiometria) => {
    setBiometrias(current => [novaBiometria, ...current]);
    setLote(loteAtual => ({...loteAtual, peso_atual_medio_g: novaBiometria.peso_medio_gramas}));
  };

  const handleDeleteBiometria = async (id) => {
    if (window.confirm('Tem certeza que deseja apagar este registo de biometria?')) {
      try {
        await api.delete(`/biometrias/${id}`);
        setBiometrias(biometrias.filter(b => b.id !== id));
      } catch (error) {
        console.error("Erro ao apagar biometria:", error);
        alert('Falha ao apagar registo.');
      }
    }
  };

  const handleOpenBiometriaModal = (biometria) => {
    setBiometriaParaEditar({
      ...biometria,
      data_biometria: new Date(biometria.data_biometria).toISOString().split('T')[0]
    });
    setOpenBiometriaModal(true);
  };

  const handleCloseBiometriaModal = () => setOpenBiometriaModal(false);

  const handleBiometriaUpdateChange = (e) => {
    setBiometriaParaEditar({...biometriaParaEditar, [e.target.name]: e.target.value});
  };

  const handleUpdateBiometriaSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/biometrias/${biometriaParaEditar.id}`, biometriaParaEditar);
      setBiometrias(biometrias.map(b => b.id === biometriaParaEditar.id ? response.data : b));
      handleCloseBiometriaModal();
    } catch (error) {
      console.error("Erro ao atualizar biometria:", error);
      alert('Falha ao atualizar registo.');
    }
  };

  // --- Handlers de Alimentação ---
  const handleNovaAlimentacao = (novoRegistro) => {
    setRegistrosAlimentacao(current => [novoRegistro, ...current]);
  };

  const handleDeleteAlimentacao = async (id) => {
    if (window.confirm('Tem certeza que deseja apagar este registo de alimentação?')) {
      try {
        await api.delete(`/alimentacao/${id}`);
        setRegistrosAlimentacao(registrosAlimentacao.filter(r => r.id !== id));
      } catch (error) {
        console.error("Erro ao apagar alimentação:", error);
        alert('Falha ao apagar registo.');
      }
    }
  };

  const handleOpenAlimentacaoModal = (registro) => {
    setAlimentacaoParaEditar({
      ...registro,
      data_alimentacao: new Date(registro.data_alimentacao).toISOString().split('T')[0]
    });
    setOpenAlimentacaoModal(true);
  };
  const handleCloseAlimentacaoModal = () => setOpenAlimentacaoModal(false);

  const handleAlimentacaoUpdateChange = (e) => {
    setAlimentacaoParaEditar({...alimentacaoParaEditar, [e.target.name]: e.target.value});
  };

  const handleUpdateAlimentacaoSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/alimentacao/${alimentacaoParaEditar.id}`, alimentacaoParaEditar);
      setRegistrosAlimentacao(registrosAlimentacao.map(r => r.id === alimentacaoParaEditar.id ? response.data : r));
      handleCloseAlimentacaoModal();
    } catch (error) {
      console.error("Erro ao atualizar alimentação:", error);
      alert('Falha ao atualizar registo.');
    }
  };

  if (loading) return <CircularProgress />;
  if (!lote) return <Typography>Lote não encontrado.</Typography>;

  return (
    <Box>
      <Button component={RouterLink} to={`/tanques/${lote.tanque_id}`} variant="outlined" sx={{ mb: 2 }}>
        Voltar para o Tanque
      </Button>

      <Paper elevation={1} sx={{p: 2, mb: 4}}>
        <Typography variant="h5" gutterBottom>Lote de {lote.especie} (ID: {lote.id})</Typography>
        <Typography variant="body1">Status: {lote.status} | Peso Atual: {lote.peso_atual_medio_g || lote.peso_inicial_medio_g}g</Typography>
      </Paper>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
        <Box>
          <BiometriaList biometrias={biometrias} onEdit={handleOpenBiometriaModal} onDelete={handleDeleteBiometria} />
        </Box>
        <Box>
          <AlimentacaoList registros={registrosAlimentacao} onEdit={handleOpenAlimentacaoModal} onDelete={handleDeleteAlimentacao} />
          <AlimentacaoForm loteId={loteId} pisciculturaId={lote.piscicultura_id} onAlimentacaoRegistada={handleNovaAlimentacao} />
        </Box>
      </Box>

      
      

      <Modal open={openBiometriaModal} onClose={handleCloseBiometriaModal}>
        <Box sx={style}>
          <Typography variant="h6" component="h2">Editar Registo de Biometria</Typography>
          {biometriaParaEditar && (
            <Box component="form" onSubmit={handleUpdateBiometriaSubmit} sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Data da Biometria" name="data_biometria" type="date" value={biometriaParaEditar.data_biometria} onChange={handleBiometriaUpdateChange} InputLabelProps={{ shrink: true }} fullWidth required />
              <TextField label="Peso Médio (gramas)" name="peso_medio_gramas" type="number" value={biometriaParaEditar.peso_medio_gramas} onChange={handleBiometriaUpdateChange} fullWidth required />
              <TextField label="Quantidade da Amostra" name="quantidade_amostra" type="number" value={biometriaParaEditar.quantidade_amostra || ''} onChange={handleBiometriaUpdateChange} fullWidth />
              <TextField label="Observações" name="observacoes" value={biometriaParaEditar.observacoes || ''} onChange={handleBiometriaUpdateChange} fullWidth multiline rows={2} />
              <Button type="submit" variant="contained">Salvar Alterações</Button>
            </Box>
          )}
        </Box>
      </Modal>
      <Modal open={openAlimentacaoModal} onClose={handleCloseAlimentacaoModal}>
        <Box sx={style}>
          <Typography variant="h6" component="h2">Editar Registo de Alimentação</Typography>
          {alimentacaoParaEditar && (
            <Box component="form" onSubmit={handleUpdateAlimentacaoSubmit} sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Data da Alimentação" name="data_alimentacao" type="date" value={alimentacaoParaEditar.data_alimentacao} onChange={handleAlimentacaoUpdateChange} InputLabelProps={{ shrink: true }} fullWidth required />
              <TextField label="Tipo de Ração" name="tipo_racao" value={alimentacaoParaEditar.tipo_racao || ''} onChange={handleAlimentacaoUpdateChange} fullWidth />
              <TextField label="Quantidade (kg)" name="quantidade_kg" type="number" value={alimentacaoParaEditar.quantidade_kg} onChange={handleAlimentacaoUpdateChange} fullWidth required />
              <Button type="submit" variant="contained">Salvar Alterações</Button>
            </Box>
          )}
        </Box>
      </Modal>
    </Box>
  );
}

export default LoteDetalhesPage;