// src/components/AlimentacaoForm.jsx (VERSÃO COM CAMPO DE CUSTO)

import { useState } from 'react';
import { TextField, Button, Box, Typography } from '@mui/material';
import api from '../services/api';

function AlimentacaoForm({ loteId, pisciculturaId, onAlimentacaoRegistada }) {
  const [formData, setFormData] = useState({
    tipo_racao: '',
    quantidade_kg: '',
    custo_total: '', // Nosso novo campo
    data_alimentacao: new Date().toISOString().split('T')[0],
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  async function handleSubmit(event) {
    event.preventDefault();
    const dadosParaEnviar = {
      lote_id: loteId,
      piscicultura_id: pisciculturaId,
      tipo_racao: formData.tipo_racao,
      quantidade_kg: formData.quantidade_kg,
      custo_total: formData.custo_total, // Envia o novo dado
      data_alimentacao: formData.data_alimentacao,
    };

    try {
      // O endpoint de criação precisa ser atualizado no backend para receber este campo
      const response = await api.post('/alimentacao', dadosParaEnviar);
      onAlimentacaoRegistada(response.data);
      // Limpa o formulário
      setFormData({ tipo_racao: '', quantidade_kg: '', custo_total: '', data_alimentacao: new Date().toISOString().split('T')[0] });
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
      
      {/* --- NOVO CAMPO --- */}
      <TextField label="Custo Total (R$)" name="custo_total" type="number" value={formData.custo_total} onChange={handleInputChange} fullWidth />

      <TextField label="Data da Alimentação" name="data_alimentacao" type="date" value={formData.data_alimentacao} onChange={handleInputChange} InputLabelProps={{ shrink: true }} fullWidth required />
      <Button type="submit" variant="contained">Registar</Button>
    </Box>
  );
}

export default AlimentacaoForm;