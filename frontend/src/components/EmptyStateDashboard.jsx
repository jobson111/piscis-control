// src/components/EmptyStateDashboard.jsx
import { Paper, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

function EmptyStateDashboard({ pisciculturaId }) {
  return (
    <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h5" gutterBottom>
        Bem-vindo ao Piscis Control!
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 2, mb: 3 }}>
        Parece que você ainda não tem nenhum tanque cadastrado.
        O primeiro passo para começar a gerir a sua produção é adicionar os seus tanques ou viveiros.
      </Typography>
      <Button
        variant="contained"
        size="large"
        component={RouterLink}
        to={`/pisciculturas/${pisciculturaId}`}
      >
        Cadastrar meu primeiro Tanque
      </Button>
    </Paper>
  );
}

export default EmptyStateDashboard;