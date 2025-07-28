// src/pages/ClientesPage.jsx (VERSÃO FINAL E COMPLETA)

import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, CircularProgress, Modal } from '@mui/material';
import api from '../services/api';
import ClienteList from '../components/ClienteList';
import ClienteForm from '../components/ClienteForm';
import ProtectedComponent from '../components/ProtectedComponent';

const style = {
    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    width: '80%', maxWidth: '700px', bgcolor: 'background.paper', border: '2px solid #000',
    boxShadow: 24, p: 4, maxHeight: '90vh', overflowY: 'auto'
};

function ClientesPage() {
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const [clienteParaEditar, setClienteParaEditar] = useState(null);

    const fetchClientes = useCallback(async () => {
        try {
            const response = await api.get('/clientes');
            setClientes(response.data);
        } catch (error) {
            console.error("Erro ao buscar clientes:", error);
            alert("Não foi possível carregar a lista de clientes.");
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        fetchClientes().finally(() => setLoading(false));
    }, [fetchClientes]);

    const handleOpenModal = (cliente = null) => {
        setClienteParaEditar(cliente);
        setOpenModal(true);
    };
    const handleCloseModal = () => {
        setClienteParaEditar(null);
        setOpenModal(false);
    };

    const handleSave = async (clienteData) => {
        try {
            if (clienteData.id) {
                await api.put(`/clientes/${clienteData.id}`, clienteData);
            } else {
                await api.post('/clientes', clienteData);
            }
            await fetchClientes();
            handleCloseModal();
        } catch (error) {
            console.error('Erro ao salvar cliente:', error);
            alert('Falha ao salvar cliente.');
        }
    };
    
    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja apagar este cliente?')) {
            try {
                await api.delete(`/clientes/${id}`);
                await fetchClientes();
            } catch (error) {
                console.error('Erro ao apagar cliente:', error);
                alert('Falha ao apagar cliente.');
            }
        }
    };

    if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">Gestão de Clientes</Typography>
                <ProtectedComponent requiredPermission="clientes:criar">
                    <Button variant="contained" onClick={() => handleOpenModal()}>Adicionar Cliente</Button>
                </ProtectedComponent>
            </Box>
            
            <ClienteList clientes={clientes} onEdit={handleOpenModal} onDelete={handleDelete} />

            <Modal open={openModal} onClose={handleCloseModal}>
                <Box sx={style}>
                    <ClienteForm 
                        onSave={handleSave}
                        onCancel={handleCloseModal}
                        clienteToEdit={clienteParaEditar}
                    />
                </Box>
            </Modal>
        </Box>
    );
}

export default ClientesPage;