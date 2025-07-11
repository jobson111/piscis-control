// src/pages/CargosPage.jsx (VERSÃO COMPLETA)

import { useState, useEffect } from 'react';
import { 
    Box, Typography, Button, CircularProgress, Paper, List, ListItem, ListItemText,
    IconButton, Modal, TextField, FormGroup, FormControlLabel, Checkbox 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import api from '../services/api';

const style = {
    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    width: '90%', maxWidth: '700px', bgcolor: 'background.paper', border: '2px solid #000',
    boxShadow: 24, p: 4, maxHeight: '90vh', overflowY: 'auto'
};

// Componente do Formulário (incluído aqui para simplificar)
const CargoForm = ({ cargoToEdit, onSave, onCancel }) => {
    const [nome, setNome] = useState('');
    const [descricao, setDescricao] = useState('');
    const [permissoesSelecionadas, setPermissoesSelecionadas] = useState(new Set());
    const [todasPermissoes, setTodasPermissoes] = useState([]);

    useEffect(() => {
        // Busca a lista de todas as permissões disponíveis no sistema
        api.get('/cargos/permissoes').then(res => {
            setTodasPermissoes(res.data);
        });

        // Se estivermos a editar um cargo, preenche o formulário com seus dados
        if (cargoToEdit) {
            setNome(cargoToEdit.nome);
            setDescricao(cargoToEdit.descricao || '');
            // Busca os detalhes do cargo para carregar as permissões que ele já tem
            api.get(`/cargos/${cargoToEdit.id}`).then(res => {
                const permissoesAtuais = new Set(res.data.permissoes.map(p => p.id));
                setPermissoesSelecionadas(permissoesAtuais);
            });
        }
    }, [cargoToEdit]);

    const handlePermissionChange = (permissaoId) => {
        const newSet = new Set(permissoesSelecionadas);
        if (newSet.has(permissaoId)) {
            newSet.delete(permissaoId);
        } else {
            newSet.add(permissaoId);
        }
        setPermissoesSelecionadas(newSet);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            nome,
            descricao,
            permissoesIds: Array.from(permissoesSelecionadas)
        };
        onSave(payload);
    };

    return (
        <Box component="form" onSubmit={handleSubmit}>
            <Typography variant="h6">{cargoToEdit ? 'Editar Cargo' : 'Novo Cargo'}</Typography>
            <TextField label="Nome do Cargo" value={nome} onChange={(e) => setNome(e.target.value)} fullWidth required margin="normal" />
            <TextField label="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} fullWidth multiline rows={2} margin="normal" />
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Permissões</Typography>
            <Paper variant="outlined" sx={{ p: 2, maxHeight: '30vh', overflowY: 'auto' }}>
                <FormGroup>
                    {todasPermissoes.map(p => (
                        <FormControlLabel 
                            key={p.id}
                            control={<Checkbox checked={permissoesSelecionadas.has(p.id)} onChange={() => handlePermissionChange(p.id)} />}
                            label={`${p.acao} - (${p.descricao})`}
                        />
                    ))}
                </FormGroup>
            </Paper>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button onClick={onCancel}>Cancelar</Button>
                <Button type="submit" variant="contained">Salvar</Button>
            </Box>
        </Box>
    );
};


// Componente Principal da Página
function CargosPage() {
    const [cargos, setCargos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const [cargoParaEditar, setCargoParaEditar] = useState(null);

    const fetchCargos = () => {
        setLoading(true);
        api.get('/cargos')
            .then(res => setCargos(res.data))
            .catch(err => console.error("Erro ao buscar cargos:", err))
            .finally(() => setLoading(false));
    };

    useEffect(fetchCargos, []);

    const handleOpenModal = (cargo = null) => {
        setCargoParaEditar(cargo);
        setOpenModal(true);
    };
    const handleCloseModal = () => setOpenModal(false);

    const handleSave = async (cargoData) => {
        try {
            if (cargoParaEditar) {
                await api.put(`/cargos/${cargoParaEditar.id}`, cargoData);
            } else {
                await api.post('/cargos', cargoData);
            }
            fetchCargos();
            handleCloseModal();
        } catch (error) {
            alert('Erro ao salvar o cargo.');
        }
    };

    if (loading) return <CircularProgress />;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">Gestão de Cargos e Permissões</Typography>
                <Button variant="contained" onClick={() => handleOpenModal()}>Criar Novo Cargo</Button>
            </Box>
            <Paper>
                <List>
                    {cargos.map(cargo => (
                        <ListItem key={cargo.id} secondaryAction={
                            <IconButton edge="end" onClick={() => handleOpenModal(cargo)}><EditIcon /></IconButton>
                        }>
                            <ListItemText primary={cargo.nome} secondary={cargo.descricao} />
                        </ListItem>
                    ))}
                </List>
            </Paper>
            <Modal open={openModal} onClose={handleCloseModal}>
                <Box sx={style}>
                    <CargoForm onSave={handleSave} onCancel={handleCloseModal} cargoToEdit={cargoParaEditar} />
                </Box>
            </Modal>
        </Box>
    );
}

export default CargosPage;