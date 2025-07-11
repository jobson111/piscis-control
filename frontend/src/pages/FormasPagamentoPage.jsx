import { useState, useEffect } from 'react';
import { 
    Box, 
    Typography, 
    Button, 
    CircularProgress, 
    Paper, 
    List, 
    ListItem, 
    ListItemText, 
    Switch, 
    TextField, 
    Modal 
} from '@mui/material';
import api from '../services/api';

// Estilo para centralizar o Modal
const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

function FormasPagamentoPage() {
    const [formasPagamento, setFormasPagamento] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const [descricao, setDescricao] = useState('');

    const fetchFormasPagamento = () => {
        setLoading(true);
        api.get('/formas-pagamento')
            .then(res => setFormasPagamento(res.data))
            .catch(err => {
                console.error("Erro ao buscar formas de pagamento:", err);
                alert("Não foi possível carregar as formas de pagamento.");
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchFormasPagamento();
    }, []);

    const handleOpenModal = () => {
        setDescricao(''); // Limpa o campo ao abrir o modal
        setOpenModal(true);
    };

    const handleCloseModal = () => setOpenModal(false);

    const handleSave = async (event) => {
        event.preventDefault();
        if (!descricao.trim()) {
            alert('A descrição não pode estar em branco.');
            return;
        }
        try {
            await api.post('/formas-pagamento', { descricao });
            fetchFormasPagamento(); // Recarrega a lista
            handleCloseModal();
        } catch (error) {
            console.error('Erro ao salvar forma de pagamento:', error);
            alert('Erro ao salvar forma de pagamento.');
        }
    };

    const handleToggleAtivo = async (fp) => {
        try {
            // Envia todos os dados necessários para o update, apenas trocando o 'ativo'
            await api.put(`/formas-pagamento/${fp.id}`, { descricao: fp.descricao, ativo: !fp.ativo });
            // Atualiza a lista na tela de forma otimista para uma resposta mais rápida
            setFormasPagamento(formasPagamento.map(item => 
                item.id === fp.id ? { ...item, ativo: !item.ativo } : item
            ));
        } catch (error) {
            console.error('Erro ao alterar status:', error);
            alert('Erro ao alterar o status.');
            // Se der erro, podemos recarregar a lista para reverter a mudança otimista
            fetchFormasPagamento();
        }
    };

    if (loading) return <CircularProgress />;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">Gestão de Formas de Pagamento</Typography>
                <Button variant="contained" onClick={handleOpenModal}>Adicionar Nova</Button>
            </Box>

            <Paper elevation={2}>
                <List>
                    {formasPagamento.map(fp => (
                        <ListItem key={fp.id} divider>
                            <ListItemText primary={fp.descricao} />
                            <Switch
                                edge="end"
                                checked={fp.ativo}
                                onChange={() => handleToggleAtivo(fp)}
                                inputProps={{
                                    'aria-labelledby': `switch-list-label-${fp.id}`,
                                }}
                            />
                        </ListItem>
                    ))}
                </List>
            </Paper>

            <Modal open={openModal} onClose={handleCloseModal}>
                <Box sx={style}>
                    <Typography variant="h6" component="h2">Nova Forma de Pagamento</Typography>
                    <Box component="form" onSubmit={handleSave} sx={{ mt: 2 }}>
                        <TextField 
                            label="Descrição" 
                            value={descricao} 
                            onChange={(e) => setDescricao(e.target.value)} 
                            fullWidth 
                            margin="normal"
                            autoFocus
                        />
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                             <Button onClick={handleCloseModal}>Cancelar</Button>
                             <Button type="submit" variant="contained">Salvar</Button>
                        </Box>
                    </Box>
                </Box>
            </Modal>
        </Box>
    );
}

export default FormasPagamentoPage;