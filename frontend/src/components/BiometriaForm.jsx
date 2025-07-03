// src/components/BiometriaForm.jsx
import { useState } from 'react';
import { TextField, Button, Box, Typography } from '@mui/material';
import api from '../services/api';

function BiometriaForm({ loteId, pisciculturaId, onBiometriaRegistada }) {
  const [formData, setFormData] = useState({
    peso_medio_gramas: '',
    quantidade_amostra: '',
    observacoes: '',
  });

  function handleInputChange(event) {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const dadosParaEnviar = {
      ...formData,
      lote_id: loteId,
      piscicultura_id: pisciculturaId,
    };

    try {
      const response = await api.post('/biometrias', dadosParaEnviar);
      onBiometriaRegistada(response.data);
      setFormData({ peso_medio_gramas: '', quantidade_amostra: '', observacoes: '' });
    } catch (error) {
      console.error("Erro ao registar biometria:", error);
      alert("Erro ao registar a biometria.");
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 4, p: 2, border: '1px solid #ddd', borderRadius: '4px' }}>
      <Typography variant="h6">Registar Nova Biometria</Typography>
      <TextField label="Peso Médio (gramas)" name="peso_medio_gramas" type="number" value={formData.peso_medio_gramas} onChange={handleInputChange} required fullWidth />
      <TextField label="Quantidade da Amostra" name="quantidade_amostra" type="number" value={formData.quantidade_amostra} onChange={handleInputChange} fullWidth />
      <TextField label="Observações" name="observacoes" value={formData.observacoes} onChange={handleInputChange} fullWidth multiline rows={2} />
      <Button type="submit" variant="contained">Registar Biometria</Button>
    </Box>
  );
}
export default BiometriaForm;