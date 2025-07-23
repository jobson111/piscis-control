// src/pages/ConfiguracoesPage.jsx

import { useState, useEffect } from 'react';
import { 
    Box, 
    Typography, 
    CircularProgress, 
    Paper, 
    FormControl, 
    FormLabel, 
    RadioGroup, 
    FormControlLabel, 
    Radio, 
    Button,
    Alert
} from '@mui/material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProtectedComponent from '../components/ProtectedComponent';

function ConfiguracoesPage() {
    const { user } = useAuth();
    const [config, setConfig] = useState({ modelo_financeiro: '' });
    const [loading, setLoading] = useState(true);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (user) {
            setLoading(true);
            // O nosso AuthContext já tem os dados da piscicultura, vamos usá-los!
            if (user.piscicultura) {
                setConfig({ modelo_financeiro: user.piscicultura.modelo_financeiro });
                setLoading(false);
            } else {
                // Fallback caso os dados não estejam no contexto (pouco provável)
                api.get(`/pisciculturas/${user.pisciculturaId}`)
                    .then(res => setConfig({ modelo_financeiro: res.data.modelo_financeiro }))
                    .finally(() => setLoading(false));
            }
        }
    }, [user]);

    const handleChange = (event) => {
        setConfig({ ...config, modelo_financeiro: event.target.value });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            await api.put('/pisciculturas/configuracoes/financeiro', config);
            setSuccessMessage('Configurações salvas com sucesso!');
            // O ideal seria forçar uma atualização do AuthContext aqui, mas por agora um alerta é suficiente
            setTimeout(() => setSuccessMessage(''), 3000); // Limpa a mensagem após 3 segundos
        } catch (error) {
            console.error("Erro ao salvar configurações:", error);
            alert("Não foi possível salvar as configurações.");
        }
    };

    if (loading) return <CircularProgress />;

    return (
        // O ProtectedComponent garante que apenas usuários com a permissão correta vejam esta página
        <ProtectedComponent requiredPermission="piscicultura:configurar">
            <Box>
                <Typography variant="h5" gutterBottom>Configurações da Piscicultura</Typography>
                
                <Paper component="form" onSubmit={handleSubmit} elevation={3} sx={{ p: 3, mt: 3, maxWidth: '600px' }}>
                    <FormControl component="fieldset">
                        <FormLabel component="legend" sx={{fontWeight: 'bold', mb: 1}}>Modelo de Gestão Financeira</FormLabel>
                        <RadioGroup
                            aria-label="modelo-financeiro"
                            name="modelo_financeiro"
                            value={config.modelo_financeiro}
                            onChange={handleChange}
                        >
                            <FormControlLabel 
                                value="DIRETO" 
                                control={<Radio />} 
                                label="Direto (Automático)" 
                            />
                            <Typography variant="caption" color="text.secondary" sx={{pl: 4, mb: 1}}>
                                Recomendado para operações mais simples. Ao registar uma venda, o sistema automaticamente cria uma entrada de "Receita" numa conta "Caixa" padrão.
                            </Typography>
                            
                            <FormControlLabel 
                                value="CONCILIACAO" 
                                control={<Radio />} 
                                label="Por Conciliação (Prestação de Contas)" 
                            />
                            <Typography variant="caption" color="text.secondary" sx={{pl: 4}}>
                                Recomendado para equipas com vendedores. As vendas ficam "Pendentes" e o dinheiro só é contabilizado no sistema através da tela de "Prestação de Contas".
                            </Typography>
                        </RadioGroup>
                    </FormControl>

                    <Box sx={{ mt: 3, textAlign: 'right' }}>
                        <Button type="submit" variant="contained">
                            Salvar Configurações
                        </Button>
                    </Box>

                    {successMessage && <Alert severity="success" sx={{ mt: 2 }}>{successMessage}</Alert>}
                </Paper>
            </Box>
        </ProtectedComponent>
    );
}

export default ConfiguracoesPage;