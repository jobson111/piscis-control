// src/components/TanqueForm.jsx

import { useState } from 'react';
import { TextField, Button, Box, Typography } from '@mui/material';
import api from '../services/api';

// O formulário recebe o ID da piscicultura e a função de callback como props
function TanqueForm({ pisciculturaId, onTanqueCadastrado }) {
  const [formData, setFormData] = useState({
    nome_identificador: '',
    tipo: '',
    dimensoes: ''
  });

  function handleInputChange(event) {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    
    // Monta o objeto completo a ser enviado para a API
    const dadosParaEnviar = {
      ...formData,
      piscicultura_id: pisciculturaId // Adiciona o ID da piscicultura
    };

    try {
      const response = await api.post('/tanques', dadosParaEnviar);
      onTanqueCadastrado(response.data); // Avisa o componente pai sobre o novo tanque
      setFormData({ nome_identificador: '', tipo: '', dimensoes: '' }); // Limpa o formulário
    } catch (error) {
      console.error("Erro ao cadastrar tanque:", error);
      alert("Erro ao cadastrar o tanque.");
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 4, p: 2, border: '1px solid #ddd', borderRadius: '4px' }}>
      <Typography variant="h6">Cadastrar Novo Tanque</Typography>
      <TextField 
        label="Nome / Identificador"
        name="nome_identificador"
        value={formData.nome_identificador}
        onChange={handleInputChange}
        variant="outlined"
        fullWidth
        required
      />
      <TextField 
        label="Tipo (ex: Rede, Alvenaria)"
        name="tipo"
        value={formData.tipo}
        onChange={handleInputChange}
        variant="outlined"
        fullWidth
      />
      <TextField 
        label="Dimensões (ex: 10x5x1.5m)"
        name="dimensoes"
        value={formData.dimensoes}
        onChange={handleInputChange}
        variant="outlined"
        fullWidth
      />
      <Button type="submit" variant="contained">Adicionar Tanque</Button>
    </Box>
  );
}

export default TanqueForm;