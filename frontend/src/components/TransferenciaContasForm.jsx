// src/components/TransferenciaContasForm.jsx (NOME CORRIGIDO)

import { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, TextField, FormControl, InputLabel, Select, MenuItem, Grid } from '@mui/material';
import api from '../services/api';

// O nome da função foi alterado aqui
function TransferenciaContasForm({ onSave, onCancel }) {
    const [formData, setFormData] = useState({
        conta_origem_id: '',
        conta_destino_id: '',
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
            await api.post('/movimentacoes/transferencia', formData);
            alert('Transferência realizada com sucesso!');
            onSave();
        } catch (error) {
            alert(`Falha na transferência: ${error.response?.data?.error || 'Erro desconhecido'}`);
        }
    };

    if (loading) return <CircularProgress />;

    return (
        <Box component="form" onSubmit={handleSubmit}>
            <Typography variant="h6">Transferência Entre Contas</Typography>
            <TextField name="descricao" label="Descrição da Transferência" value={formData.descricao} onChange={handleChange} fullWidth required margin="normal" autoFocus />
            <TextField name="valor" label="Valor (R$)" type="number" value={formData.valor} onChange={handleChange} fullWidth required margin="normal" />
            <Grid container spacing={2} sx={{mt: 1}}>
                <Grid item xs={6}>
                    <FormControl fullWidth required>
                        <InputLabel>Conta de Origem</InputLabel>
                        <Select name="conta_origem_id" value={formData.conta_origem_id} label="Conta de Origem" onChange={handleChange}>
                            {contas.map(c => <MenuItem key={c.id} value={c.id}>{c.nome}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={6}>
                    <FormControl fullWidth required>
                        <InputLabel>Conta de Destino</InputLabel>
                        <Select name="conta_destino_id" value={formData.conta_destino_id} label="Conta de Destino" onChange={handleChange}>
                             {contas.map(c => <MenuItem key={c.id} value={c.id}>{c.nome}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>
            <TextField name="data_movimentacao" label="Data da Transferência" type="date" value={formData.data_movimentacao} onChange={handleChange} InputLabelProps={{ shrink: true }} fullWidth required margin="normal" />
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button onClick={onCancel}>Cancelar</Button>
                <Button type="submit" variant="contained">Salvar Transferência</Button>
            </Box>
        </Box>
    );
}

// O nome no export foi alterado aqui
export default TransferenciaContasForm;