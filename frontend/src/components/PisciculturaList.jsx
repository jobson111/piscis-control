// src/components/PisciculturaList.jsx

import { Link as RouterLink } from 'react-router-dom'; // Importa o Link
import { List, ListItem, ListItemButton, ListItemText, Typography, Paper } from '@mui/material'; // ListItemButton

function PisciculturaList({ pisciculturas }) {
  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Lista de Pisciculturas Cadastradas</Typography>
      <List>
        {pisciculturas.map(p => (
          // Usamos o componente Link para navegação sem recarregar a página
          <RouterLink to={`/pisciculturas/${p.id}`} key={p.id} style={{ textDecoration: 'none', color: 'inherit' }}>
            <ListItemButton> {/* ListItemButton dá o efeito de clique */}
              <ListItemText 
                primary={p.nome_fantasia} 
                secondary={`CNPJ: ${p.cnpj}`} 
              />
            </ListItemButton>
          </RouterLink>
        ))}
      </List>
    </Paper>
  );
}

export default PisciculturaList;