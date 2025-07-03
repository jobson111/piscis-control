// src/pages/PisciculturaDetalhesPage.jsx

import { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import api from '../services/api';
import { 
  Typography, Paper, List, ListItem, ListItemText, CircularProgress, Button, Box,
  IconButton, Modal, TextField, ListItemButton  // 1. Importa novos componentes do MUI
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit'; // Ícone de Edição
import DeleteIcon from '@mui/icons-material/Delete'; // Ícone de Deleção
import TanqueForm from '../components/TanqueForm';

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

function PisciculturaDetalhesPage() {
  const { pisciculturaId } = useParams();
  const [piscicultura, setPiscicultura] = useState(null);
  const [tanques, setTanques] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- 2. State para controlar o Modal de Edição ---
  const [openModal, setOpenModal] = useState(false);
  const [tanqueParaEditar, setTanqueParaEditar] = useState(null);

  useEffect(() => {
    // ... (o useEffect continua exatamente o mesmo de antes)
    async function fetchData() {
      setLoading(true);
      try {
        const [pisciculturaResponse, tanquesResponse] = await Promise.all([
          api.get(`/pisciculturas/${pisciculturaId}`),
          api.get(`/tanques?piscicultura_id=${pisciculturaId}`)
        ]);
        setPiscicultura(pisciculturaResponse.data);
        setTanques(tanquesResponse.data);
      } catch (error) {
        console.error("Erro ao buscar dados da piscicultura:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [pisciculturaId]);

  function handleNovoTanque(novoTanque) {
    setTanques([...tanques, novoTanque]);
  }

  // --- 3. Função para DELETAR um tanque ---
  async function handleDeleteTanque(id) {
    if (window.confirm('Tem certeza que deseja deletar este tanque?')) {
      try {
        await api.delete(`/tanques/${id}`);
        // Atualiza a lista na tela removendo o item deletado
        setTanques(tanques.filter(tanque => tanque.id !== id));
      } catch (error) {
        console.error("Erro ao deletar tanque:", error);
        alert("Não foi possível deletar o tanque.");
      }
    }
  }
  
  // --- 4. Funções para controlar o Modal de Edição ---
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
      // Atualiza a lista na tela trocando o tanque antigo pelo novo (atualizado)
      setTanques(tanques.map(t => t.id === tanqueParaEditar.id ? response.data : t));
      handleCloseModal();
    } catch (error) {
      console.error("Erro ao atualizar tanque:", error);
      alert("Não foi possível atualizar o tanque.");
    }
  }

  // ... (lógica de loading e piscicultura não encontrada continua a mesma)
  if (loading) return <CircularProgress />;
  if (!piscicultura) return <Typography>Piscicultura não encontrada.</Typography>;


  return (
    <Box>
      {/* Botão para voltar à página inicial */}
      <Button component={RouterLink} to="/pisciculturas" variant="outlined" sx={{ mb: 2 }}>
        Voltar para a Lista
      </Button>

      {/* Título da Página */}
      <Typography variant="h5" gutterBottom>
        Gerenciando: {piscicultura.nome_fantasia}
      </Typography>

      {/* Container da Lista de Tanques */}
      <Paper elevation={2} sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6" gutterBottom>Lista de Tanques</Typography>
        <List>
          {tanques.length > 0 ? (
            tanques.map(tanque => (
              // Cada item da lista agora é um ListItem sem padding
              <ListItem key={tanque.id} disablePadding divider>
                
                {/* O ListItemButton se torna o link de navegação para os detalhes do tanque */}
                <ListItemButton component={RouterLink} to={`/tanques/${tanque.id}`}>
                  <ListItemText 
                    primary={tanque.nome_identificador} 
                    secondary={`Tipo: ${tanque.tipo || 'N/A'} - Dimensões: ${tanque.dimensoes || 'N/A'}`} 
                  />
                </ListItemButton>

                {/* Container para os botões de ação, para que fiquem fora da área do link */}
                <Box sx={{ pr: 2 }}>
                  <IconButton 
                    edge="end" 
                    aria-label="edit" 
                    onClick={(e) => { 
                      e.stopPropagation(); // Impede que o clique no ícone ative o link
                      handleOpenModal(tanque); 
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    edge="end" 
                    aria-label="delete" 
                    onClick={(e) => { 
                      e.stopPropagation(); // Impede que o clique no ícone ative o link
                      handleDeleteTanque(tanque.id); 
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>

              </ListItem>
            ))
          ) : (
            <Typography sx={{ p: 2 }}>Nenhum tanque cadastrado para esta piscicultura.</Typography>
          )}
        </List>
      </Paper>
      
      {/* Formulário para adicionar um novo tanque */}
      <TanqueForm 
        pisciculturaId={pisciculturaId} 
        onTanqueCadastrado={handleNovoTanque} 
      />

      {/* Modal para editar um tanque existente */}
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="modal-title"
      >
        <Box sx={style}>
          <Typography id="modal-title" variant="h6" component="h2">
            Editar Tanque
          </Typography>
          {tanqueParaEditar && (
            <Box component="form" onSubmit={handleUpdateSubmit} sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
               <TextField label="Nome / Identificador" name="nome_identificador" value={tanqueParaEditar.nome_identificador} onChange={handleUpdateChange} fullWidth />
               <TextField label="Tipo" name="tipo" value={tanqueParaEditar.tipo} onChange={handleUpdateChange} fullWidth />
               <TextField label="Dimensões" name="dimensoes" value={tanqueParaEditar.dimensoes} onChange={handleUpdateChange} fullWidth />
               {/* Adicione outros campos de edição aqui se necessário */}
               <Button type="submit" variant="contained">Salvar Alterações</Button>
            </Box>
          )}
        </Box>
      </Modal>
    </Box>
  );
}

export default PisciculturaDetalhesPage;