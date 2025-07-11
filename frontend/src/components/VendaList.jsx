// src/components/VendaList.jsx
import { List, ListItem, ListItemText, Typography, Paper, Box } from '@mui/material';

function VendaList({ vendas }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Paper elevation={2}>
      <List>
        {vendas.length > 0 ? (
          vendas.map(venda => (
            <ListItem key={venda.id} divider>
              <ListItemText 
                primary={`Venda #${venda.nr_venda} - Cliente: ${venda.nome_cliente}`}
                secondary={
                  <Box component="span" sx={{ display: 'block' }}>
                    <Typography component="span" variant="body2">
                      Data: {new Date(venda.data_venda).toLocaleDateString('pt-BR')}
                    </Typography>
                    <Typography component="span" variant="body2" sx={{ mx: 1 }}>|</Typography>
                    <Typography component="span" variant="body2" color="primary.main" sx={{ fontWeight: 'bold' }}>
                      Valor Final: {formatCurrency(venda.valor_final)}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))
        ) : (
          <Typography sx={{ p: 2, textAlign: 'center' }}>Nenhuma venda registada.</Typography>
        )}
      </List>
    </Paper>
  );
}
export default VendaList;