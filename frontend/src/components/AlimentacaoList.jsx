// src/components/AlimentacaoList.jsx
import { List, ListItem, ListItemText, Typography, Paper } from '@mui/material';

function AlimentacaoList({ registros }) {
  return (
    <Paper elevation={2} sx={{ p: 2, mt: 4 }}>
      <Typography variant="h6" gutterBottom>Histórico de Alimentação</Typography>
      <List>
        {registros.length > 0 ? (
          registros.map(reg => (
            <ListItem key={reg.id} divider>
              <ListItemText 
                primary={`${reg.quantidade_kg} kg de ${reg.tipo_racao}`}
                secondary={`Data: ${new Date(reg.data_alimentacao).toLocaleDateString()}`}
              />
            </ListItem>
          ))
        ) : (
          <Typography>Nenhum registo de alimentação para este lote.</Typography>
        )}
      </List>
    </Paper>
  );
}
export default AlimentacaoList;