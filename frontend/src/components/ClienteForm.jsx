// src/components/ClienteForm.jsx
import { useState, useEffect } from 'react';
import { TextField, Button, Box, Typography, Grid, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

function ClienteForm({ onSave, onCancel, clienteToEdit }) {
  const [cliente, setCliente] = useState({
    nome: '', tipo_pessoa: 'PJ', cpf_cnpj: '', email: '', telefone: '', endereco: '',
    contato_nome: '', contato_cargo: '', contato_email: '', contato_telefone: ''
  });

  useEffect(() => {
    if (clienteToEdit) {
      setCliente(clienteToEdit);
    }
  }, [clienteToEdit]);

  const handleChange = (e) => {
    setCliente({ ...cliente, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(cliente);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h6">{clienteToEdit ? 'Editar Cliente' : 'Adicionar Novo Cliente'}</Typography>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} sm={8}><TextField name="nome" label="Nome / Razão Social" value={cliente.nome} onChange={handleChange} fullWidth required /></Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth><InputLabel>Tipo</InputLabel>
            <Select name="tipo_pessoa" value={cliente.tipo_pessoa} label="Tipo" onChange={handleChange}><MenuItem value="PJ">Pessoa Jurídica</MenuItem><MenuItem value="PF">Pessoa Física</MenuItem></Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}><TextField name="cpf_cnpj" label="CPF / CNPJ" value={cliente.cpf_cnpj || ''} onChange={handleChange} fullWidth /></Grid>
        <Grid item xs={12} sm={6}><TextField name="telefone" label="Telefone Principal" value={cliente.telefone || ''} onChange={handleChange} fullWidth /></Grid>
        <Grid item xs={12}><TextField name="email" label="Email Principal" type="email" value={cliente.email || ''} onChange={handleChange} fullWidth /></Grid>
        <Grid item xs={12}><TextField name="endereco" label="Endereço" value={cliente.endereco || ''} onChange={handleChange} fullWidth /></Grid>
        <Grid item xs={12}><Typography variant="subtitle1" sx={{mt:2}}>Pessoa de Contato</Typography></Grid>
        <Grid item xs={12} sm={6}><TextField name="contato_nome" label="Nome do Responsável" value={cliente.contato_nome || ''} onChange={handleChange} fullWidth /></Grid>
        <Grid item xs={12} sm={6}><TextField name="contato_cargo" label="Cargo" value={cliente.contato_cargo || ''} onChange={handleChange} fullWidth /></Grid>
        <Grid item xs={12} sm={6}><TextField name="contato_telefone" label="Telefone do Responsável" value={cliente.contato_telefone || ''} onChange={handleChange} fullWidth /></Grid>
        <Grid item xs={12} sm={6}><TextField name="contato_email" label="Email do Responsável" type="email" value={cliente.contato_email || ''} onChange={handleChange} fullWidth /></Grid>
      </Grid>
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button onClick={onCancel} variant="text">Cancelar</Button>
        <Button type="submit" variant="contained">Salvar</Button>
      </Box>
    </Box>
  );
}
export default ClienteForm;