// src/components/DespesaForm.jsx

import { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import api from '../services/api';

function DespesaForm({ onSave, onCancel }) {
    const [formData, setFormData] = useState({
        conta_id: '',
        categoria_id: '',
        valor: '',
        descricao: '',
        data_movimentacao: new Date().toISOString().split('T')[0]
    });
    const [contas, setContas] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get('/contas-financeiras'),
            api.get('/categorias-despesa')
        ]).then(([contasRes, categoriasRes]) => {
            setContas(contasRes.data);
            setCategorias(categoriasRes.data);
        }).catch(err => console.error("Erro ao buscar dados para formulário:", err))
        .finally(() => setLoading(false));
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/movimentacoes/despesa', formData);
            alert('Despesa registada com sucesso!');
            onSave();
        } catch (error) {
            console.error("Erro ao registar despesa:", error);
            alert(`Falha ao registar despesa: ${error.response?.data?.error || 'Erro desconhecido'}`);
        }
    };

    if (loading) return <CircularProgress />;

    return (
        <Box component="form" onSubmit={handleSubmit}>
            <Typography variant="h6" component="h2">Registar Nova Despesa</Typography>
            <TextField name="descricao" label="Descrição da Despesa" value={formData.descricao} onChange={handleChange} fullWidth required margin="normal" />
            <TextField name="valor" label="Valor (R$)" type="number" value={formData.valor} onChange={handleChange} fullWidth required margin="normal" />
            <FormControl fullWidth margin="normal" required>
                <InputLabel>Conta de Origem</InputLabel>
                <Select name="conta_id" value={formData.conta_id} label="Conta de Origem" onChange={handleChange}>
                    {contas.filter(c => c.ativo).map(c => <MenuItem key={c.id} value={c.id}>{c.nome}</MenuItem>)}
                </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
                <InputLabel>Categoria</InputLabel>
                <Select name="categoria_id" value={formData.categoria_id} label="Categoria" onChange={handleChange}>
                    {categorias.map(cat => <MenuItem key={cat.id} value={cat.id}>{cat.nome}</MenuItem>)}
                </Select>
            </FormControl>
            <TextField name="data_movimentacao" label="Data da Despesa" type="date" value={formData.data_movimentacao} onChange={handleChange} InputLabelProps={{ shrink: true }} fullWidth required />
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button onClick={onCancel}>Cancelar</Button>
                <Button type="submit" variant="contained">Salvar Despesa</Button>
            </Box>
        </Box>
    );
}

export default DespesaForm;