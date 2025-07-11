// src/components/ClienteList.jsx
import { List, ListItem, ListItemText, Typography, Paper, IconButton, Box } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

function ClienteList({ clientes, onEdit, onDelete }) {
  return (
    <Paper elevation={2}>
      <List>
        {clientes.length > 0 ? (
          clientes.map(cliente => (
            <ListItem 
              key={cliente.id} 
              divider
              secondaryAction={
                <Box>
                  <IconButton edge="end" aria-label="edit" onClick={() => onEdit(cliente)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" aria-label="delete" onClick={() => onDelete(cliente.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              }
            >
              <ListItemText 
                primary={`${cliente.nome} (${cliente.tipo_pessoa})`}
                secondary={`Contato: ${cliente.contato_nome || 'N/A'} - Tel: ${cliente.telefone || 'N/A'}`}
              />
            </ListItem>
          ))
        ) : (
          <Typography sx={{ p: 2, textAlign: 'center' }}>Nenhum cliente cadastrado.</Typography>
        )}
      </List>
    </Paper>
  );
}

export default ClienteList;