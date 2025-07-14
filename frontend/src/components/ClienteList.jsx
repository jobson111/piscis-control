// src/components/ClienteList.jsx (VERSÃO SEGURA)

import { List, ListItem, ListItemText, Typography, Paper, IconButton, Box } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ProtectedComponent from './ProtectedComponent'; // 1. Importamos nosso verificador

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
                  {/* 2. O botão de Editar só é renderizado se o usuário tiver a permissão */}
                  <ProtectedComponent requiredPermission="clientes:editar">
                    <IconButton edge="end" aria-label="edit" onClick={() => onEdit(cliente)}>
                      <EditIcon />
                    </IconButton>
                  </ProtectedComponent>

                  {/* 3. O botão de Apagar só é renderizado se o usuário tiver a permissão */}
                  <ProtectedComponent requiredPermission="clientes:apagar">
                    <IconButton edge="end" aria-label="delete" onClick={() => onDelete(cliente.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </ProtectedComponent>
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