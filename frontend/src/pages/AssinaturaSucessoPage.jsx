// src/pages/AssinaturaSucessoPage.jsx (VERSÃO INTELIGENTE)

import { useEffect, useState } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '../context/AuthContext';

function AssinaturaSucessoPage() {
    const { reauthenticate } = useAuth();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Assim que a página carrega, chamamos a função para re-sincronizar os dados do usuário
        const syncUser = async () => {
            await reauthenticate();
            setLoading(false);
        };
        syncUser();
    }, [reauthenticate]);

    if (loading) {
        return (
            <Box sx={{ textAlign: 'center', mt: 8 }}>
                <CircularProgress />
                <Typography variant="h6" sx={{ mt: 2 }}>A finalizar a sua assinatura...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 80 }} />
            <Typography variant="h4" gutterBottom sx={{ mt: 2 }}>Pagamento Bem-Sucedido!</Typography>
            <Typography variant="body1" color="text.secondary">
                A sua assinatura foi ativada. Obrigado por se juntar a nós!
            </Typography>
            <Button component={RouterLink} to="/" variant="contained" sx={{ mt: 4 }}>
                Ir para o Dashboard
            </Button>
        </Box>
    );
}

export default AssinaturaSucessoPage;