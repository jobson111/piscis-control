// src/pages/ContasFinanceirasPage.jsx

import { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, Paper, List, ListItem, ListItemText, IconButton, Modal, TextField, Switch } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import api from '../services/api';

const style = {
    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    width: 400, bgcolor: 'background.paper', border: '2px solid #000', boxShadow: 24, p: 4
};

// Formulário para criar ou editar uma conta
const ContaForm = ({ onSave, onCancel, contaToEdit }) => {
    const [nome, setNome] = useState('');
    const [saldoInicial, setSaldoInicial] = useState(0);

    useEffect(() => {
        if (contaToEdit) {
            setNome(contaToEdit.nome);
            setSaldoInicial(contaToEdit.saldo_inicial);
        } else {
            setNome('');
            setSaldoInicial(0);
        }
    }, [contaToEdit]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...contaToEdit, nome, saldo_inicial: saldoInicial });
    };

    return (
        <Box component="form" onSubmit={handleSubmit}>
            <Typography variant="h6">{contaToEdit ? 'Editar Conta' : 'Nova Conta Financeira'}</Typography>
            <TextField label="Nome da Conta (ex: Caixa, Banco Bradesco)" value={nome} onChange={(e) => setNome(e.target.value)} fullWidth required margin="normal" />
            <TextField label="Saldo Inicial (R$)" type="number" value={saldoInicial} onChange={(e) => setSaldoInicial(e.target.value)} fullWidth margin="normal" disabled={!!contaToEdit} helperText="O saldo inicial só pode ser definido na criação da conta." />
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button onClick={onCancel}>Cancelar</Button>
                <Button type="submit" variant="contained">Salvar</Button>
            </Box>
        </Box>
    );
};


function ContasFinanceirasPage() {
    const [contas, setContas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const [contaParaEditar, setContaParaEditar] = useState(null);

    const fetchContas = () => {
        setLoading(true);
        api.get('/contas-financeiras')
            .then(res => setContas(res.data))
            .catch(err => console.error("Erro ao buscar contas:", err))
            .finally(() => setLoading(false));
    };

    useEffect(fetchContas, []);

    const handleOpenModal = (conta = null) => {
        setContaParaEditar(conta);
        setOpenModal(true);
    };
    const handleCloseModal = () => {
        setContaParaEditar(null);
        setOpenModal(false);
    };

    const handleSave = async (data) => {
        try {
            if (data.id) { // Edição
                await api.put(`/contas-financeiras/${data.id}`, data);
            } else { // Criação
                await api.post('/contas-financeiras', data);
            }
            fetchContas();
            handleCloseModal();
        } catch (error) {
            alert('Erro ao salvar conta.');
        }
    };

    const handleToggleAtivo = async (conta) => {
        try {
            await api.put(`/contas-financeiras/${conta.id}`, { ...conta, ativo: !conta.ativo });
            fetchContas();
        } catch (error) {
            alert('Erro ao alterar status da conta.');
        }
    };

    if (loading) return <CircularProgress />;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">Contas Financeiras</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
                    Adicionar Conta
                </Button>
            </Box>
            <Paper>
                <List>
                    {contas.map(conta => (
                        <ListItem key={conta.id} secondaryAction={
                            <>
                                <Switch edge="end" checked={conta.ativo} onChange={() => handleToggleAtivo(conta)} title={conta.ativo ? "Desativar" : "Ativar"}/>
                                <IconButton edge="end" aria-label="edit" onClick={() => handleOpenModal(conta)} sx={{ml: 1}}>
                                    <EditIcon />
                                </IconButton>
                            </>
                        }>
                            <ListItemText primary={conta.nome} secondary={`Saldo Inicial: ${parseFloat(conta.saldo_inicial).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`} />
                        </ListItem>
                    ))}
                </List>
            </Paper>
            <Modal open={openModal} onClose={handleCloseModal}>
                <Box sx={style}>
                    <ContaForm onSave={handleSave} onCancel={handleCloseModal} contaToEdit={contaParaEditar} />
                </Box>
            </Modal>
        </Box>
    );
}

export default ContasFinanceirasPage;