// src/pages/PlanosPage.jsx (VERSÃO FINAL COM PORTAL DO CLIENTE)

import { useState, useEffect } from 'react';
import { 
    Box, Typography, CircularProgress, Grid, Card, CardHeader, CardContent, 
    CardActions, Button, List, ListItem, ListItemIcon, ListItemText, Chip,
    ToggleButton, ToggleButtonGroup
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import StarIcon from '@mui/icons-material/Star';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function PlanosPage() {
    const [planos, setPlanos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ciclo, setCiclo] = useState('ANUAL'); // Mantemos o Anual como padrão
    const { user } = useAuth();

    useEffect(() => {
        api.get('/planos')
            .then(res => setPlanos(res.data))
            .catch(err => console.error("Erro ao buscar planos:", err))
            .finally(() => setLoading(false));
    }, []);

    const handleSubscribe = async (priceId) => {
        if (!priceId) {
            alert("Este plano de preços ainda não está configurado para pagamento.");
            return;
        }
        try {
            const response = await api.post('/stripe/create-checkout-session', { priceId });
            const { sessionId } = response.data;
            const stripe = await stripePromise;
            await stripe.redirectToCheckout({ sessionId });
        } catch (error) {
            alert('Não foi possível iniciar o processo de pagamento.');
        }
    };

    const handleManageSubscription = async () => {
        try {
            const response = await api.post('/stripe/create-portal-session');
            window.location.href = response.data.url;
        } catch (error) {
            alert('Não foi possível aceder à gestão de assinaturas.');
        }
    };

    if (loading) return <CircularProgress />;
    
    // Encontra o plano e o preço atuais do usuário para destacar na interface
    const planoAtualDoUsuario = user?.piscicultura?.plano_id 
        ? planos.find(p => p.id === user.piscicultura.plano_id) 
        : null;
    
    const isTrial = user?.piscicultura?.status_assinatura === 'TRIAL';

    return (
        <Box>
            <Typography variant="h4" gutterBottom align="center">Planos e Assinatura</Typography>
            
            {isTrial && (
                <Typography variant="h6" color="text.secondary" align="center" sx={{ mb: 2 }}>
                    Você está no período de teste do plano **{planoAtualDoUsuario?.nome}**. Escolha um plano abaixo para ativar a sua assinatura.
                </Typography>
            )}

            {!isTrial && planoAtualDoUsuario && (
                 <Paper sx={{p: 3, textAlign: 'center', mb: 4, border: '1px solid', borderColor: 'primary.main'}}>
                    <Typography variant="h6">A sua assinatura está ativa!</Typography>
                    <Typography color="text.secondary">
                        Plano atual: **{planoAtualDoUsuario?.nome}** | Expira em: **{new Date(user.piscicultura.data_expiracao_assinatura).toLocaleDateString('pt-BR')}**
                    </Typography>
                    <Button variant="contained" sx={{mt: 2}} onClick={handleManageSubscription}>
                        Gerir Assinatura (Alterar Plano, Cartão, etc.)
                    </Button>
                </Paper>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                <ToggleButtonGroup value={ciclo} exclusive onChange={(e, newCiclo) => { if(newCiclo) setCiclo(newCiclo); }}>
                    <ToggleButton value="MENSAL">Ver Preços Mensais</ToggleButton>
                    <ToggleButton value="ANUAL">Ver Preços Anuais (com desconto)</ToggleButton>
                </ToggleButtonGroup>
            </Box>

            <Grid container spacing={4} alignItems="flex-start" justifyContent="center">
                {planos.map((plano) => {
                    const precoCiclo = plano.precos.find(p => p.ciclo_cobranca === ciclo);
                    const precoMensal = plano.precos.find(p => p.ciclo_cobranca === 'MENSAL');
                    if (!precoCiclo || !precoMensal) return null;

                    const isProfissional = plano.nome === 'Profissional';
                    let economia = null;
                    if (ciclo === 'ANUAL') {
                        const custoAnualMensal = parseFloat(precoMensal.preco) * 12;
                        const poupanca = custoAnualMensal - parseFloat(precoCiclo.preco);
                        if (poupanca > 0) {
                            economia = `Economize ${poupanca.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
                        }
                    }

                    return (
                    <Grid item key={plano.nome} xs={12} md={4}>
                        <Card raised={isProfissional} sx={{height: '100%'}}>
                            <CardHeader
                                title={plano.nome}
                                action={isProfissional ? <Chip icon={<StarIcon />} label="Recomendado" color="primary" variant="outlined" /> : null}
                                titleTypographyProps={{ align: 'center', variant: 'h5' }}
                            />
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', mb: 2 }}>
                                    <Typography component="h2" variant="h3" color="text.primary">
                                        {parseFloat(precoCiclo.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </Typography>
                                    <Typography variant="h6" color="text.secondary">/{ciclo === 'ANUAL' ? 'ano' : 'mês'}</Typography>
                                </Box>
                                {economia && <Chip label={economia} color="success" size="small" sx={{mb: 2, display: 'flex', mx: 'auto'}}/>}
                                <List>
                                    <ListItem><ListItemIcon sx={{minWidth: 32}}><CheckIcon fontSize="small" /></ListItemIcon><ListItemText primary={`${plano.limite_usuarios || 'Ilimitados'} Usuários`} /></ListItem>
                                    <ListItem><ListItemIcon sx={{minWidth: 32}}><CheckIcon fontSize="small" /></ListItemIcon><ListItemText primary={`${plano.limite_tanques || 'Ilimitados'} Tanques`} /></ListItem>
                                    <ListItem><ListItemIcon sx={{minWidth: 32}}><CheckIcon fontSize="small" /></ListItemIcon><ListItemText primary={plano.permite_relatorios_avancados ? "Relatórios Avançados" : "Relatórios Básicos"} /></ListItem>
                                </List>
                            </CardContent>
                            <CardActions>
                                <Button fullWidth variant='contained' onClick={() => handleSubscribe(precoCiclo.gateway_price_id)}>
                                    {isTrial ? 'Ativar Assinatura' : 'Mudar para este Plano'}
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                )})}
            </Grid>
        </Box>
    );
}

export default PlanosPage;