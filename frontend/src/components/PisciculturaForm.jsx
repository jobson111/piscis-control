// src/components/PisciculturaForm.jsx

import { useState } from 'react';
import { TextField, Button, Box, Typography } from '@mui/material'; // Importa componentes de formulário
import api from '../services/api';

function PisciculturaForm({ onPisciculturaCadastrada }) {
  const [formData, setFormData] = useState({
    nome_fantasia: '',
    cnpj: ''
  });

  function handleInputChange(event) {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      const response = await api.post('/pisciculturas', formData);
      onPisciculturaCadastrada(response.data);
      setFormData({ nome_fantasia: '', cnpj: '' });
    } catch (error) {
      console.error("Erro ao cadastrar piscicultura:", error);
      alert("Erro ao cadastrar. Verifique o console.");
    }
  }

  return (
    // O Box aqui funciona como nosso <form> e nos dá acesso à prop 'sx' para estilos
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
      <Typography variant="h6">Cadastrar Nova Piscicultura</Typography>
      <TextField 
        label="Nome Fantasia"
        name="nome_fantasia"
        value={formData.nome_fantasia}
        onChange={handleInputChange}
        variant="outlined"
        fullWidth
        required
      />
      <TextField 
        label="CNPJ"
        name="cnpj"
        value={formData.cnpj}
        onChange={handleInputChange}
        variant="outlined"
        fullWidth
        required
      />
      <Button type="submit" variant="contained">Cadastrar</Button>
    </Box>
  );
}

export default PisciculturaForm;