import { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import api from '../services/api';
import { 
  Typography, 
  CircularProgress, 
  Button, 
  Box, 
  Paper, 
  Modal, 
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LoteList from '../components/LoteList';
import LoteForm from '../components/LoteForm';
import QualidadeAguaList from '../components/QualidadeAguaList';
import QualidadeAguaForm from '../components/QualidadeAguaForm';

// Estilo para o Modal (para centralizá-lo)
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

function TanqueDetalhesPage() {
  // --- STATES ---
  const { tanqueId } = useParams();
  const [tanque, setTanque] = useState(null);
  const [lotes, setLotes] = useState([]);
  const [registrosQualidadeAgua, setRegistrosQualidadeAgua] = useState([]);
  const [loading, setLoading] = useState(true);

  // State para o Modal de Edição de Lote
  const [openModal, setOpenModal] = useState(false);
  const [loteParaEditar, setLoteParaEditar] = useState(null);

  // --- DATA FETCHING ---
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [tanqueResponse, lotesResponse, qualidadeAguaResponse] = await Promise.all([
          api.get(`/tanques/${tanqueId}`),
          api.get(`/lotes?tanque_id=${tanqueId}`),
          api.get(`/qualidade-agua?tanque_id=${tanqueId}`)
        ]);
        setTanque(tanqueResponse.data);
        setLotes(lotesResponse.data);
        setRegistrosQualidadeAgua(qualidadeAguaResponse.data);
      } catch (error) {
        console.error("Erro ao buscar dados do tanque:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [tanqueId]);

  // --- HANDLER FUNCTIONS ---

  // Para Lotes
  function handleNovoLote(novoLote) {
    setLotes(currentLotes => [novoLote, ...currentLotes]);
  }

  async function handleDeleteLote(id) {
    if (window.confirm('Tem certeza que deseja deletar este lote?')) {
      try {
        await api.delete(`/lotes/${id}`);
        setLotes(lotes.filter(lote => lote.id !== id));
      } catch (error) {
        console.error("Erro ao deletar lote:", error);
        alert("Não foi possível deletar o lote.");
      }
    }
  }

  function handleOpenModal(lote) {
    const loteFormatado = {
      ...lote,
      data_entrada: lote.data_entrada ? new Date(lote.data_entrada).toISOString().split('T')[0] : '',
      data_saida_estimada: lote.data_saida_estimada ? new Date(lote.data_saida_estimada).toISOString().split('T')[0] : '',
      data_saida_real: lote.data_saida_real ? new Date(lote.data_saida_real).toISOString().split('T')[0] : '',
    };
    setLoteParaEditar(loteFormatado);
    setOpenModal(true);
  }

  function handleCloseModal() {
    setOpenModal(false);
    setLoteParaEditar(null);
  }

  function handleUpdateChange(event) {
    const { name, value } = event.target;
    setLoteParaEditar({ ...loteParaEditar, [name]: value });
  }

  async function handleUpdateSubmit(event) {
    event.preventDefault();
    try {
      const dadosParaAtualizar = {
        tanque_id: loteParaEditar.tanque_id,
        status: loteParaEditar.status,
        quantidade_atual: loteParaEditar.quantidade_atual,
        peso_atual_medio_g: loteParaEditar.peso_atual_medio_g,
        data_saida_estimada: loteParaEditar.data_saida_estimada || null,
        data_saida_real: loteParaEditar.data_saida_real || null
      };
      const response = await api.put(`/lotes/${loteParaEditar.id}`, dadosParaAtualizar);
      setLotes(lotes.map(l => l.id === loteParaEditar.id ? response.data : l));
      handleCloseModal();
    } catch (error) {
      console.error("Erro ao atualizar lote:", error);
      alert("Não foi possível atualizar o lote.");
    }
  }

  // Para Qualidade da Água
  function handleNovaQualidadeAgua(novoRegistro) {
    setRegistrosQualidadeAgua(currentRegistros => [novoRegistro, ...currentRegistros]);
  }

  // --- RENDER ---
  if (loading) return <CircularProgress />;
  if (!tanque) return <Typography>Tanque não encontrado.</Typography>;

  return (
    <Box>
      <Button component={RouterLink} to={`/pisciculturas/${tanque.piscicultura_id}`} variant="outlined" sx={{ mb: 2 }}>
        Voltar para a Piscicultura
      </Button>

      <Paper elevation={1} sx={{p: 2, mb: 4}}>
        <Typography variant="h5" gutterBottom>Tanque: {tanque.nome_identificador}</Typography>
        <Typography variant="body1">Tipo: {tanque.tipo} | Dimensões: {tanque.dimensoes || 'N/A'}</Typography>
      </Paper>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
        
        {/* Coluna da Esquerda: Lotes */}
        <Box>
          <LoteList lotes={lotes} onEdit={handleOpenModal} onDelete={handleDeleteLote} />
          <LoteForm 
            pisciculturaId={tanque.piscicultura_id} 
            tanqueId={tanqueId}
            onLoteCadastrado={handleNovoLote}
          />
        </Box>

        {/* Coluna da Direita: Qualidade da Água */}
        <Box>
            <QualidadeAguaList registros={registrosQualidadeAgua} />
            <QualidadeAguaForm 
                pisciculturaId={tanque.piscicultura_id}
                tanqueId={tanqueId}
                corpoDaguaId={tanque.corpo_dagua_id}
                onQualidadeAguaRegistada={handleNovaQualidadeAgua}
            />
        </Box>
      </Box>

      {/* Modal de Edição de Lote */}
      <Modal open={openModal} onClose={handleCloseModal}>
        <Box sx={style}>
          <Typography variant="h6" component="h2">Editar Lote</Typography>
          {loteParaEditar && (
            <Box component="form" onSubmit={handleUpdateSubmit} sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
               <TextField label="Status" name="status" value={loteParaEditar.status || ''} onChange={handleUpdateChange} fullWidth />
               <TextField label="Quantidade Atual" name="quantidade_atual" type="number" value={loteParaEditar.quantidade_atual || ''} onChange={handleUpdateChange} fullWidth />
               <TextField label="Peso Médio Atual (g)" name="peso_atual_medio_g" type="number" value={loteParaEditar.peso_atual_medio_g || ''} onChange={handleUpdateChange} fullWidth />
               <TextField label="Data de Saída Estimada" name="data_saida_estimada" type="date" value={loteParaEditar.data_saida_estimada || ''} onChange={handleUpdateChange} fullWidth InputLabelProps={{ shrink: true }}/>
               <TextField label="Data de Saída Real" name="data_saida_real" type="date" value={loteParaEditar.data_saida_real || ''} onChange={handleUpdateChange} fullWidth InputLabelProps={{ shrink: true }}/>
               <Button type="submit" variant="contained">Salvar Alterações</Button>
            </Box>
          )}
        </Box>
      </Modal>
    </Box>
  );
}

export default TanqueDetalhesPage;