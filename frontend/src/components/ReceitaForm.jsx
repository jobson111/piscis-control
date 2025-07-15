// src/components/ReceitaForm.jsx

import { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import api from '../services/api';

function ReceitaForm({ onSave, onCancel }) {
    const [formData, setFormData] = useState({
        conta_id: '',
        valor: '',
        descricao: '',
        data_movimentacao: new Date().toISOString().split('T')[0]
    });
    const [contas, setContas] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/contas-financeiras?ativo=true')
            .then(res => setContas(res.data))
            .catch(err => console.error("Erro ao buscar contas:", err))
            .finally(() => setLoading(false));
    }, []);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/movimentacoes/receita', formData);
            alert('Receita registada com sucesso!');
            onSave();
        } catch (error) {
            alert(`Falha ao registar receita: ${error.response?.data?.error || 'Erro desconhecido'}`);
        }
    };

    if (loading) return <CircularProgress />;

    return (
        <Box component="form" onSubmit={handleSubmit}>
            <Typography variant="h6">Registar Nova Receita</Typography>
            <TextField name="descricao" label="Descrição da Receita (ex: Aporte de sócio)" value={formData.descricao} onChange={handleChange} fullWidth required margin="normal" autoFocus />
            <TextField name="valor" label="Valor (R$)" type="number" value={formData.valor} onChange={handleChange} fullWidth required margin="normal" />
            <FormControl fullWidth margin="normal" required>
                <InputLabel>Conta de Destino</InputLabel>
                <Select name="conta_id" value={formData.conta_id} label="Conta de Destino" onChange={handleChange}>
                    {contas.map(c => <MenuItem key={c.id} value={c.id}>{c.nome}</MenuItem>)}
                </Select>
            </FormControl>
            <TextField name="data_movimentacao" label="Data da Receita" type="date" value={formData.data_movimentacao} onChange={handleChange} InputLabelProps={{ shrink: true }} fullWidth required />
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button onClick={onCancel}>Cancelar</Button>
                <Button type="submit" variant="contained">Salvar Receita</Button>
            </Box>
        </Box>
    );
}

export default ReceitaForm;