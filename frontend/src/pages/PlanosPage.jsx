// src/pages/PlanosPage.jsx (VERSÃO FINAL E COMPLETA PARA A CAKTO)

import { useState, useEffect } from 'react';
import { 
    Box, Typography, CircularProgress, Grid, Card, CardHeader, CardContent, 
    CardActions, Button, List, ListItem, ListItemIcon, ListItemText, Chip,
    ToggleButton, ToggleButtonGroup
} from '@mui/material';
import { useNavigate, Link as NavLink } from 'react-router-dom';
import CheckIcon from '@mui/icons-material/Check';
import StarIcon from '@mui/icons-material/Star';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function PlanosPage() {
    const [planos, setPlanos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ciclo, setCiclo] = useState('ANUAL');
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/planos')
            .then(res => setPlanos(res.data))
            .catch(err => console.error("Erro ao buscar planos:", err))
            .finally(() => setLoading(false));
    }, []);

    const handleCicloChange = (event, newCiclo) => {
        if (newCiclo !== null) { 
            setCiclo(newCiclo); 
        }
    };

    const handleSubscribe = async (precoId) => {
        // ... (A nossa lógica de subscrição que será ligada à Cakto)
    };

    if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;

    return (
        <Box>
            <Typography variant="h4" gutterBottom align="center">Nossos Planos</Typography>
            <Typography variant="h6" color="text.secondary" align="center" sx={{ mb: 2 }}>
                Comece com um teste gratuito de 30 dias do plano Profissional.
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                <ToggleButtonGroup
                    value={ciclo}
                    exclusive
                    onChange={handleCicloChange}
                    aria-label="ciclo de pagamento"
                >
                    <ToggleButton value="MENSAL" aria-label="mensal">Mensal</ToggleButton>
                    <ToggleButton value="ANUAL" aria-label="anual">Anual</ToggleButton>
                </ToggleButtonGroup>
            </Box>

            <Grid container spacing={4} alignItems="flex-start" justifyContent="center">
                {planos.map((plano) => {
                    const precoCiclo = plano.precos.find(p => p.ciclo_cobranca === ciclo);
                    const precoMensal = plano.precos.find(p => p.ciclo_cobranca === 'MENSAL');
                    
                    const isCurrentPlan = user?.piscicultura?.plano_id === plano.id;
                    const isProfissional = plano.nome === 'Profissional';
                    
                    let precoDisplay = 'N/A';
                    let subheader = '/mês';
                    let economia = null;

                    if (precoCiclo && precoMensal) {
                        if (ciclo === 'ANUAL') {
                            precoDisplay = (parseFloat(precoCiclo.preco) / 12).toFixed(2).replace('.',',');
                            const custoAnualMensal = parseFloat(precoMensal.preco) * 12;
                            const poupanca = custoAnualMensal - parseFloat(precoCiclo.preco);
                            if (poupanca > 0) {
                                economia = `Economize ${poupanca.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
                            }
                        } else {
                            precoDisplay = parseFloat(precoCiclo.preco).toFixed(2).replace('.',',');
                        }
                    }

                    return (
                    <Grid item key={plano.nome} xs={12} md={4}>
                        <Card raised={isProfissional || isCurrentPlan} sx={{ border: isCurrentPlan ? '2px solid' : 'transparent', borderColor: 'primary.main' }}>
                            <CardHeader
                                title={plano.nome}
                                action={isProfissional ? <Chip icon={<StarIcon />} label="Recomendado" color="primary" variant="outlined" /> : null}
                                titleTypographyProps={{ align: 'center', variant: 'h5' }}
                                sx={{ backgroundColor: (theme) => theme.palette.grey[100] }}
                            />
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', mb: 2 }}>
                                    <Typography component="span" variant="h6" color="text.secondary" sx={{mr: 0.5}}>R$</Typography>
                                    <Typography component="h2" variant="h3" color="text.primary">{precoDisplay}</Typography>
                                    <Typography variant="h6" color="text.secondary">{subheader}</Typography>
                                </Box>
                                {ciclo === 'ANUAL' && economia && <Chip label={economia} color="success" size="small" sx={{mb: 2, display: 'flex', mx: 'auto'}}/>}
                                <List>
                                    <ListItem disablePadding><ListItemIcon sx={{minWidth: 32}}><CheckIcon fontSize="small" color="primary"/></ListItemIcon><ListItemText primary={`${plano.limite_usuarios || 'Ilimitados'} Usuários`} /></ListItem>
                                    <ListItem disablePadding><ListItemIcon sx={{minWidth: 32}}><CheckIcon fontSize="small" color="primary"/></ListItemIcon><ListItemText primary={`${plano.limite_tanques || 'Ilimitados'} Tanques`} /></ListItem>
                                    <ListItem disablePadding><ListItemIcon sx={{minWidth: 32}}><CheckIcon fontSize="small" color="primary"/></ListItemIcon><ListItemText primary={plano.permite_relatorios_avancados ? "Relatórios Avançados" : "Relatórios Básicos"} /></ListItem>
                                </List>
                            </CardContent>
                            <CardActions>
                                <Button fullWidth variant={isCurrentPlan ? 'outlined' : 'contained'} onClick={() => handleSubscribe(precoCiclo?.id)} disabled={isCurrentPlan}>
                                    {isCurrentPlan ? 'Seu Plano Atual' : 'Selecionar Plano'}
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