// src/pages/RegisterPage.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Box, Button, Paper, TextField, Typography, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

function RegisterPage() {
  const [formData, setFormData] = useState({
    nomePiscicultura: '',
    cnpj: '',
    nomeUsuario: '',
    email: '',
    senha: '',
  });
  const { register } = useAuth(); // Pega a função de registo do nosso contexto

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await register(formData);
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 400, mx: 'auto', mt: 8 }}>
      <Typography variant="h5" component="h1" gutterBottom>Criar Conta</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
        <TextField margin="normal" required fullWidth label="Nome da Piscicultura" name="nomePiscicultura" onChange={handleChange} />
        <TextField margin="normal" required fullWidth label="CNPJ" name="cnpj" onChange={handleChange} />
        <TextField margin="normal" required fullWidth label="Seu Nome Completo" name="nomeUsuario" onChange={handleChange} />
        <TextField margin="normal" required fullWidth label="Seu Email" name="email" type="email" onChange={handleChange} />
        <TextField margin="normal" required fullWidth label="Crie uma Senha" name="senha" type="password" onChange={handleChange} />
        <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>Registar</Button>
        <Typography variant="body2" align="center">
          Já tem uma conta?{' '}
          <Link component={RouterLink} to="/login">Faça Login</Link>
        </Typography>
      </Box>
    </Paper>
  );
}
export default RegisterPage;