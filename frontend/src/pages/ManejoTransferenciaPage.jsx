// src/pages/ManejoTransferenciaPage.jsx (VERSÃO FINAL)
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import TransferenciaForm from '../components/TransferenciaForm';

function ManejoTransferenciaPage() {
  const navigate = useNavigate();

  const handleTransferenciaConcluida = () => {
    // Após a transferência, podemos navegar para o dashboard ou outra página
    navigate('/');
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Manejo de Classificação e Transferência de Lotes
      </Typography>
      <TransferenciaForm onTransferenciaRealizada={handleTransferenciaConcluida} />
    </Box>
  );
}

export default ManejoTransferenciaPage;