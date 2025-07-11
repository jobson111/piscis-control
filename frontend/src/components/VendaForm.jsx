// src/components/VendaForm.jsx (VERSÃO FINAL E COMPLETA)

import { useState, useEffect } from 'react';
import {
    Box, Grid, TextField, Button, Typography, IconButton, Paper, Divider,
    Autocomplete, FormControl, InputLabel, Select, MenuItem, CircularProgress
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

    // States para os dados da venda
    const [vendaHeader, setVendaHeader] = useState({
        cliente_id: null,
        nr_nota_fiscal: '',
        data_venda: new Date().toISOString().split('T')[0],
        observacoes: '',
        valor_desconto: 0,
    });
    const [itens, setItens] = useState([{ lote_id: '', quantidade_kg: '', preco_por_kg: '', peso_medio_na_venda_g: '' }]);
    const [pagamentos, setPagamentos] = useState([{ forma_pagamento_id: '', valor: '' }]);

    // Busca os dados necessários para os formulários
    useEffect(() => {
        setLoading(true);
        Promise.all([
            api.get('/clientes'),
            api.get('/lotes?status=Ativo'),
            api.get('/formas-pagamento')
        ]).then(([clientesRes, lotesRes, formasPagamentoRes]) => {
            setClientes(clientesRes.data);
            setLotesAtivos(lotesRes.data);
            setFormasPagamentoDisponiveis(formasPagamentoRes.data);
        }).catch(err => console.error("Erro ao buscar dados para o formulário de venda:", err))
        .finally(() => setLoading(false));
    }, []);

    // --- Cálculos automáticos ---
    const valorBruto = itens.reduce((acc, item) => acc + (parseFloat(item.quantidade_kg || 0) * parseFloat(item.preco_por_kg || 0)), 0);
    const valorFinal = valorBruto - parseFloat(vendaHeader.valor_desconto || 0);
    const valorPago = pagamentos.reduce((acc, pgto) => acc + parseFloat(pgto.valor || 0), 0);
    const valorRestante = valorFinal - valorPago;

    // --- Handlers para os sub-formulários dinâmicos ---
    const handleHeaderChange = (e) => setVendaHeader({ ...vendaHeader, [e.target.name]: e.target.value });
    const handleItemChange = (index, e) => {
        const novosItens = [...itens];
        novosItens[index][e.target.name] = e.target.value;
        setItens(novosItens);
    };
    const adicionarItem = () => setItens([...itens, { lote_id: '', quantidade_kg: '', preco_por_kg: '', peso_medio_na_venda_g: '' }]);
    const removerItem = (index) => setItens(itens.filter((_, i) => i !== index));

    const handlePagamentoChange = (index, e) => {
        const novosPagamentos = [...pagamentos];
        novosPagamentos[index][e.target.name] = e.target.value;
        setPagamentos(novosPagamentos);
    };
    const adicionarPagamento = () => setPagamentos([...pagamentos, { forma_pagamento_id: '', valor: '' }]);
    const removerPagamento = (index) => setPagamentos(pagamentos.filter((_, i) => i !== index));

    // --- Submissão do Formulário ---
    const handleSubmit = (e) => {
        e.preventDefault();
        if (Math.abs(valorRestante) > 0.01) { // Usar uma pequena tolerância para erros de ponto flutuante
            alert('O valor total dos pagamentos não corresponde ao valor final da venda.');
            return;
        }
        const payload = {
            ...vendaHeader,
            valor_bruto: valorBruto,
            valor_final: valorFinal,
            itens,
            pagamentos
        };
        onSave(payload);
    };

    if (loading) return <CircularProgress />;

    const formatCurrency = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <Box component="form" onSubmit={handleSubmit}>
            <Typography variant="h6" gutterBottom>Registar Nova Venda</Typography>
            
            {/* Dados Gerais da Venda */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <Autocomplete options={clientes} getOptionLabel={(c) => c.nome}
                            onChange={(e, cliente) => setVendaHeader({...vendaHeader, cliente_id: cliente?.id })}
                            renderInput={(params) => <TextField {...params} label="Cliente" required />}
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField name="data_venda" label="Data da Venda" type="date" value={vendaHeader.data_venda} onChange={handleHeaderChange} InputLabelProps={{ shrink: true }} fullWidth required />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField name="nr_nota_fiscal" label="Nº Nota Fiscal" value={vendaHeader.nr_nota_fiscal} onChange={handleHeaderChange} fullWidth />
                    </Grid>
                </Grid>
            </Paper>

            {/* Itens do Carrinho */}
            <Typography variant="subtitle1" gutterBottom>Itens da Venda ("Carrinho")</Typography>
            {itens.map((item, index) => (
                <Paper variant="outlined" sx={{ p: 2, mb: 1 }} key={index}>
                    <Grid container spacing={1} alignItems="center">
                        <Grid item xs={12} sm={4}>
                            <FormControl fullWidth size="small"><InputLabel>Lote de Origem</InputLabel>
                                <Select name="lote_id" value={item.lote_id} label="Lote de Origem" onChange={(e) => handleItemChange(index, e)} required>
                                    {lotesAtivos.map(lote => <MenuItem key={lote.id} value={lote.id}>{`Lote ${lote.id} (${lote.especie}) - Tanque: ${lote.nome_tanque}`}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6} sm={2}><TextField name="quantidade_kg" label="Qtd (kg)" type="number" value={item.quantidade_kg} onChange={(e) => handleItemChange(index, e)} fullWidth size="small" required /></Grid>
                        <Grid item xs={6} sm={2}><TextField name="preco_por_kg" label="Preço/kg" type="number" value={item.preco_por_kg} onChange={(e) => handleItemChange(index, e)} fullWidth size="small" required /></Grid>
                        <Grid item xs={12} sm={3}><TextField name="peso_medio_na_venda_g" label="Peso Médio (g)" type="number" value={item.peso_medio_na_venda_g} onChange={(e) => handleItemChange(index, e)} fullWidth size="small" required /></Grid>
                        <Grid item xs={12} sm={1}><IconButton onClick={() => removerItem(index)} color="error" disabled={itens.length === 1}><RemoveCircleOutlineIcon /></IconButton></Grid>
                    </Grid>
                </Paper>
            ))}
            <Button startIcon={<AddCircleOutlineIcon />} onClick={adicionarItem} sx={{ mt: 1 }}>Adicionar Item</Button>

            <Divider sx={{ my: 3 }} />

            {/* Pagamentos e Totais */}
            <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>Formas de Pagamento</Typography>
                    {pagamentos.map((pgto, index) => (
                        <Grid container spacing={1} key={index} sx={{ mb: 1, alignItems: 'center' }}>
                            <Grid item xs={6}>
                                <FormControl fullWidth size="small"><InputLabel>Forma</InputLabel>
                                    <Select name="forma_pagamento_id" value={pgto.forma_pagamento_id} label="Forma" onChange={(e) => handlePagamentoChange(index, e)} required>
                                        {formasPagamentoDisponiveis.map(fp => <MenuItem key={fp.id} value={fp.id}>{fp.descricao}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={5}><TextField name="valor" label="Valor (R$)" type="number" value={pgto.valor} onChange={(e) => handlePagamentoChange(index, e)} fullWidth size="small" required /></Grid>
                            <Grid item xs={1}><IconButton onClick={() => removerPagamento(index)} color="error" disabled={pagamentos.length === 1}><RemoveCircleOutlineIcon /></IconButton></Grid>
                        </Grid>
                    ))}
                    <Button startIcon={<AddCircleOutlineIcon />} onClick={adicionarPagamento} sx={{ mt: 1 }}>Adicionar Pagamento</Button>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle1">Resumo Financeiro</Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}><Typography>Valor Bruto:</Typography><Typography>{formatCurrency(valorBruto)}</Typography></Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                            <Typography>Desconto:</Typography>
                            <TextField name="valor_desconto" type="number" value={vendaHeader.valor_desconto} onChange={handleHeaderChange} size="small" sx={{ width: '120px' }} InputProps={{startAdornment: 'R$'}} />
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}><Typography variant="h6">Valor Final:</Typography><Typography variant="h6">{formatCurrency(valorFinal)}</Typography></Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}><Typography>Total Pago:</Typography><Typography>{formatCurrency(valorPago)}</Typography></Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, color: valorRestante !== 0 ? 'error.main' : 'success.main' }}>
                            <Typography fontWeight="bold">Restante:</Typography><Typography fontWeight="bold">{formatCurrency(valorRestante)}</Typography>
                        </Box>
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