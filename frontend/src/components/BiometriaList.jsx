// src/components/BiometriaList.jsx
import { List, ListItem, ListItemText, Typography, Paper } from '@mui/material';

function BiometriaList({ biometrias }) {
  return (
    <Paper elevation={2} sx={{ p: 2, mt: 4 }}>
      <Typography variant="h6" gutterBottom>Histórico de Biometrias</Typography>
      <List>
        {biometrias.length > 0 ? (
          biometrias.map(bio => (
            <ListItem key={bio.id} divider>
              <ListItemText 
                primary={`Peso Médio: ${bio.peso_medio_gramas}g`}
                secondary={`Data: ${new Date(bio.data_biometria).toLocaleDateString()} | Amostra: ${bio.quantidade_amostra || 'N/A'}`}
              />
            </ListItem>
          ))
        ) : (
          <Typography>Nenhuma biometria registada para este lote.</Typography>
        )}
      </List>
    </Paper>
  );
}
export default BiometriaList;