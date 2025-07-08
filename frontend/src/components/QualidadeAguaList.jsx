// src/components/QualidadeAguaList.jsx (VERSÃO ATUALIZADA COM BOTÕES)

import { List, ListItem, ListItemText, Typography, Paper, IconButton, Box } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

// O componente agora recebe onEdit e onDelete
function QualidadeAguaList({ registros, onEdit, onDelete }) {
  return (
    <Paper elevation={2} sx={{ p: 2, mt: 4 }}>
      <Typography variant="h6" gutterBottom>Histórico de Qualidade da Água</Typography>
      <List>
        {registros.length > 0 ? (
          registros.map(reg => (
            <ListItem 
              key={reg.id} 
              divider
              secondaryAction={
                <Box>
                  <IconButton edge="end" aria-label="edit" onClick={() => onEdit(reg)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" aria-label="delete" onClick={() => onDelete(reg.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              }
            >
              <ListItemText 
                primary={`Data: ${new Date(reg.data_medicao).toLocaleString('pt-BR')}`}
                secondary={`pH: ${reg.ph ?? 'N/A'} | Temp: ${reg.temperatura_celsius ?? 'N/A'}°C | O₂: ${reg.oxigenio_dissolvido_mg_l ?? 'N/A'} mg/L`}
              />
            </ListItem>
          ))
        ) : (
          <Typography sx={{ p: 2 }}>Nenhum registo de qualidade da água.</Typography>
        )}
      </List>
    </Paper>
  );
}

export default QualidadeAguaList;