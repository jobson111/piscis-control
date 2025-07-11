// src/pages/UsuariosPage.jsx

import { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, Paper, List, ListItem, ListItemText, IconButton, Modal, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import api from '../services/api';

const style = {
    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    width: 400, bgcolor: 'background.paper', border: '2px solid #000', boxShadow: 24, p: 4,
};

// Formulário para criar um novo usuário
const UsuarioForm = ({ onSave, onCancel, cargos }) => {
    const [formData, setFormData] = useState({ nome: '', email: '', senha: '', cargo_id: '' });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Box component="form" onSubmit={handleSubmit}>
            <Typography variant="h6">Adicionar Novo Utilizador</Typography>
            <TextField label="Nome Completo" name="nome" value={formData.nome} onChange={handleChange} fullWidth required margin="normal" />
            <TextField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} fullWidth required margin="normal" />
            <TextField label="Senha Provisória" name="senha" type="password" value={formData.senha} onChange={handleChange} fullWidth required margin="normal" />
            <FormControl fullWidth margin="normal" required>
                <InputLabel>Cargo</InputLabel>
                <Select name="cargo_id" value={formData.cargo_id} label="Cargo" onChange={handleChange}>
                    {cargos.map(cargo => <MenuItem key={cargo.id} value={cargo.id}>{cargo.nome}</MenuItem>)}
                </Select>
            </FormControl>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button onClick={onCancel}>Cancelar</Button>
                <Button type="submit" variant="contained">Salvar Utilizador</Button>
            </Box>
        </Box>
    );
};

// Página principal
function UsuariosPage() {
    const [usuarios, setUsuarios] = useState([]);
    const [cargos, setCargos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);

    const fetchData = () => {
        setLoading(true);
        Promise.all([
            api.get('/usuarios'),
            api.get('/cargos') // Busca os cargos para o dropdown do formulário
        ]).then(([usuariosRes, cargosRes]) => {
            setUsuarios(usuariosRes.data);
            setCargos(cargosRes.data);
        }).catch(err => console.error("Erro ao buscar dados:", err))
        .finally(() => setLoading(false));
    };

    useEffect(fetchData, []);

    const handleOpenModal = () => setOpenModal(true);
    const handleCloseModal = () => setOpenModal(false);

    const handleSave = async (usuarioData) => {
        try {
            await api.post('/usuarios', usuarioData);
            fetchData();
            handleCloseModal();
        } catch (error) {
            alert('Erro ao salvar o utilizador.');
            console.error(error);
        }
    };

    if (loading) return <CircularProgress />;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">Gestão de Utilizadores</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenModal}>
                    Adicionar Utilizador
                </Button>
            </Box>
            <Paper>
                <List>
                    {usuarios.map(usuario => (
                        <ListItem key={usuario.id} divider>
                            <ListItemText primary={usuario.nome} secondary={`${usuario.email} - Cargo: ${usuario.cargo_nome || 'Não definido'}`} />
                            {/* Futuramente, botões de Editar/Apagar virão aqui */}
                        </ListItem>
                    ))}
                </List>
            </Paper>
            <Modal open={openModal} onClose={handleCloseModal}>
                <Box sx={style}>
                    <UsuarioForm onSave={handleSave} onCancel={handleCloseModal} cargos={cargos} />
                </Box>
            </Modal>
        </Box>
    );
}

export default UsuariosPage;