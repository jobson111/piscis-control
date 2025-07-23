// src/pages/RelatorioTransferenciasPage.jsx (VERSÃO FINAL COM OPÇÕES DE VISUALIZAÇÃO)

import { useState, useEffect } from 'react';
import { 
    Box, Typography, CircularProgress, Paper, Grid, TextField, Autocomplete,
    Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, ToggleButtonGroup, ToggleButton, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ViewModuleIcon from '@mui/icons-material/ViewModule'; // Ícone para Cards
import ViewListIcon from '@mui/icons-material/ViewList'; // Ícone para Lista
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function RelatorioTransferenciasPage() {
    const { user } = useAuth();
    const [transferencias, setTransferencias] = useState([]);
    const [tanques, setTanques] = useState([]);
    const [filtros, setFiltros] = useState({ data_inicio: '', data_fim: '', tanque_origem_id: '' });
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('card'); // 'card' ou 'list'

    // Busca a lista de tanques para o filtro
    useEffect(() => {
        if (user) {
            api.get(`/tanques?piscicultura_id=${user.pisciculturaId}`)
                .then(res => setTanques(res.data))
                .catch(err => console.error("Erro ao buscar tanques:", err));
        }
    }, [user]);

    // Busca os dados do relatório sempre que um filtro mudar
    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio);
        if (filtros.data_fim) params.append('data_fim', filtros.data_fim);
        if (filtros.tanque_origem_id) params.append('tanque_origem_id', filtros.tanque_origem_id);

        api.get(`/relatorios/transferencias?${params.toString()}`)
            .then(res => setTransferencias(res.data))
            .catch(err => console.error("Erro ao buscar histórico de transferências:", err))
            .finally(() => setLoading(false));
    }, [filtros]);

    const handleFiltroChange = (name, value) => {
        setFiltros(prev => ({ ...prev, [name]: value }));
    };

    const handleViewChange = (event, newViewMode) => {
        if (newViewMode !== null) {
            setViewMode(newViewMode);
        }
    };

    // Componente interno para a Tabela de Destinos (para reutilizar em ambas as visualizações)
    const TabelaDestinos = ({ destinos }) => (
        <TableContainer>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell sx={{fontWeight: 'bold'}}>Tanque de Destino</TableCell>
                        <TableCell sx={{fontWeight: 'bold'}}>Novo Lote</TableCell>
                        <TableCell align="right" sx={{fontWeight: 'bold'}}>Quantidade</TableCell>
                        <TableCell align="right" sx={{fontWeight: 'bold'}}>Peso Médio (g)</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {destinos.map((destino) => (
                        <TableRow key={destino.lote_destino_id}>
                            <TableCell sx={{color: 'text.primary'}}>{destino.nome_tanque_destino}</TableCell>
                            <TableCell sx={{color: 'text.secondary'}}>#{destino.lote_destino_id}</TableCell>
                            <TableCell align="right" sx={{fontWeight: 'bold'}}>{destino.quantidade}</TableCell>
                            <TableCell align="right" sx={{fontWeight: 'bold'}}>{parseFloat(destino.peso_medio_g).toFixed(2)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );

    return (
        <Box>
            <Typography variant="h5" gutterBottom>Histórico de Manejos de Transferência</Typography>
            
            <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}> <Autocomplete options={tanques} getOptionLabel={(option) => option.nome_identificador} onChange={(event, newValue) => handleFiltroChange('tanque_origem_id', newValue?.id || '')} renderInput={(params) => <TextField {...params} label="Filtrar por Tanque de Origem" />} /> </Grid>
                    <Grid item xs={12} sm={3}> <TextField name="data_inicio" label="Data de Início" type="date" value={filtros.data_inicio} onChange={(e) => handleFiltroChange('data_inicio', e.target.value)} InputLabelProps={{ shrink: true }} fullWidth /> </Grid>
                    <Grid item xs={12} sm={3}> <TextField name="fim" label="Data de Fim" type="date" value={filtros.data_fim} onChange={(e) => handleFiltroChange('fim', e.target.value)} InputLabelProps={{ shrink: true }} fullWidth /> </Grid>
                    <Grid item xs={12} sm={2}> <Button variant="outlined" onClick={() => setFiltros({ data_inicio: '', data_fim: '', tanque_origem_id: '' })}>Limpar</Button> </Grid>
                </Grid>
            </Paper>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">{transferencias.length} evento(s) encontrado(s)</Typography>
                <ToggleButtonGroup value={viewMode} exclusive onChange={handleViewChange} size="small">
                    <ToggleButton value="card"><ViewModuleIcon /></ToggleButton>
                    <ToggleButton value="list"><ViewListIcon /></ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {loading ? <CircularProgress /> : (
                <Grid container spacing={viewMode === 'card' ? 3 : 1}>
                    {transferencias.length === 0 ? (
                        <Grid item xs={12}><Typography>Nenhum evento de transferência encontrado.</Typography></Grid>
                    ) : (
                        transferencias.map((evento) => (
                            <Grid item xs={12} key={evento.lote_origem_id}>
                                {viewMode === 'card' ? (
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                                <Typography variant="h6">Origem: <Typography component="span" variant="h6" color="primary.main">{evento.nome_tanque_origem}</Typography> (Lote #{evento.lote_origem_id})</Typography>
                                                <Typography color="textPrimary">{new Date(evento.data_transferencia).toLocaleDateString('pt-BR')}</Typography>
                                            </Box>
                                            <TabelaDestinos destinos={evento.destinos} />
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <Accordion>
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                                <Typography sx={{ fontWeight: 'bold' }}>Origem: Tanque {evento.nome_tanque_origem} (Lote #{evento.lote_origem_id})</Typography>
                                                <Typography variant="body2" color="textPrimary">{new Date(evento.data_transferencia).toLocaleDateString('pt-BR')}</Typography>
                                            </Box>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <TabelaDestinos destinos={evento.destinos} />
                                        </AccordionDetails>
                                    </Accordion>
                                )}
                            </Grid>
                        ))
                    )}
                </Grid>
            )}
        </Box>
    );
}

export default RelatorioTransferenciasPage;