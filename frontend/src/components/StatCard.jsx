// src/components/StatCard.jsx (VERSÃO COM NOVO ESTILO)

import { Paper, Typography, Box } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

function StatCard({ title, value, icon, variation, color = 'primary' }) {
    const variationValue = parseFloat(variation);
    const hasVariation = !isNaN(variationValue) && variationValue !== 0;
    const isPositive = hasVariation && variationValue > 0;
    
    const variationColor = isPositive ? 'success.main' : 'error.main';
    const backgroundColor = `${color}.light`; // Usa a cor pastel (ex: success.light)
    const iconColor = `${color}.main`; // Usa a cor principal (ex: success.main)

    return (
        <Paper 
            elevation={2} 
            sx={{ 
                p: 2.5,
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%',
                // O fundo agora é a cor pastel que definimos no tema
                backgroundColor: backgroundColor,
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    {title}
                </Typography>
                {/* O ícone agora tem a cor principal */}
                <Box sx={{ color: iconColor }}>
                    {icon}
                </Box>
            </Box>
            
            <Typography component="p" variant="h4" sx={{ mt: 1, flexGrow: 1, color: 'text.primary' }}>
                {value}
            </Typography>

            {hasVariation && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 'auto', color: variationColor }}>
                    {isPositive ? <ArrowUpwardIcon sx={{ fontSize: '1rem' }} /> : <ArrowDownwardIcon sx={{ fontSize: '1rem' }} />}
                    <Typography variant="body2" sx={{ fontWeight: 'bold', ml: 0.5 }}>
                        {variationValue.toFixed(2)}%
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
                        vs. mês anterior
                    </Typography>
                </Box>
            )}
        </Paper>
    );
}

export default StatCard;