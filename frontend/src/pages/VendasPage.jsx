// src/pages/VendasPage.jsx (VERSÃO FINAL COM FORMULÁRIO)

import { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, Modal } from '@mui/material';
import api from '../services/api';
import VendaList from '../components/VendaList';
import VendaForm from '../components/VendaForm'; // Importa o formulário
import ProtectedComponent from '../components/ProtectedComponent';

const style = {
    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    width: '90%', maxWidth: '900px', bgcolor: 'background.paper', border: '2px solid #000',
    boxShadow: 24, p: 4, maxHeight: '90vh', overflowY: 'auto'
};

function VendasPage() {
    const [vendas, setVendas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);

    const fetchVendas = () => {
        setLoading(true);
        api.get('/vendas')
            .then(response => setVendas(response.data))
            .catch(error => console.error("Erro ao buscar vendas:", error))
            .finally(() => setLoading(false));
    };

    useEffect(fetchVendas, []);

    const handleOpenModal = () => setOpenModal(true);
    const handleCloseModal = () => setOpenModal(false);

    const handleSave = async (vendaData) => {
        try {
            await api.post('/vendas', vendaData);
            fetchVendas(); // Recarrega a lista de vendas
            handleCloseModal();
        } catch (error) {
            console.error('Erro ao salvar venda:', error);
            alert(`Falha ao salvar venda: ${error.response?.data?.error || 'Erro desconhecido'}`);
        }
    };

    if (loading) return <CircularProgress />;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">Histórico de Vendas</Typography>
                    <ProtectedComponent requiredPermission="vendas:criar">
                        <Button variant="contained" onClick={handleOpenModal}>
                            Registar Nova Venda
                        </Button>
                    </ProtectedComponent>
            </Box>

            <VendaList vendas={vendas} />
            
            <Modal open={openModal} onClose={handleCloseModal}>
                <Box sx={style}>
                    <VendaForm onSave={handleSave} onCancel={handleCloseModal} />
                </Box>
            </Modal>
        </Box>
    );
}

export default VendasPage;