// src/App.jsx

import { useState, useEffect } from 'react';
import { Container, Typography, CssBaseline, Box } from '@mui/material'; // Importa componentes de layout do MUI
import api from '../services/api';
import PisciculturaForm from '../components/PisciculturaForm';
import PisciculturaList from '../components/PisciculturaList';

function App() {
  const [pisciculturas, setPisciculturas] = useState([]);

  useEffect(() => {
    api.get('/pisciculturas')
      .then(response => {
        setPisciculturas(response.data);
      })
      .catch(error => {
        console.error("Erro ao buscar pisciculturas:", error);
      });
  }, []);

  function handleNovaPiscicultura(novaPiscicultura) {
    setPisciculturas([...pisciculturas, novaPiscicultura]);
  }

  return (
    <>
      <CssBaseline /> {/* Reseta o CSS padrão dos navegadores para um padrão consistente */}
      <Container maxWidth="md"> {/* Define uma largura máxima e centraliza o conteúdo */}
        <Box sx={{ my: 4 }}> {/* Adiciona uma margem no topo e na base (my = margin y-axis) */}
          <Typography variant="h4" component="h1" gutterBottom>
            Piscis Control
          </Typography>
          
          <PisciculturaForm onPisciculturaCadastrada={handleNovaPiscicultura} />
          
          <Box sx={{ mt: 4 }}> {/* Adiciona uma margem no topo (mt = margin top) */}
            <PisciculturaList pisciculturas={pisciculturas} />
          </Box>
        </Box>
      </Container>
    </>
  )
}

export default App