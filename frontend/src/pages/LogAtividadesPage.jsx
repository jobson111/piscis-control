// src/pages/LogAtividadesPage.jsx (VERSÃO FINAL COM FILTROS)

import { useState, useEffect } from 'react';
import { 
    Box, Typography, CircularProgress, Paper, Grid, TextField, Autocomplete,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button 
} from '@mui/material';
import api from '../services/api';

function LogAtividadesPage() {
    const [logs, setLogs] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [filtros, setFiltros] = useState({
        usuario_id: '',
        data_inicio: '',
        data_fim: ''
    });
    const [loading, setLoading] = useState(true);

    // Busca a lista de usuários para o filtro
    useEffect(() => {
        api.get('/usuarios')
            .then(res => setUsuarios(res.data))
            .catch(err => console.error("Erro ao buscar usuários:", err));
    }, []);

    // Busca os dados do log sempre que um filtro mudar
    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (filtros.usuario_id) params.append('usuario_id', filtros.usuario_id);
        if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio);
        if (filtros.data_fim) params.append('data_fim', filtros.data_fim);

        api.get(`/logs?${params.toString()}`)
            .then(res => setLogs(res.data))
            .catch(err => console.error("Erro ao buscar logs de atividades:", err))
            .finally(() => setLoading(false));
    }, [filtros]);

    const handleFiltroChange = (name, value) => {
        setFiltros(prevFiltros => ({
            ...prevFiltros,
            [name]: value
        }));
    };

    return (
        <Box>
            <Typography variant="h5" gutterBottom>Log de Atividades do Sistema</Typography>
            
            <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Filtros</Typography>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                        <Autocomplete
                            options={usuarios}
                            getOptionLabel={(option) => option.nome}
                            onChange={(event, newValue) => handleFiltroChange('usuario_id', newValue?.id || '')}
                            renderInput={(params) => <TextField {...params} label="Filtrar por Usuário" />}
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField name="data_inicio" label="Data de Início" type="date" value={filtros.data_inicio} onChange={(e) => handleFiltroChange('data_inicio', e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField name="data_fim" label="Data de Fim" type="date" value={filtros.data_fim} onChange={(e) => handleFiltroChange('data_fim', e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <Button variant="outlined" onClick={() => setFiltros({ usuario_id: '', data_inicio: '', data_fim: '' })}>Limpar Filtros</Button>
                    </Grid>
                </Grid>
            </Paper>

            {loading ? <CircularProgress /> : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Data e Hora</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Usuário</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Ação Realizada</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {logs.map((log) => (
                                <TableRow key={log.id} hover>
                                    <TableCell>{new Date(log.timestamp).toLocaleString('pt-BR')}</TableCell>
                                    <TableCell>{log.usuario_nome || 'Usuário Removido'}</TableCell>
                                    <TableCell>{log.acao}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
}

export default LogAtividadesPage;