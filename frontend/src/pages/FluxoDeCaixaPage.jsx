// src/pages/FluxoDeCaixaPage.jsx (VERSÃO COM IMPORT CORRIGIDO)

import { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, Paper, List, ListItem, ListItemText, Modal, Divider } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import api from '../services/api';
import DespesaForm from '../components/DespesaForm';
import ReceitaForm from '../components/ReceitaForm';
import TransferenciaContasForm from '../components/TransferenciaContasForm.jsx'; // NOME CORRIGIDO AQUI

const style = {
    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    width: 450, bgcolor: 'background.paper', border: '2px solid #000', boxShadow: 24, p: 4,
};

function FluxoDeCaixaPage() {
    const [movimentacoes, setMovimentacoes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalAberto, setModalAberto] = useState(null);

    const fetchMovimentacoes = () => {
        setLoading(true);
        api.get('/movimentacoes')
            .then(res => setMovimentacoes(res.data))
            .catch(err => console.error("Erro ao buscar movimentações:", err))
            .finally(() => setLoading(false));
    };

    useEffect(fetchMovimentacoes, []);

    const handleCloseModal = () => setModalAberto(null);
    
    const handleSave = () => {
        fetchMovimentacoes();
        handleCloseModal();
    };
    
    const formatCurrency = (value) => parseFloat(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    if (loading) return <CircularProgress />;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">Fluxo de Caixa / Extrato</Typography>
                <Box>
                    <Button variant="contained" color="error" sx={{mr: 1}} onClick={() => setModalAberto('despesa')}>- Nova Despesa</Button>
                    <Button variant="contained" color="success" sx={{mr: 1}} onClick={() => setModalAberto('receita')}>+ Nova Receita</Button>
                    <Button variant="outlined" onClick={() => setModalAberto('transferencia')}>Transferência</Button>
                </Box>
            </Box>

            <Paper>
                <List>
                    {movimentacoes.map(mov => (
                        <ListItem key={mov.id} divider>
                            <ListItemText 
                                primary={mov.descricao}
                                secondary={`Conta: ${mov.nome_conta_origem} ${mov.tipo === 'TRANSFERENCIA' ? `-> ${mov.nome_conta_destino}` : ''} | Categoria: ${mov.nome_categoria || 'N/A'} | Data: ${new Date(mov.data_movimentacao).toLocaleDateString('pt-BR')}`}
                            />
                            <Typography variant="body1" color={mov.tipo === 'RECEITA' ? 'success.main' : 'error.main'} sx={{fontWeight: 'bold'}}>
                                {mov.tipo === 'DESPESA' ? '-' : '+'} {formatCurrency(mov.valor)}
                            </Typography>
                        </ListItem>
                    ))}
                </List>
            </Paper>

            <Modal open={modalAberto === 'despesa'} onClose={handleCloseModal}>
                <Box sx={style}><DespesaForm onSave={handleSave} onCancel={handleCloseModal} /></Box>
            </Modal>
            <Modal open={modalAberto === 'receita'} onClose={handleCloseModal}>
                <Box sx={style}><ReceitaForm onSave={handleSave} onCancel={handleCloseModal} /></Box>
            </Modal>
            <Modal open={modalAberto === 'transferencia'} onClose={handleCloseModal}>
                 {/* NOME CORRIGIDO AQUI */}
                <Box sx={style}><TransferenciaContasForm onSave={handleSave} onCancel={handleCloseModal} /></Box>
            </Modal>
        </Box>
    );
}

export default FluxoDeCaixaPage;