import { useState, useEffect } from 'react';
import { 
    Box, Typography, Button, CircularProgress, Paper, Grid, TextField, Autocomplete, 
    List, ListItem, ListItemText, Checkbox, ListItemIcon, 
    Select, MenuItem, FormControl, InputLabel, Divider, IconButton
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

// Componente do formulário, com toda a lógica
function PrestacaoContasForm() {
    const navigate = useNavigate();
    
    // States para os dropdowns e filtros
    const [usuarios, setUsuarios] = useState([]);
    const [contas, setContas] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [dateRange, setDateRange] = useState({ inicio: '', fim: new Date().toISOString().split('T')[0] });

    // States para os dados
    const [vendasPendentes, setVendasPendentes] = useState([]);
    const [vendasSelecionadas, setVendasSelecionadas] = useState([]);
    const [destinacoes, setDestinacoes] = useState([{ tipo: 'DEPOSITO', valor: '', conta_destino_id: '', descricao: '' }]);
    const [loading, setLoading] = useState(true);

    // Busca os dados iniciais para os formulários
    useEffect(() => {
        Promise.all([
            api.get('/usuarios'),
            api.get('/contas-financeiras?ativo=true'),
            api.get('/categorias-despesa')
        ]).then(([usuariosRes, contasRes, categoriasRes]) => {
            setUsuarios([{ id: 'todos', nome: 'Todos os Funcionários' }, ...usuariosRes.data]);
            setContas(contasRes.data);
            setCategorias(categoriasRes.data);
        }).catch(err => console.error("Erro ao buscar dados iniciais:", err));
    }, []);
    
    // Busca as vendas pendentes sempre que os filtros mudam
    useEffect(() => {
        setLoading(true);
        let url = `/vendas?status_pagamento=Pendente`;
        
        if (selectedUser && selectedUser.id !== 'todos') url += `&vendedor_id=${selectedUser.id}`;
        if (dateRange.inicio) url += `&data_inicio=${dateRange.inicio}`;
        if (dateRange.fim) url += `&data_fim=${dateRange.fim}`;

        api.get(url)
            .then(res => {
                // Verificação de segurança para garantir que a resposta é um array
                if (Array.isArray(res.data)) {
                    setVendasPendentes(res.data);
                    setVendasSelecionadas(res.data.map(v => v.id));
                } else {
                    console.error("A resposta da API de vendas não é um array:", res.data);
                    setVendasPendentes([]);
                    setVendasSelecionadas([]);
                }
            })
            .catch(err => {
                console.error("Erro ao buscar vendas pendentes:", err);
                setVendasPendentes([]);
                setVendasSelecionadas([]);
            })
            .finally(() => setLoading(false));
    }, [selectedUser, dateRange]);

    // --- Handlers ---
    const handleFiltroDataChange = (e) => setDateRange({ ...dateRange, [e.target.name]: e.target.value });
    const handleSelecaoVenda = (vendaId) => {
        const newChecked = vendasSelecionadas.includes(vendaId) 
            ? vendasSelecionadas.filter(id => id !== vendaId)
            : [...vendasSelecionadas, vendaId];
        setVendasSelecionadas(newChecked);
    };
    const handleDestinacaoChange = (index, e) => {
        const novasDestinacoes = [...destinacoes];
        novasDestinacoes[index][e.target.name] = e.target.value;
        setDestinacoes(novasDestinacoes);
    };
    const adicionarDestinacao = () => setDestinacoes([...destinacoes, { tipo: 'DEPOSITO', valor: '', conta_destino_id: '', descricao: '' }]);
    const removerDestinacao = (index) => setDestinacoes(destinacoes.filter((_, i) => i !== index));

    // --- Cálculos ---
    const totalAPrestar = vendasPendentes.filter(v => vendasSelecionadas.includes(v.id)).reduce((acc, v) => acc + parseFloat(v.valor_final), 0);
    const totalDestinado = destinacoes.reduce((acc, d) => acc + parseFloat(d.valor || 0), 0);
    const saldo = totalAPrestar - totalDestinado;
    const formatCurrency = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // --- Submissão Final ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (Math.abs(saldo) > 0.01) {
            alert('O valor total destinado não corresponde ao total das vendas selecionadas. O saldo deve ser zero.');
            return;
        }
        if (vendasSelecionadas.length === 0) {
            alert('Nenhuma venda selecionada para a prestação de contas.');
            return;
        }
        try {
            const payload = {
                usuario_id: selectedUser?.id === 'todos' ? null : selectedUser?.id,
                vendas_ids: vendasSelecionadas,
                destinacoes: destinacoes
            };
            await api.post('/financeiro/prestacao-contas', payload);
            alert('Prestação de contas realizada com sucesso!');
            navigate('/financeiro/fluxo-caixa');
        } catch (error) {
            alert(`Falha ao salvar: ${error.response?.data?.error || 'Erro desconhecido'}`);
        }
    };

    return (
        <Paper component="form" onSubmit={handleSubmit} elevation={3} sx={{ p: 3, mt: 4 }}>
            <Typography variant="h6" gutterBottom>Filtros da Prestação de Contas</Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} md={4}><Autocomplete options={usuarios} getOptionLabel={(option) => option.nome} onChange={(event, user) => setSelectedUser(user)} renderInput={(params) => <TextField {...params} label="Filtrar por Funcionário" />} /></Grid>
                <Grid item xs={12} sm={6} md={4}><TextField name="inicio" label="Data de Início" type="date" value={dateRange.inicio} onChange={handleFiltroDataChange} InputLabelProps={{ shrink: true }} fullWidth /></Grid>
                <Grid item xs={12} sm={6} md={4}><TextField name="fim" label="Data de Fim" type="date" value={dateRange.fim} onChange={handleFiltroDataChange} InputLabelProps={{ shrink: true }} fullWidth /></Grid>
            </Grid>
            
            <Box sx={{mt: 4}}>
                <Typography variant="h6">Vendas a Conciliar ({vendasSelecionadas.length} de {vendasPendentes.length} selecionadas)</Typography>
                <Paper variant="outlined" sx={{ mt: 1, maxHeight: 250, overflow: 'auto' }}>
                    <List dense>{vendasPendentes.map(venda => (<ListItem key={venda.id} dense button onClick={() => handleSelecaoVenda(venda.id)}><ListItemIcon><Checkbox edge="start" checked={vendasSelecionadas.includes(venda.id)} tabIndex={-1} disableRipple /></ListItemIcon><ListItemText primary={`Venda #${venda.nr_venda} - Cliente: ${venda.nome_cliente}`} secondary={`Data: ${new Date(venda.data_venda).toLocaleDateString('pt-BR')}`}/><Typography variant="body2" sx={{fontWeight: 'bold'}}>{formatCurrency(parseFloat(venda.valor_final))}</Typography></ListItem>))}</List>
                </Paper>
            </Box>
            
            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>Destinação do Dinheiro</Typography>
            {destinacoes.map((dest, index) => (
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }} key={index}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={4}><FormControl fullWidth required><InputLabel>Tipo de Destinação</InputLabel><Select name="tipo" value={dest.tipo} label="Tipo de Destinação" onChange={(e) => handleDestinacaoChange(index, e)}><MenuItem value="DEPOSITO">Depósito em Conta</MenuItem><MenuItem value="PAGAMENTO_DESPESA">Pagamento de Despesa</MenuItem></Select></FormControl></Grid>
                        {dest.tipo === 'DEPOSITO' && (<Grid item xs={12} sm={8}><FormControl fullWidth required><InputLabel>Conta de Destino</InputLabel><Select name="conta_destino_id" value={dest.conta_destino_id} label="Conta de Destino" onChange={(e) => handleDestinacaoChange(index, e)}>{contas.map(c => <MenuItem key={c.id} value={c.id}>{c.nome}</MenuItem>)}</Select></FormControl></Grid>)}
                        {dest.tipo === 'PAGAMENTO_DESPESA' && (<><Grid item xs={12} sm={4}><FormControl fullWidth required><InputLabel>Conta de Origem</InputLabel><Select name="conta_pagamento_id" value={dest.conta_pagamento_id} label="Conta de Origem" onChange={(e) => handleDestinacaoChange(index, e)}>{contas.map(c => <MenuItem key={c.id} value={c.id}>{c.nome}</MenuItem>)}</Select></FormControl></Grid><Grid item xs={12} sm={4}><FormControl fullWidth required><InputLabel>Categoria</InputLabel><Select name="categoria_id" value={dest.categoria_id} label="Categoria" onChange={(e) => handleDestinacaoChange(index, e)}>{categorias.map(c => <MenuItem key={c.id} value={c.id}>{c.nome}</MenuItem>)}</Select></FormControl></Grid></>)}
                        <Grid item xs={12} sm={8}><TextField name="descricao" label="Descrição" value={dest.descricao} onChange={(e) => handleDestinacaoChange(index, e)} fullWidth required /></Grid>
                        <Grid item xs={10} sm={3}><TextField name="valor" label="Valor (R$)" type="number" value={dest.valor} onChange={(e) => handleDestinacaoChange(index, e)} fullWidth required /></Grid>
                        <Grid item xs={2} sm={1}><IconButton onClick={() => removerDestinacao(index)} color="error" disabled={destinacoes.length === 1}><RemoveCircleOutlineIcon /></IconButton></Grid>
                    </Grid>
                </Paper>
            ))}
            <Button startIcon={<AddCircleOutlineIcon />} onClick={adicionarDestinacao}>Adicionar Destinação</Button>
            
            <Paper variant="outlined" sx={{ p: 2, mt: 3}}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography>Total a Prestar Contas:</Typography><Typography>{formatCurrency(totalAPrestar)}</Typography></Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography>Total Destinado:</Typography><Typography>{formatCurrency(totalDestinado)}</Typography></Box>
                <Divider sx={{ my: 1 }}/>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', color: Math.abs(saldo) > 0.01 ? 'error.main' : 'success.main' }}><Typography variant="h6">SALDO:</Typography><Typography variant="h6">{formatCurrency(saldo)}</Typography></Box>
            </Paper>

            <Box sx={{ mt: 3, textAlign: 'right' }}><Button type="submit" variant="contained" size="large" disabled={Math.abs(saldo) > 0.01 || vendasSelecionadas.length === 0}>Finalizar Prestação de Contas</Button></Box>
        </Paper>
    );
}

// Componente da página principal
function PrestacaoContasPage() {
    return (
        <Box>
            <Typography variant="h5">Prestação de Contas</Typography>
            <Typography variant="body1" color="text.secondary">Filtre e selecione as vendas pendentes. Em seguida, informe o destino do dinheiro para reconciliar os valores.</Typography>
            <PrestacaoContasForm />
        </Box>
    );
}

export default PrestacaoContasPage;