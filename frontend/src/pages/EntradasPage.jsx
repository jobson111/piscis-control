// src/pages/EntradasPage.jsx (VERSÃO FINAL)

import { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, Paper, List, ListItem, ListItemText, Modal } from '@mui/material';
import api from '../services/api';
import EntradaForm from '../components/EntradaForm'; // Importa o nosso novo formulário

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '80%',
    maxWidth: '900px',
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
    maxHeight: '90vh',
    overflowY: 'auto'
};

function EntradasPage() {
    const [entradas, setEntradas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);

    const fetchEntradas = async () => {
        setLoading(true);
        try {
            const response = await api.get('/entradas');
            setEntradas(response.data);
        } catch (error) {
            console.error("Erro ao buscar entradas:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEntradas();
    }, []);

    const handleOpenModal = () => setOpenModal(true);
    const handleCloseModal = () => setOpenModal(false);

    const handleEntradaCriada = () => {
        handleCloseModal(); // Fecha o formulário
        fetchEntradas();   // Recarrega a lista de entradas
    };

    if (loading) return <CircularProgress />;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">Histórico de Entradas de Peixes</Typography>
                <Button variant="contained" onClick={handleOpenModal}>
                    Registar Nova Entrada
                </Button>
            </Box>

            <Paper elevation={2}>
                <List>
                    {entradas.length > 0 ? (
                        entradas.map(entrada => (
                            <ListItem key={entrada.id} divider>
                                <ListItemText 
                                    primary={`Nota Fiscal: ${entrada.nr_nota_fiscal || 'N/A'} - Fornecedor: ${entrada.fornecedor || 'N/A'}`}
                                    secondary={`Data: ${new Date(entrada.data_entrada).toLocaleDateString('pt-BR')} | Valor: R$ ${parseFloat(entrada.valor_total_nota || 0).toFixed(2)}`}
                                />
                            </ListItem>
                        ))
                    ) : (
                        <Typography sx={{ p: 2 }}>Nenhuma entrada registada.</Typography>
                    )}
                </List>
            </Paper>

            <Modal open={openModal} onClose={handleCloseModal}>
                <Box sx={style}>
                    <EntradaForm onEntradaCriada={handleEntradaCriada} />
                </Box>
            </Modal>
        </Box>
    );
}

export default EntradasPage;