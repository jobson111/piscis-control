import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
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
  IconButton,
  ListItemButton
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TanqueForm from '../components/TanqueForm';

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

function PisciculturaDetalhesPage() {
  const { pisciculturaId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [piscicultura, setPiscicultura] = useState(null);
  const [tanques, setTanques] = useState([]);
  const [loading, setLoading] = useState(true);

  // State para o Modal de Edição de Tanque
  const [openModal, setOpenModal] = useState(false);
  const [tanqueParaEditar, setTanqueParaEditar] = useState(null);

  useEffect(() => {
    // Só executa se tivermos o ID da URL e os dados do usuário do token
    if (pisciculturaId && user) {
        
        // --- VERIFICAÇÃO DE SEGURANÇA (AUTORIZAÇÃO) ---
        // Compara o ID da URL com o ID do token. 
        if (parseInt(pisciculturaId, 10) !== user.pisciculturaId) {
            alert('Acesso não autorizado a esta piscicultura.');
            navigate('/'); // Redireciona para o dashboard
            return; // Para a execução para não buscar dados que não pertencem ao usuário
        }

        async function fetchData() {
            setLoading(true);
            try {
                // Como a verificação passou, podemos buscar os dados com segurança
                const [pisciculturaResponse, tanquesResponse] = await Promise.all([
                    api.get(`/pisciculturas/${pisciculturaId}`),
                    // Usamos a rota segura que pega o ID do token no backend
                    api.get(`/tanques`) 
                ]);
                setPiscicultura(pisciculturaResponse.data); // Guarda o objeto diretamente
                setTanques(tanquesResponse.data);
            } catch (error) {
                console.error("Erro ao buscar dados da piscicultura:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }
  }, [pisciculturaId, user, navigate]);

  // --- Funções de Handler ---
  function handleNovoTanque(novoTanque) {
    setTanques(currentTanques => [novoTanque, ...currentTanques]);
  }

  async function handleDeleteTanque(id) {
    if (window.confirm('Tem certeza que deseja deletar este tanque? Lotes associados podem ser afetados.')) {
      try {
        await api.delete(`/tanques/${id}`);
        setTanques(tanques.filter(tanque => tanque.id !== id));
      } catch (error) {
        console.error("Erro ao deletar tanque:", error);
        alert("Não foi possível deletar o tanque.");
      }
    }
  }

  function handleOpenModal(tanque) {
    setTanqueParaEditar(tanque);
    setOpenModal(true);
  }

  function handleCloseModal() {
    setOpenModal(false);
    setTanqueParaEditar(null);
  }

  function handleUpdateChange(event) {
    const { name, value } = event.target;
    setTanqueParaEditar({ ...tanqueParaEditar, [name]: value });
  }

  async function handleUpdateSubmit(event) {
    event.preventDefault();
    try {
      const response = await api.put(`/tanques/${tanqueParaEditar.id}`, tanqueParaEditar);
      setTanques(tanques.map(t => t.id === tanqueParaEditar.id ? response.data : t));
      handleCloseModal();
    } catch (error) {
      console.error("Erro ao atualizar tanque:", error);
      alert("Não foi possível atualizar o tanque.");
    }
  }

  if (loading) return <CircularProgress />;
  if (!piscicultura) return <Typography>Piscicultura não encontrada ou acesso não autorizado.</Typography>;

  return (
    <Box>
      {/* O botão "Gerenciar Pisciculturas" foi removido do Dashboard. Este botão de voltar agora é mais útil */}
      <Button component={RouterLink} to="/" variant="outlined" sx={{ mb: 2 }}>
        Voltar para o Dashboard
      </Button>

      <Typography variant="h5" gutterBottom>Gerenciando Tanques de: {piscicultura.nome_fantasia}</Typography>

      <Paper elevation={2} sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6" gutterBottom>Lista de Tanques</Typography>
        <List>
          {tanques.length > 0 ? (
            tanques.map(tanque => (
              <ListItem key={tanque.id} disablePadding divider>
                <ListItemButton component={RouterLink} to={`/tanques/${tanque.id}`}>
                  <ListItemText primary={tanque.nome_identificador} secondary={`Tipo: ${tanque.tipo || 'N/A'}`} />
                </ListItemButton>
                <Box sx={{ pr: 2 }}>
                  <IconButton edge="end" aria-label="edit" onClick={(e) => { e.stopPropagation(); handleOpenModal(tanque); }}>
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" aria-label="delete" onClick={(e) => { e.stopPropagation(); handleDeleteTanque(tanque.id); }}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </ListItem>
            ))
          ) : (
            <Typography sx={{ p: 2 }}>Nenhum tanque cadastrado.</Typography>
          )}
        </List>
      </Paper>
      
      <TanqueForm onTanqueCadastrado={handleNovoTanque} />

      <Modal open={openModal} onClose={handleCloseModal}>
        <Box sx={style}>
          <Typography variant="h6" component="h2">Editar Tanque</Typography>
          {tanqueParaEditar && (
            <Box component="form" onSubmit={handleUpdateSubmit} sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
               <TextField label="Nome / Identificador" name="nome_identificador" value={tanqueParaEditar.nome_identificador || ''} onChange={handleUpdateChange} fullWidth />
               <TextField label="Tipo" name="tipo" value={tanqueParaEditar.tipo || ''} onChange={handleUpdateChange} fullWidth />
               <TextField label="Dimensões" name="dimensoes" value={tanqueParaEditar.dimensoes || ''} onChange={handleUpdateChange} fullWidth />
               <Button type="submit" variant="contained">Salvar Alterações</Button>
            </Box>
          )}
        </Box>
      </Modal>
    </Box>
  );
}

export default PisciculturaDetalhesPage;