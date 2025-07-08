import { useState, useEffect } from 'react';
import { 
    Box, TextField, Button, Typography, Paper, IconButton, Grid,
    Select, MenuItem, FormControl, InputLabel, Autocomplete, CircularProgress, Checkbox, FormControlLabel
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function TransferenciaForm({ onTransferenciaRealizada }) {
    const { user } = useAuth();
    
    // States do formulário
    const [tanqueOrigem, setTanqueOrigem] = useState(null);
    const [loteDeOrigem, setLoteDeOrigem] = useState(null);
    const [dataManejo, setDataManejo] = useState(new Date().toISOString().split('T')[0]);
    const [observacoes, setObservacoes] = useState('');
    const [destinos, setDestinos] = useState([{ tanqueId: '', quantidade: '', pesoMedio: '' }]);
    const [zerarLoteOrigem, setZerarLoteOrigem] = useState(false);

    // States das listas
    const [tanquesDisponiveis, setTanquesDisponiveis] = useState([]);
    const [loading, setLoading] = useState(true);

    // Busca todos os tanques da piscicultura quando o componente carrega
    useEffect(() => {
        if (user?.pisciculturaId) {
            const fetchTanques = async () => {
                setLoading(true);
                try {
                    const response = await api.get(`/tanques?piscicultura_id=${user.pisciculturaId}`); 
                    setTanquesDisponiveis(response.data);
                } catch (error) {
                    console.error("Erro ao buscar tanques:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchTanques();
        }
    }, [user]);

    // Busca o lote ativo específico sempre que um tanque de origem é selecionado
    useEffect(() => {
        if (tanqueOrigem) {
            const fetchLoteAtivo = async () => {
                try {
                    const response = await api.get(`/lotes?tanque_id=${tanqueOrigem.id}&status=Ativo`);
                    setLoteDeOrigem(response.data[0] || null);
                } catch (error) {
                    console.error("Erro ao buscar lote ativo:", error);
                    setLoteDeOrigem(null);
                }
            };
            fetchLoteAtivo();
        } else {
            setLoteDeOrigem(null);
        }
    }, [tanqueOrigem]);


    const handleDestinoChange = (index, event) => {
        const novosDestinos = [...destinos];
        novosDestinos[index][event.target.name] = event.target.value;
        setDestinos(novosDestinos);
    };

    const adicionarDestino = () => {
        const ultimoDestino = destinos[destinos.length - 1];
        setDestinos([...destinos, { 
            tanqueId: '',
            quantidade: ultimoDestino.quantidade, 
            pesoMedio: ultimoDestino.pesoMedio,
        }]);
    };

    const removerDestino = (index) => {
        const novosDestinos = [...destinos];
        novosDestinos.splice(index, 1);
        setDestinos(novosDestinos);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!loteDeOrigem) {
            alert("O tanque de origem selecionado não possui um lote ativo para transferir.");
            return;
        }
        const payload = {
            loteOrigemId: loteDeOrigem.id,
            dataManejo,
            observacoes,
            destinos,
            zerarLoteOrigem: zerarLoteOrigem 
        };
        try {
            await api.post('/manejos/transferencia', payload);
            alert('Transferência realizada com sucesso!');
            onTransferenciaRealizada();
        } catch (error) {
            console.error("Erro ao realizar transferência:", error);
            alert(`Falha na transferência: ${error.response?.data?.error || 'Erro desconhecido'}`);
        }
    };
    
    if (loading) return <CircularProgress />;

    return (
        <Paper component="form" onSubmit={handleSubmit} elevation={3} sx={{ p: 3, mt: 4 }}>
            <Typography variant="h6" gutterBottom>Realizar Classificação / Transferência</Typography>
            
            <Grid container spacing={2} sx={{ mb: 2, alignItems: 'center' }}>
                <Grid item xs={12} md={6}>
                    <Autocomplete
                        options={tanquesDisponiveis.filter(t => t.ocupado)}
                        getOptionLabel={(option) => `Tanque ${option.nome_identificador}`}
                        value={tanqueOrigem}
                        onChange={(event, newValue) => { setTanqueOrigem(newValue); }}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        renderInput={(params) => <TextField {...params} label="Selecione o Tanque de Origem" required />}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField name="dataManejo" label="Data do Manejo" type="date" value={dataManejo} onChange={(e) => setDataManejo(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth required />
                </Grid>
                {loteDeOrigem && (
                    <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                            Lote a ser transferido: Aprox. {loteDeOrigem.quantidade_atual} x {loteDeOrigem.especie} com peso médio de {loteDeOrigem.peso_atual_medio_g || loteDeOrigem.peso_inicial_medio_g}g.
                        </Typography>
                    </Grid>
                )}
            </Grid>

            <FormControlLabel 
                control={<Checkbox checked={zerarLoteOrigem} onChange={(e) => setZerarLoteOrigem(e.target.checked)} />} 
                label="Zerar lote de origem e registar sobras como perda" 
                sx={{ mb: 2 }}
            />

            <Typography variant="h6" gutterBottom>Destinos</Typography>
            
            {destinos.map((destino, index) => {
                const tanqueDestinoSelecionado = tanquesDisponiveis.find(t => t.id === destino.tanqueId);
                return (
                    <Grid container spacing={2} key={index} sx={{ mb: 2, alignItems: 'start' }}>
                         <Grid item xs={12} sm={4}>
                             <FormControl fullWidth required>
                                 <InputLabel>Tanque de Destino</InputLabel>
                                 <Select name="tanqueId" value={destino.tanqueId} label="Tanque de Destino" onChange={(e) => handleDestinoChange(index, e)}>
                                     {tanquesDisponiveis.map(tanque => (
                                         <MenuItem key={tanque.id} value={tanque.id}>
                                             {tanque.nome_identificador} {tanque.ocupado ? '(Ocupado)' : ''}
                                         </MenuItem>
                                     ))}
                                 </Select>
                             </FormControl>
                             {tanqueDestinoSelecionado?.ocupado && (
                                <Typography variant="caption" color="text.secondary" sx={{pl: 2}}>
                                    Contém: {tanqueDestinoSelecionado.lote_ativo_quantidade} x {tanqueDestinoSelecionado.lote_ativo_especie}
                                </Typography>
                             )}
                         </Grid>
                         <Grid item xs={12} sm={3}><TextField name="quantidade" label="Qtd. Transferida" type="number" value={destino.quantidade} onChange={(e) => handleDestinoChange(index, e)} fullWidth required /></Grid>
                         <Grid item xs={12} sm={3}><TextField name="pesoMedio" label="Peso Médio (g)" type="number" value={destino.pesoMedio} onChange={(e) => handleDestinoChange(index, e)} fullWidth required /></Grid>
                         <Grid item xs={12} sm={2}><IconButton onClick={() => removerDestino(index)} color="error" disabled={destinos.length === 1}><RemoveCircleOutlineIcon /></IconButton></Grid>
                    </Grid>
                )
            })}
            
            <Button startIcon={<AddCircleOutlineIcon />} onClick={adicionarDestino}>Adicionar Destino</Button>
            
            <Box sx={{ mt: 4 }}><TextField name="observacoes" label="Observações do Manejo" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} fullWidth multiline rows={3} /></Box>
            <Box sx={{ mt: 2, textAlign: 'right' }}><Button type="submit" variant="contained" size="large" disabled={!loteDeOrigem}>Executar Manejo de Transferência</Button></Box>
        </Paper>
    );
}

export default TransferenciaForm;