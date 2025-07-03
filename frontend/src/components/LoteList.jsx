// src/components/LoteList.jsx

import { List, ListItem, ListItemText, Typography, Paper, IconButton, Box, ListItemButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Link as RouterLink } from 'react-router-dom';

function LoteList({ lotes, onEdit, onDelete }) {
  return (
    <Paper elevation={2} sx={{ p: 2, mt: 4 }}>
      <Typography variant="h6" gutterBottom>Lotes no Tanque</Typography>
      <List>
        {lotes.length > 0 ? (
          lotes.map(lote => (
            <ListItem 
              key={lote.id} 
              disablePadding
              divider
            >
              <ListItemButton component={RouterLink} to={`/lotes/${lote.id}`}>
                <ListItemText 
                  primary={`Lote de ${lote.especie} (ID: ${lote.id})`}
                  secondary={`Status: ${lote.status} | Qtd. Atual: ${lote.quantidade_atual ?? lote.quantidade_inicial} | Peso Médio: ${lote.peso_atual_medio_g ?? lote.peso_inicial_medio_g}g`}
                />
              </ListItemButton>
              <Box sx={{ pr: 2 }}>
                <IconButton edge="end" aria-label="edit" onClick={(e) => { e.stopPropagation(); onEdit(lote); }}>
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" aria-label="delete" onClick={(e) => { e.stopPropagation(); onDelete(lote.id); }}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            </ListItem>
          ))
        ) : (
          <Typography sx={{p: 2}}>Nenhum lote cadastrado para este tanque.</Typography>
        )}
      </List>
    </Paper>
  );
}

export default LoteList;