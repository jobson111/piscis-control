// src/components/QualidadeAguaList.jsx
import { List, ListItem, ListItemText, Typography, Paper } from '@mui/material';

function QualidadeAguaList({ registros }) {
  return (
    <Paper elevation={2} sx={{ p: 2, mt: 4 }}>
      <Typography variant="h6" gutterBottom>Histórico de Qualidade da Água</Typography>
      <List>
        {registros.length > 0 ? (
          registros.map(reg => (
            <ListItem key={reg.id} divider>
              <ListItemText 
                primary={`Data: ${new Date(reg.data_medicao).toLocaleString()}`}
                secondary={`pH: ${reg.ph || 'N/A'} | Temp: ${reg.temperatura_celsius || 'N/A'}°C | O₂: ${reg.oxigenio_dissolvido_mg_l || 'N/A'} mg/L`}
              />
            </ListItem>
          ))
        ) : (
          <Typography>Nenhum registo de qualidade da água para este tanque.</Typography>
        )}
      </List>
    </Paper>
  );
}
export default QualidadeAguaList;