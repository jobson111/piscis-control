// src/components/LoteForm.jsx

import { useState } from 'react';
import { TextField, Button, Box, Typography } from '@mui/material';
import api from '../services/api';

function LoteForm({ pisciculturaId, tanqueId, onLoteCadastrado }) {
  const [formData, setFormData] = useState({
    especie: '',
    quantidade_inicial: '',
    peso_inicial_medio_g: '',
    data_entrada: new Date().toISOString().split('T')[0], // Pega a data de hoje no formato AAAA-MM-DD
  });

  function handleInputChange(event) {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const dadosParaEnviar = {
      ...formData,
      piscicultura_id: pisciculturaId,
      tanque_id: tanqueId
    };

    try {
      const response = await api.post('/lotes', dadosParaEnviar);
      onLoteCadastrado(response.data);
      setFormData({ // Limpa o formulário
        especie: '',
        quantidade_inicial: '',
        peso_inicial_medio_g: '',
        data_entrada: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      console.error("Erro ao cadastrar lote:", error);
      alert("Erro ao cadastrar o lote.");
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 4, p: 2, border: '1px solid #ddd', borderRadius: '4px' }}>
      <Typography variant="h6">Adicionar Novo Lote ao Tanque</Typography>
      <TextField label="Espécie" name="especie" value={formData.especie} onChange={handleInputChange} required fullWidth />
      <TextField label="Quantidade Inicial" name="quantidade_inicial" type="number" value={formData.quantidade_inicial} onChange={handleInputChange} required fullWidth />
      <TextField label="Peso Médio Inicial (gramas)" name="peso_inicial_medio_g" type="number" value={formData.peso_inicial_medio_g} onChange={handleInputChange} required fullWidth />
      <TextField label="Data de Entrada" name="data_entrada" type="date" value={formData.data_entrada} onChange={handleInputChange} required fullWidth InputLabelProps={{ shrink: true }}/>
      <Button type="submit" variant="contained">Adicionar Lote</Button>
    </Box>
  );
}

export default LoteForm;