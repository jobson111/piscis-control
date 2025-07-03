// src/pages/LoginPage.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Box, Button, Paper, TextField, Typography, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const { login } = useAuth(); // Pega a função de login do nosso contexto

  const handleSubmit = async (event) => {
    event.preventDefault();
    await login({ email, senha });
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 400, mx: 'auto', mt: 8 }}>
      <Typography variant="h5" component="h1" gutterBottom>Login</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
        <TextField margin="normal" required fullWidth label="Endereço de Email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField margin="normal" required fullWidth name="senha" label="Senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
        <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>Entrar</Button>
        <Typography variant="body2" align="center">
          Não tem uma conta?{' '}
          <Link component={RouterLink} to="/register">Registe-se</Link>
        </Typography>
      </Box>
    </Paper>
  );
}
export default LoginPage;