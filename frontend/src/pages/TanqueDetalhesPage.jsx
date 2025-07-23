// src/pages/TanqueDetalhesPage.jsx (VERSÃO COM HISTÓRICO COMPLETO DE LOTES)


import { useState, useEffect } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
    Typography, CircularProgress, Button, Box, Paper, Modal, TextField,
    List, ListItem, ListItemText, IconButton, ListItemButton, Chip, Tabs, Tab, Grid
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import QualidadeAguaList from '../components/QualidadeAguaList';
import QualidadeAguaForm from '../components/QualidadeAguaForm';
import LoteList from '../components/LoteList';
import ExtratoTanque from '../components/ExtratoTanque'; // Importa o nosso novo componente


function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} id={`tanque-tabpanel-${index}`} aria-labelledby={`tanque-tab-${index}`} {...other}>
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

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

const getStatusColor = (status) => {
    switch (status) {
        case 'Ativo':
            return 'success';
        case 'Vendido':
        case 'Transferido':
        case 'Finalizado com Perda':
            return 'default';
        default:
            return 'secondary';
    }
};

function TanqueDetalhesPage() {
  // --- STATES ---
  const { tanqueId } = useParams();
  const navigate = useNavigate();
  const [tanque, setTanque] = useState(null);
  const [lotes, setLotes] = useState([]);
  const [registrosQualidadeAgua, setRegistrosQualidadeAgua] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0); // State para controlar a aba ativa

  // State para o Modal de Edição de Lote
  const [openModal, setOpenModal] = useState(false);
  const [loteParaEditar, setLoteParaEditar] = useState(null);
  const [openQualidadeAguaModal, setOpenQualidadeAguaModal] = useState(false);
  const [qualidadeAguaParaEditar, setQualidadeAguaParaEditar] = useState(null);

  // --- DATA FETCHING ---
  useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                // AQUI ESTÁ A MUDANÇA: removemos o filtro `status=Ativo` da busca de lotes
                const [tanqueResponse, lotesResponse, qualidadeAguaResponse] = await Promise.all([
                    api.get(`/tanques/${tanqueId}`),
                    api.get(`/lotes?tanque_id=${tanqueId}`), // Agora busca TODOS os lotes do tanque
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


  const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };
  // Para Lotes

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

  const handleDeleteQualidadeAgua = async (id) => {
    if (window.confirm('Tem certeza que deseja apagar este registo?')) {
      try {
        await api.delete(`/qualidade-agua/${id}`);
        setRegistrosQualidadeAgua(registrosQualidadeAgua.filter(r => r.id !== id));
      } catch (error) {
        console.error("Erro ao apagar registo de qualidade da água:", error);
        alert('Falha ao apagar registo.');
      }
    }
  };

  const handleOpenQualidadeAguaModal = (registro) => {
    setQualidadeAguaParaEditar({
      ...registro,
      data_medicao: new Date(registro.data_medicao).toISOString().split('T')[0]
    });
    setOpenQualidadeAguaModal(true);
  };

  const handleCloseQualidadeAguaModal = () => setOpenQualidadeAguaModal(false);

  const handleQualidadeAguaUpdateChange = (e) => {
    setQualidadeAguaParaEditar({...qualidadeAguaParaEditar, [e.target.name]: e.target.value});
  };

  const handleUpdateQualidadeAguaSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/qualidade-agua/${qualidadeAguaParaEditar.id}`, qualidadeAguaParaEditar);
      setRegistrosQualidadeAgua(registrosQualidadeAgua.map(r => r.id === qualidadeAguaParaEditar.id ? response.data : r));
      handleCloseQualidadeAguaModal();
    } catch (error) {
      console.error("Erro ao atualizar registo de qualidade da água:", error);
      alert('Falha ao atualizar registo.');
    }
  };

  // --- RENDER ---
  if (loading) return <CircularProgress />;
  if (!tanque) return <Typography>Tanque não encontrado.</Typography>;

  return (
     <Box>
            <Button component={RouterLink} to={`/pisciculturas/${tanque.piscicultura_id}`} variant="outlined" sx={{ mb: 2 }}>
                Voltar para a Piscicultura
            </Button>

            <Paper elevation={1} sx={{p: 2, mb: 2}}>
                <Typography variant="h5" gutterBottom>Tanque: {tanque.nome_identificador}</Typography>
                <Typography variant="body1">Tipo: {tanque.tipo} | Dimensões: {tanque.dimensoes || 'N/A'}</Typography>
            </Paper>
            
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="abas de detalhes do tanque">
                    <Tab label="Visão Geral" id="tanque-tab-0" />
                    <Tab label="Extrato do Tanque" id="tanque-tab-1" />
                </Tabs>
            </Box>
            
            <TabPanel value={tabValue} index={0}>
                {/* A sua "Visão Geral" antiga agora vive aqui dentro */}
                <Grid container spacing={4}>
                    <Grid item xs={12} md={6}>
                        <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                            <Typography variant="h6" gutterBottom>Histórico de Lotes no Tanque</Typography>
                            <List>
                                {lotes.length > 0 ? (
                                    lotes.map(lote => (
                                        <ListItem key={lote.id} disablePadding divider>
                                            <ListItemButton component={RouterLink} to={`/lotes/${lote.id}`}>
                                                <ListItemText 
                                                    primary={`Lote de ${lote.especie} (ID: ${lote.id})`}
                                                    secondary={`Entrada: ${new Date(lote.data_entrada).toLocaleDateString('pt-BR')}`}
                                                />
                                                <Chip label={lote.status} color={getStatusColor(lote.status)} size="small" />
                                            </ListItemButton>
                                        </ListItem>
                                    ))
                                ) : (
                                    <Typography sx={{ p: 2 }}>Nenhum lote registado para este tanque.</Typography>
                                )}
                            </List>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <QualidadeAguaList registros={registrosQualidadeAgua} onEdit={handleOpenQualidadeAguaModal} onDelete={handleDeleteQualidadeAgua} />
                        <QualidadeAguaForm 
                            pisciculturaId={tanque.piscicultura_id}
                            tanqueId={tanqueId}
                            corpoDaguaId={tanque.corpo_dagua_id}
                            onQualidadeAguaRegistada={handleNovaQualidadeAgua}
                        />
                    </Grid>
                </Grid>
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
                {/* A nossa nova funcionalidade de extrato vive aqui */}
                <ExtratoTanque tanqueId={tanqueId} />
            </TabPanel>
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
      {/* --- NOVO: Modal para Editar Qualidade da Água --- */}
      <Modal open={openQualidadeAguaModal} onClose={handleCloseQualidadeAguaModal}>
        <Box sx={style}>
          <Typography variant="h6" component="h2">Editar Registo de Qualidade da Água</Typography>
          {qualidadeAguaParaEditar && (
            <Box component="form" onSubmit={handleUpdateQualidadeAguaSubmit} sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Data da Medição" name="data_medicao" type="date" value={qualidadeAguaParaEditar.data_medicao} onChange={handleQualidadeAguaUpdateChange} InputLabelProps={{ shrink: true }} fullWidth required />
              <TextField label="pH" name="ph" type="number" inputProps={{step: "0.1"}} value={qualidadeAguaParaEditar.ph || ''} onChange={handleQualidadeAguaUpdateChange} fullWidth />
              <TextField label="Temperatura (°C)" name="temperatura_celsius" type="number" inputProps={{step: "0.1"}} value={qualidadeAguaParaEditar.temperatura_celsius || ''} onChange={handleQualidadeAguaUpdateChange} fullWidth />
              <TextField label="Oxigénio Dissolvido (mg/L)" name="oxigenio_dissolvido_mg_l" type="number" inputProps={{step: "0.1"}} value={qualidadeAguaParaEditar.oxigenio_dissolvido_mg_l || ''} onChange={handleQualidadeAguaUpdateChange} fullWidth />
              <Button type="submit" variant="contained">Salvar Alterações</Button>
            </Box>
          )}
        </Box>
      </Modal>
    </Box>
  );
}

export default TanqueDetalhesPage;