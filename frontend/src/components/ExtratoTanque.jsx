// src/components/ExtratoTanque.jsx (VERSÃO FINAL COM SAÍDAS)

import { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, List, ListItem, ListItemIcon, ListItemText, Divider, Chip } from '@mui/material';
import api from '../services/api';

// Ícones
import InputIcon from '@mui/icons-material/Input'; // Entrada
import OutputIcon from '@mui/icons-material/Output'; // Saída (NOVO)
import RestaurantIcon from '@mui/icons-material/Restaurant';
import ScienceIcon from '@mui/icons-material/Science';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

// Função auxiliar de estilo atualizada
const getEventStyle = (tipo) => {
    switch (tipo) {
        case 'ENTRADA DE LOTE':
        case 'TRANSFERÊNCIA (ENTRADA)':
            return { icon: <InputIcon color="success" />, color: 'success.main' };
        case 'TRANSFERÊNCIA (SAÍDA)':
            return { icon: <OutputIcon color="error" />, color: 'error.main' }; // NOVO
        case 'ALIMENTAÇÃO':
            return { icon: <RestaurantIcon color="info" />, color: 'info.main' };
        case 'BIOMETRIA':
            return { icon: <ScienceIcon color="secondary" />, color: 'secondary.main' };
        case 'VENDA':
            return { icon: <MonetizationOnIcon sx={{ color: '#ed6c02' }} />, color: 'warning.main' }; // Cor laranja para Venda
        default:
            return { icon: <HelpOutlineIcon color="disabled" />, color: 'text.secondary' };
    }
};

const renderDetalhes = (detalhes) => {
    if (!detalhes) return null;
    return Object.entries(detalhes).map(([key, value]) => (
        <Chip key={key} label={`${key}: ${value}`} size="small" sx={{ mr: 1, mt: 1 }} />
    ));
};

function ExtratoTanque({ tanqueId }) {
    const [eventos, setEventos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (tanqueId) {
            setLoading(true);
            api.get(`/relatorios/extrato-tanque/${tanqueId}`)
                .then(res => setEventos(res.data))
                .catch(err => console.error("Erro ao buscar extrato do tanque:", err))
                .finally(() => setLoading(false));
        }
    }, [tanqueId]);

    if (loading) return <CircularProgress />;
    if (eventos.length === 0) return <Typography sx={{ p: 2 }}>Nenhum evento registado para este tanque.</Typography>;

    return (
        <List>
            {eventos.map((evento, index) => {
                const style = getEventStyle(evento.tipo);
                // Usamos o index no key para garantir unicidade, já que evento_id pode repetir entre tabelas
                return (
                    <Box key={`${evento.tipo}-${evento.evento_id}-${index}`}>
                        <ListItem alignItems="flex-start">
                            <ListItemIcon sx={{ mt: 1 }}>
                                {style.icon}
                            </ListItemIcon>
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                        <Chip label={evento.tipo} color="primary" variant="outlined" size="small" sx={{borderColor: style.color, color: style.color, fontWeight: 'bold'}}/>
                                        <Typography variant="body1">{evento.descricao}</Typography>
                                    </Box>
                                }
                                secondary={
                                    <>
                                        <Typography component="span" variant="caption" color="text.secondary">
                                            {new Date(evento.data_evento).toLocaleDateString('pt-BR')}
                                        </Typography>
                                        <Box sx={{ mt: 0.5 }}>
                                            {renderDetalhes(evento.detalhes)}
                                        </Box>
                                    </>
                                }
                            />
                        </ListItem>
                        <Divider variant="inset" component="li" />
                    </Box>
                );
            })}
        </List>
    );
}

export default ExtratoTanque;