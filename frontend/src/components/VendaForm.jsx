import { useState, useEffect } from 'react';
import {
    Box, Grid, TextField, Button, Typography, IconButton, Paper, Divider,
    Autocomplete, FormControl, InputLabel, Select, MenuItem, CircularProgress, Chip
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import api from '../services/api';

function VendaForm({ onSave, onCancel }) {
    // States para os dados dos dropdowns
    const [clientes, setClientes] = useState([]);
    const [lotesAtivos, setLotesAtivos] = useState([]);
    const [formasPagamentoDisponiveis, setFormasPagamentoDisponiveis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ultimaNota, setUltimaNota] = useState('');

    // States para os dados da venda
    const [vendaHeader, setVendaHeader] = useState({
        cliente_id: null,
        nr_nota_fiscal: '',
        data_venda: new Date().toISOString().split('T')[0],
        observacoes: '',
        valor_desconto: 0,
    });
    const [itens, setItens] = useState([{ lote_id: '', quantidade_kg: '', preco_por_kg: '', peso_medio_na_venda_g: '', infoLote: null }]);
    const [pagamentos, setPagamentos] = useState([{ forma_pagamento_id: '', valor: '' }]);

    // Busca os dados iniciais
    useEffect(() => {
        setLoading(true);
        Promise.all([
            api.get('/clientes'),
            api.get('/lotes?status=Ativo'),
            api.get('/formas-pagamento'),
            api.get('/vendas/ultima-nota')
        ]).then(([clientesRes, lotesRes, formasPagamentoRes, ultimaNotaRes]) => {
            setClientes(clientesRes.data);
            setLotesAtivos(lotesRes.data);
            setFormasPagamentoDisponiveis(formasPagamentoRes.data);
            setUltimaNota(ultimaNotaRes.data.nr_nota_fiscal);
        }).catch(err => console.error("Erro ao buscar dados iniciais para o formulário de venda:", err))
        .finally(() => setLoading(false));
    }, []);

    // --- Cálculos automáticos ---
    const valorBruto = itens.reduce((acc, item) => acc + (parseFloat(item.quantidade_kg || 0) * parseFloat(item.preco_por_kg || 0)), 0);
    const valorFinal = valorBruto - parseFloat(vendaHeader.valor_desconto || 0);
    const valorPago = pagamentos.reduce((acc, pgto) => acc + parseFloat(pgto.valor || 0), 0);
    const valorRestante = valorFinal - valorPago;
    const formatCurrency = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // --- LÓGICA DE PREENCHIMENTO AUTOMÁTICO DO PAGAMENTO ---
    useEffect(() => {
        // Se só houver um campo de pagamento, atualiza o valor dele para ser o total da venda.
        if (pagamentos.length === 1) {
            setPagamentos([{ ...pagamentos[0], valor: valorFinal > 0 ? valorFinal.toFixed(2) : '' }]);
        }
    }, [valorFinal]); // Roda sempre que o valor final da venda mudar

    // --- Handlers ---
    const handleHeaderChange = (e) => setVendaHeader({ ...vendaHeader, [e.target.name]: e.target.value });
    
    const handleItemChange = (index, name, value) => {
        const novosItens = [...itens];
        novosItens[index][name] = value;
        if (name === 'lote_id') {
            novosItens[index]['infoLote'] = lotesAtivos.find(l => l.id === value) || null;
        }
        setItens(novosItens);
    };

    const adicionarItem = () => setItens([...itens, { lote_id: '', quantidade_kg: '', preco_por_kg: '', peso_medio_na_venda_g: '', infoLote: null }]);
    const removerItem = (index) => setItens(itens.filter((_, i) => i !== index));

    const handlePagamentoChange = (index, e) => {
        const novosPagamentos = [...pagamentos];
        novosPagamentos[index][e.target.name] = e.target.value;
        setPagamentos(novosPagamentos);
    };

    const adicionarPagamento = () => {
        const valorPagoAtual = pagamentos.reduce((acc, pgto) => acc + parseFloat(pgto.valor || 0), 0);
        const valorQueFalta = valorFinal - valorPagoAtual;
        setPagamentos([...pagamentos, { forma_pagamento_id: '', valor: valorQueFalta > 0 ? valorQueFalta.toFixed(2) : '' }]);
    };

    const removerPagamento = (index) => setPagamentos(pagamentos.filter((_, i) => i !== index));

    const handleSubmit = (e) => {
        e.preventDefault();
        if (Math.abs(valorRestante) > 0.01) {
            alert('O valor total dos pagamentos não corresponde ao valor final da venda.');
            return;
        }
        const payload = { ...vendaHeader, valor_bruto: valorBruto, valor_final: valorFinal, itens, pagamentos };
        onSave(payload);
    };

    if (loading) return <CircularProgress />;

    return (
        <Box component="form" onSubmit={handleSubmit}>
            <Typography variant="h6" gutterBottom>Registar Nova Venda</Typography>
            
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        {/* CAMPO DE CLIENTE CORRIGIDO */}
                        <Autocomplete 
                            options={clientes} 
                            // O que aparece no campo depois de selecionar (só o nome)
                            getOptionLabel={(c) => c.nome || ""} 
                            // Como cada opção aparece na lista dropdown (com detalhes)
                            renderOption={(props, option) => (
                                <Box component="li" {...props}>
                                    {option.nome} ({option.cpf_cnpj || 'N/A'})
                                </Box>
                            )}
                            onChange={(e, cliente) => setVendaHeader({...vendaHeader, cliente_id: cliente?.id })}
                            renderInput={(params) => <TextField {...params} label="Cliente" required />}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField name="data_venda" label="Data da Venda" type="date" value={vendaHeader.data_venda} onChange={handleHeaderChange} InputLabelProps={{ shrink: true }} fullWidth required />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField name="nr_nota_fiscal" label="Nº Nota Fiscal" value={vendaHeader.nr_nota_fiscal} onChange={handleHeaderChange} fullWidth 
                            helperText={`Última nota registada: ${ultimaNota}`}
                        />
                    </Grid>
                </Grid>
            </Paper>

            <Typography variant="subtitle1" gutterBottom>Itens da Venda ("Carrinho")</Typography>
            {itens.map((item, index) => (
                <Paper variant="outlined" sx={{ p: 2, mb: 1 }} key={index}>
                    <Grid container spacing={2} alignItems="flex-start">
                        <Grid item xs={12} sm={5}>
                            <FormControl fullWidth required>
                                <InputLabel>Lote de Origem</InputLabel>
                                <Select name="lote_id" value={item.lote_id} label="Lote de Origem" onChange={(e) => handleItemChange(index, 'lote_id', e.target.value)}>
                                    {lotesAtivos.map(lote => <MenuItem key={lote.id} value={lote.id}>{`Lote ${lote.id} (${lote.especie}) - Tanque: ${lote.nome_tanque}`}</MenuItem>)}
                                </Select>
                            </FormControl>
                            {item.infoLote && (
                                <Box sx={{mt: 1}}>
                                    <Chip label={`Estoque: ${item.infoLote.quantidade_atual} un.`} size="small" variant="outlined" />
                                    <Chip label={`Peso: ~${parseFloat(item.infoLote.peso_atual_medio_g || item.infoLote.peso_inicial_medio_g).toFixed(0)}g`} size="small" sx={{ml: 1}} variant="outlined" />
                                </Box>
                            )}
                        </Grid>
                        <Grid item xs={6} sm={2}><TextField name="quantidade_kg" label="Qtd (kg)" type="number" value={item.quantidade_kg} onChange={(e) => handleItemChange(index, 'quantidade_kg', e.target.value)} fullWidth required /></Grid>
                        <Grid item xs={6} sm={2}><TextField name="preco_por_kg" label="Preço/kg" type="number" value={item.preco_por_kg} onChange={(e) => handleItemChange(index, 'preco_por_kg', e.target.value)} fullWidth required /></Grid>
                        <Grid item xs={12} sm={2}><TextField name="peso_medio_na_venda_g" label="Peso Médio (g)" type="number" value={item.peso_medio_na_venda_g} onChange={(e) => handleItemChange(index, 'peso_medio_na_venda_g', e.target.value)} fullWidth required /></Grid>
                        <Grid item xs={12} sm={1}><IconButton onClick={() => removerItem(index)} color="error" disabled={itens.length === 1}><RemoveCircleOutlineIcon /></IconButton></Grid>
                    </Grid>
                </Paper>
            ))}
            <Button startIcon={<AddCircleOutlineIcon />} onClick={adicionarItem} sx={{ mt: 1 }}>Adicionar Item</Button>

            <Divider sx={{ my: 3 }} />

            <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>Formas de Pagamento</Typography>
                    {pagamentos.map((pgto, index) => (
                        <Grid container spacing={1} key={index} sx={{ mb: 1, alignItems: 'center' }}>
                            <Grid item xs={6}><FormControl fullWidth required><InputLabel>Forma</InputLabel><Select name="forma_pagamento_id" value={pgto.forma_pagamento_id} label="Forma" onChange={(e) => handlePagamentoChange(index, e)}>{formasPagamentoDisponiveis.map(fp => <MenuItem key={fp.id} value={fp.id}>{fp.descricao}</MenuItem>)}</Select></FormControl></Grid>
                            <Grid item xs={5}><TextField name="valor" label="Valor (R$)" type="number" value={pgto.valor} onChange={(e) => handlePagamentoChange(index, e)} fullWidth required /></Grid>
                            <Grid item xs={1}><IconButton onClick={() => removerPagamento(index)} color="error" disabled={pagamentos.length === 1}><RemoveCircleOutlineIcon /></IconButton></Grid>
                        </Grid>
                    ))}
                    <Button startIcon={<AddCircleOutlineIcon />} onClick={adicionarPagamento} sx={{ mt: 1 }}>Adicionar Pagamento</Button>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle1">Resumo Financeiro</Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}><Typography>Valor Bruto:</Typography><Typography>{formatCurrency(valorBruto)}</Typography></Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}><Typography>Desconto:</Typography><TextField name="valor_desconto" type="number" value={vendaHeader.valor_desconto} onChange={handleHeaderChange} size="small" sx={{ width: '120px' }} InputProps={{startAdornment: 'R$'}} /></Box>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}><Typography variant="h6">Valor Final:</Typography><Typography variant="h6">{formatCurrency(valorFinal)}</Typography></Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}><Typography>Total Pago:</Typography><Typography>{formatCurrency(valorPago)}</Typography></Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, color: Math.abs(valorRestante) > 0.01 ? 'error.main' : 'success.main' }}><Typography fontWeight="bold">Restante:</Typography><Typography fontWeight="bold">{formatCurrency(valorRestante)}</Typography></Box>
                    </Paper>
                </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button onClick={onCancel} variant="text">Cancelar</Button>
                <Button type="submit" variant="contained" size="large">Finalizar e Salvar Venda</Button>
            </Box>
        </Box>
    );
}

export default VendaForm;