// src/components/AlimentacaoList.jsx (VERSÃO ATUALIZADA COM BOTÕES)

import { List, ListItem, ListItemText, Typography, Paper, IconButton, Box } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

// O componente agora recebe onEdit e onDelete
function AlimentacaoList({ registros, onEdit, onDelete }) {
  return (
    <Paper elevation={2} sx={{ p: 2, mt: 2 }}>
      <Typography variant="h6" gutterBottom>Histórico de Alimentação</Typography>
      <List>
        {registros.length > 0 ? (
          registros.map(reg => (
            <ListItem 
              key={reg.id} 
              divider
              secondaryAction={
                <Box>
                  <ProtectedComponent requiredPermission="alimentacao:editar">
                    <IconButton edge="end" aria-label="edit" onClick={() => onEdit(reg)}>
                      <EditIcon />
                    </IconButton>
                  </ProtectedComponent>  
                  <ProtectedComponent requiredPermission="alimentacao:apagar">
                    <IconButton edge="end" aria-label="delete" onClick={() => onDelete(reg.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </ProtectedComponent>
                </Box>
              }
            >
              <ListItemText 
                primary={`Quantidade: ${reg.quantidade_kg}kg de ${reg.tipo_racao || 'N/A'}`}
                secondary={`Data: ${new Date(reg.data_alimentacao).toLocaleString('pt-BR')}`}
              />
            </ListItem>
          ))
        ) : (
          <Typography sx={{ p: 2 }}>Nenhum registo de alimentação para este lote.</Typography>
        )}
      </List>
    </Paper>
  );
}

export default AlimentacaoList;