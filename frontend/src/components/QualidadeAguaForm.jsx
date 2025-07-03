// src/components/QualidadeAguaForm.jsx
import { useState } from 'react';
import { TextField, Button, Box, Typography } from '@mui/material';
import api from '../services/api';

function QualidadeAguaForm({ pisciculturaId, tanqueId, corpoDaguaId, onQualidadeAguaRegistada }) {
  const [formData, setFormData] = useState({ ph: '', temperatura_celsius: '', oxigenio_dissolvido_mg_l: '' });

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  async function handleSubmit(event) {
    event.preventDefault();

    // Lógica para enviar ou tanque_id ou corpo_dagua_id, baseado no que recebemos
    const dadosParaEnviar = {
      ...formData,
      piscicultura_id: pisciculturaId,
      // Se houver um corpoDaguaId, a medição é dele, senão, é do tanque.
      ...(corpoDaguaId ? { corpo_dagua_id: corpoDaguaId } : { tanque_id: tanqueId })
    };

    try {
      const response = await api.post('/qualidade-agua', dadosParaEnviar);
      onQualidadeAguaRegistada(response.data);
      setFormData({ ph: '', temperatura_celsius: '', oxigenio_dissolvido_mg_l: '' });
    } catch (error) {
      console.error("Erro ao registar qualidade da água:", error);
      alert("Erro ao registar qualidade da água.");
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 4, p: 2, border: '1px solid #ddd', borderRadius: '4px' }}>
      <Typography variant="h6">Registar Qualidade da Água</Typography>
      <TextField label="pH" name="ph" type="number" step="0.1" value={formData.ph} onChange={handleInputChange} fullWidth />
      <TextField label="Temperatura (°C)" name="temperatura_celsius" type="number" step="0.1" value={formData.temperatura_celsius} onChange={handleInputChange} fullWidth />
      <TextField label="Oxigénio Dissolvido (mg/L)" name="oxigenio_dissolvido_mg_l" type="number" step="0.1" value={formData.oxigenio_dissolvido_mg_l} onChange={handleInputChange} fullWidth />
      {/* Adicione outros campos como amonia, nitrito, etc. aqui se desejar */}
      <Button type="submit" variant="contained">Registar Medição</Button>
    </Box>
  );
}
export default QualidadeAguaForm;