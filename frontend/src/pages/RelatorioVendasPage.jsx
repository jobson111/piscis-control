// src/pages/RelatorioVendasPage.jsx

import { useState, useEffect } from 'react';
import { 
    Box, Typography, CircularProgress, Paper, Grid, TextField, Autocomplete,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableFooter,
    Button // <-- A palavra que faltava
} from '@mui/material';
import api from '../services/api';

function RelatorioVendasPage() {
    const [relatorio, setRelatorio] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [filtros, setFiltros] = useState({
        data_inicio: '',
        data_fim: '',
        cliente_id: ''
    });
    const [loading, setLoading] = useState(true);

    // Busca a lista de clientes para o filtro
    useEffect(() => {
        api.get('/clientes')
            .then(res => setClientes(res.data))
            .catch(err => console.error("Erro ao buscar clientes:", err));
    }, []);

    // Busca os dados do relatório sempre que um filtro mudar
    useEffect(() => {
        setLoading(true);
        // Constrói a string de parâmetros para a URL da API
        const params = new URLSearchParams({
            // Adiciona apenas os filtros que têm valor
            ...(filtros.data_inicio && { data_inicio: filtros.data_inicio }),
            ...(filtros.data_fim && { data_fim: filtros.data_fim }),
            ...(filtros.cliente_id && { cliente_id: filtros.cliente_id }),
        });

        api.get(`/vendas?${params.toString()}`)
            .then(res => setRelatorio(res.data))
            .catch(err => console.error("Erro ao buscar relatório de vendas:", err))
            .finally(() => setLoading(false));

    }, [filtros]);

    const handleFiltroChange = (name, value) => {
        setFiltros(prevFiltros => ({
            ...prevFiltros,
            [name]: value
        }));
    };

    const totalVendas = relatorio.reduce((acc, venda) => acc + parseFloat(venda.valor_final), 0);
    const formatCurrency = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <Box>
            <Typography variant="h5" gutterBottom>Relatório de Vendas</Typography>
            
            <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Filtros</Typography>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                        <Autocomplete
                            options={clientes}
                            getOptionLabel={(option) => option.nome}
                            onChange={(event, newValue) => handleFiltroChange('cliente_id', newValue?.id || '')}
                            renderInput={(params) => <TextField {...params} label="Filtrar por Cliente" />}
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField name="data_inicio" label="Data de Início" type="date" value={filtros.data_inicio} onChange={(e) => handleFiltroChange('data_inicio', e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField name="data_fim" label="Data de Fim" type="date" value={filtros.data_fim} onChange={(e) => handleFiltroChange('data_fim', e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <Button variant="outlined" onClick={() => setFiltros({ data_inicio: '', data_fim: '', cliente_id: '' })}>Limpar Filtros</Button>
                    </Grid>
                </Grid>
            </Paper>

            {loading ? <CircularProgress /> : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Data</TableCell>
                                <TableCell>Venda Nº</TableCell>
                                <TableCell>Cliente</TableCell>
                                <TableCell>Vendedor</TableCell>
                                <TableCell align="right">Valor Final</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {relatorio.map((venda) => (
                                <TableRow key={venda.id}>
                                    <TableCell>{new Date(venda.data_venda).toLocaleDateString('pt-BR')}</TableCell>
                                    <TableCell>{venda.nr_venda}</TableCell>
                                    <TableCell>{venda.nome_cliente}</TableCell>
                                    <TableCell>{venda.nome_vendedor}</TableCell>
                                    <TableCell align="right">{formatCurrency(venda.valor_final)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow sx={{ '& > *': { fontWeight: 'bold', fontSize: '1.1rem' }}}>
                                <TableCell colSpan={4}>TOTAL</TableCell>
                                <TableCell align="right">{formatCurrency(totalVendas)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
}

export default RelatorioVendasPage;