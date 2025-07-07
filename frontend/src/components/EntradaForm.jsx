import { useState, useEffect } from 'react';
import { 
    Box, TextField, Button, Typography, Paper, IconButton, Grid,
    Select, MenuItem, FormControl, InputLabel, RadioGroup, FormControlLabel, Radio
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function EntradaForm({ onEntradaCriada }) {
    const { user } = useAuth();
    
    // Estado para os dados da nota fiscal
    const [entradaData, setEntradaData] = useState({
        nr_nota_fiscal: '',
        fornecedor: '',
        data_entrada: new Date().toISOString().split('T')[0],
        valor_total_nota: '',
        observacoes: ''
    });

    // Estado para a lista de lotes a serem adicionados
    const [lotesData, setLotesData] = useState([
        { tanque_id: '', especie: '', quantidade_inicial: '', peso_inicial_medio_g: '', acao_tanque_ocupado: 'somar' }
    ]);
    
    // Estado para guardar a lista de tanques disponíveis
    const [tanquesDisponiveis, setTanquesDisponiveis] = useState([]);

    // Busca os tanques disponíveis quando o componente é montado
    useEffect(() => {
        if (user?.pisciculturaId) {
            async function fetchTanques() {
                try {
                    const response = await api.get(`/tanques?piscicultura_id=${user.pisciculturaId}`); 
                    setTanquesDisponiveis(response.data);
                } catch (error) {
                    console.error("Erro ao buscar tanques:", error);
                }
            }
            fetchTanques();
        }
    }, [user]);

    // --- Funções para manipular o estado ---

    const handleEntradaChange = (e) => {
        setEntradaData({ ...entradaData, [e.target.name]: e.target.value });
    };

    const handleLoteChange = (index, e) => {
        const novosLotes = [...lotesData];
        novosLotes[index][e.target.name] = e.target.value;
        setLotesData(novosLotes);
    };

    // Função melhorada para copiar dados do lote anterior
    const adicionarLote = () => {
        const ultimoLote = lotesData[lotesData.length - 1];
        setLotesData([...lotesData, { 
            tanque_id: '', // O tanque nunca é copiado
            especie: ultimoLote.especie, 
            quantidade_inicial: ultimoLote.quantidade_inicial, 
            peso_inicial_medio_g: ultimoLote.peso_inicial_medio_g,
            acao_tanque_ocupado: 'somar'
        }]);
    };

    const removerLote = (index) => {
        const novosLotes = [...lotesData];
        novosLotes.splice(index, 1);
        setLotesData(novosLotes);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/entradas', { entradaData, lotesData });
            onEntradaCriada();
        } catch (error) {
            console.error("Erro ao criar entrada:", error);
            alert('Falha ao criar a entrada. Verifique os dados.');
        }
    };

    return (
        <Paper component="form" onSubmit={handleSubmit} elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Registar Nova Entrada de Peixes</Typography>
            
            {/* Secção de Dados da Nota Fiscal */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6}>
                    <TextField name="nr_nota_fiscal" label="Nº Nota Fiscal" value={entradaData.nr_nota_fiscal} onChange={handleEntradaChange} fullWidth />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField name="fornecedor" label="Fornecedor" value={entradaData.fornecedor} onChange={handleEntradaChange} fullWidth />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField name="data_entrada" label="Data de Entrada" type="date" value={entradaData.data_entrada} onChange={handleEntradaChange} InputLabelProps={{ shrink: true }} fullWidth required />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField name="valor_total_nota" label="Valor Total da Nota (R$)" type="number" value={entradaData.valor_total_nota} onChange={handleEntradaChange} fullWidth />
                </Grid>
                <Grid item xs={12}>
                    <TextField name="observacoes" label="Observações" value={entradaData.observacoes} onChange={handleEntradaChange} fullWidth multiline rows={2} />
                </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom>Lotes a serem Adicionados</Typography>
            
            {/* Secção Dinâmica de Lotes */}
            {lotesData.map((lote, index) => {
                const tanqueSelecionado = tanquesDisponiveis.find(t => t.id === lote.tanque_id);
                const isTanqueOcupado = tanqueSelecionado?.ocupado;

                return (
                    <Box key={index} sx={{ border: '1px solid #eee', p: 2, mb: 2, borderRadius: 1 }}>
                        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                            <Grid item xs={12} sm={4}>
                                <FormControl fullWidth required>
                                    <InputLabel>Tanque de Destino</InputLabel>
                                    <Select name="tanque_id" value={lote.tanque_id} label="Tanque de Destino" onChange={(e) => handleLoteChange(index, e)}>
                                        {tanquesDisponiveis.map(tanque => (
                                            <MenuItem key={tanque.id} value={tanque.id} sx={{ backgroundColor: tanque.ocupado ? 'warning.light' : 'transparent' }}>
                                                {tanque.nome_identificador} {tanque.ocupado ? '(Ocupado)' : ''}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={3}>
                                <TextField name="especie" label="Espécie" value={lote.especie} onChange={(e) => handleLoteChange(index, e)} fullWidth required />
                            </Grid>
                            <Grid item xs={12} sm={2}>
                                <TextField name="quantidade_inicial" label="Qtd." type="number" value={lote.quantidade_inicial} onChange={(e) => handleLoteChange(index, e)} fullWidth required />
                            </Grid>
                            <Grid item xs={12} sm={2}>
                                <TextField name="peso_inicial_medio_g" label="Peso (g)" type="number" value={lote.peso_inicial_medio_g} onChange={(e) => handleLoteChange(index, e)} fullWidth required />
                            </Grid>
                            <Grid item xs={12} sm={1}>
                                <IconButton onClick={() => removerLote(index)} color="error" disabled={lotesData.length === 1}>
                                    <RemoveCircleOutlineIcon />
                                </IconButton>
                            </Grid>
                        </Grid>

                        {isTanqueOcupado && (
                            <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.100', borderRadius: 1 }}>
                                <FormControl>
                                    <Typography variant="subtitle2" gutterBottom>Atenção: O tanque selecionado já contém um lote ativo. O que deseja fazer?</Typography>
                                    <RadioGroup
                                        row
                                        name="acao_tanque_ocupado"
                                        value={lote.acao_tanque_ocupado}
                                        onChange={(e) => handleLoteChange(index, e)}
                                    >
                                        <FormControlLabel value="somar" control={<Radio />} label="Somar ao lote existente" />
                                        <FormControlLabel value="zerar" control={<Radio />} label="Zerar o lote antigo e criar um novo" />
                                    </RadioGroup>
                                </FormControl>
                            </Box>
                        )}
                    </Box>
                )
            })}

            <Button startIcon={<AddCircleOutlineIcon />} onClick={adicionarLote} sx={{ mt: 1 }}>
                Adicionar outro Lote
            </Button>

            <Box sx={{ mt: 4, textAlign: 'right' }}>
                <Button type="submit" variant="contained" size="large">Salvar Entrada Completa</Button>
            </Box>
        </Paper>
    );
}

export default EntradaForm;