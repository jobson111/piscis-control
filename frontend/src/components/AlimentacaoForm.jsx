// src/components/AlimentacaoForm.jsx
import { useState } from 'react';
import { TextField, Button, Box, Typography } from '@mui/material';
import api from '../services/api';

function AlimentacaoForm({ loteId, pisciculturaId, onAlimentacaoRegistada }) {
  const [formData, setFormData] = useState({ tipo_racao: '', quantidade_kg: '' });

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  async function handleSubmit(event) {
    event.preventDefault();
    const dadosParaEnviar = { ...formData, lote_id: loteId, piscicultura_id: pisciculturaId };
    try {
      const response = await api.post('/alimentacao', dadosParaEnviar);
      onAlimentacaoRegistada(response.data);
      setFormData({ tipo_racao: '', quantidade_kg: '' });
    } catch (error) {
      console.error("Erro ao registar alimentação:", error);
      alert("Erro ao registar alimentação.");
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 4, p: 2, border: '1px solid #ddd', borderRadius: '4px' }}>
      <Typography variant="h6">Registar Alimentação</Typography>
      <TextField label="Tipo de Ração" name="tipo_racao" value={formData.tipo_racao} onChange={handleInputChange} required fullWidth />
      <TextField label="Quantidade (kg)" name="quantidade_kg" type="number" value={formData.quantidade_kg} onChange={handleInputChange} required fullWidth />
      <Button type="submit" variant="contained">Registar Alimentação</Button>
    </Box>
  );
}
export default AlimentacaoForm;