// src/pages/CategoriasDespesaPage.jsx

import { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, Paper, List, ListItem, ListItemText, IconButton, Modal, TextField } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import api from '../services/api';

const style = {
    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    width: 400, bgcolor: 'background.paper', border: '2px solid #000', boxShadow: 24, p: 4,
};

const CategoriaForm = ({ onSave, onCancel, categoriaToEdit }) => {
    const [nome, setNome] = useState('');
    useEffect(() => { setNome(categoriaToEdit ? categoriaToEdit.nome : '') }, [categoriaToEdit]);
    const handleSubmit = (e) => { e.preventDefault(); onSave({ ...categoriaToEdit, nome }); };
    return (
        <Box component="form" onSubmit={handleSubmit}>
            <Typography variant="h6">{categoriaToEdit ? 'Editar Categoria' : 'Nova Categoria de Despesa'}</Typography>
            <TextField label="Nome da Categoria (ex: Ração, Energia)" value={nome} onChange={(e) => setNome(e.target.value)} fullWidth required margin="normal" autoFocus />
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button onClick={onCancel}>Cancelar</Button>
                <Button type="submit" variant="contained">Salvar</Button>
            </Box>
        </Box>
    );
};

function CategoriasDespesaPage() {
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const [categoriaParaEditar, setCategoriaParaEditar] = useState(null);

    const fetchCategorias = () => {
        setLoading(true);
        api.get('/categorias-despesa')
            .then(res => setCategorias(res.data))
            .catch(err => console.error("Erro ao buscar categorias:", err))
            .finally(() => setLoading(false));
    };

    useEffect(fetchCategorias, []);

    const handleOpenModal = (categoria = null) => {
        setCategoriaParaEditar(categoria);
        setOpenModal(true);
    };
    const handleCloseModal = () => setOpenModal(false);

    const handleSave = async (data) => {
        try {
            if (data.id) { await api.put(`/categorias-despesa/${data.id}`, data); } 
            else { await api.post('/categorias-despesa', data); }
            fetchCategorias();
            handleCloseModal();
        } catch (error) { alert('Erro ao salvar categoria.'); }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja apagar esta categoria?')) {
            try {
                await api.delete(`/categorias-despesa/${id}`);
                fetchCategorias();
            } catch (error) { alert('Falha ao apagar categoria.'); }
        }
    };

    if (loading) return <CircularProgress />;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">Categorias de Despesa</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>Adicionar Categoria</Button>
            </Box>
            <Paper>
                <List>
                    {categorias.map(cat => (
                        <ListItem key={cat.id} secondaryAction={
                            <>
                                <IconButton edge="end" onClick={() => handleOpenModal(cat)}><EditIcon /></IconButton>
                                <IconButton edge="end" onClick={() => handleDelete(cat.id)} sx={{ml:1}}><DeleteIcon /></IconButton>
                            </>
                        }>
                            <ListItemText primary={cat.nome} />
                        </ListItem>
                    ))}
                </List>
            </Paper>
            <Modal open={openModal} onClose={handleCloseModal}>
                <Box sx={style}><CategoriaForm onSave={handleSave} onCancel={handleCloseModal} categoriaToEdit={categoriaParaEditar} /></Box>
            </Modal>
        </Box>
    );
}

export default CategoriasDespesaPage;