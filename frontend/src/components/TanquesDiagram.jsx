// src/components/TanquesDiagram.jsx

import { Paper, Typography, Grid, Box, Tooltip } from '@mui/material';
import WavesIcon from '@mui/icons-material/Waves'; // Ícone para tanques vazios
import PhishingIcon from '@mui/icons-material/Phishing'; // Ícone para tanques ocupados

function TanquesDiagram({ tanques, onTanqueClick }) {
  if (!tanques || tanques.length === 0) {
    return <Typography>Não há tanques para exibir.</Typography>;
  }

  return (
    <Paper elevation={3} sx={{ p: 2, mt: 4 }}>
      <Typography variant="h6" gutterBottom>Diagrama de Tanques</Typography>
      <Box sx={{ maxHeight: '400px', overflowY: 'auto', p: 1 }}>
        <Grid container spacing={2}>
          {tanques.map(tanque => {
            const isOcupado = !!tanque.lote_id;
            const peso = parseFloat(tanque.peso_medio_g || 0).toFixed(0);

            return (
              <Grid item xs={6} sm={4} md={3} lg={2} key={tanque.id}>
                <Tooltip title={isOcupado ? `${tanque.especie} - Aprox. ${peso}g` : 'Tanque Vazio'} placement="top">
                  <Paper 
                    elevation={2}
                    sx={{
                      p: 1.5,
                      textAlign: 'center',
                      backgroundColor: isOcupado ? 'primary.light' : 'grey.200',
                      color: isOcupado ? 'primary.contrastText' : 'grey.700',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        boxShadow: 6,
                      }
                    }}
                    onClick={() => onTanqueClick(tanque.id)}
                  >
                    <Typography variant="h6" component="div" noWrap>
                      {tanque.nome_identificador}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                      {isOcupado ? <PhishingIcon sx={{ mr: 1 }} /> : <WavesIcon sx={{ mr: 1 }} />}
                      <Typography variant="body2">
                        {isOcupado ? `${tanque.quantidade_atual}` : 'Vazio'}
                      </Typography>
                    </Box>
                  </Paper>
                </Tooltip>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Paper>
  );
}

export default TanquesDiagram;