// src/theme.js (VERSÃO COM PALETA DE CORES REFINADA)

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    // Definimos uma paleta de cores mais suave e profissional
    primary: {
      main: '#2962ff', // Azul um pouco mais vibrante para ações principais
    },
    secondary: {
      main: '#607d8b', // Cinza azulado para ações secundárias
    },
    success: {
      light: '#e8f5e9', // Verde pastel para o fundo do card
      main: '#4caf50',   // Verde principal para o ícone e texto
    },
    info: {
      light: '#e3f2fd', // Azul pastel para o fundo do card
      main: '#2196f3',    // Azul principal para o ícone e texto
    },
    warning: {
      light: '#fff3e0', // Laranja pastel para o fundo do card
      main: '#ff9800',    // Laranja principal para o ícone e texto
    },
    background: {
      default: '#f4f6f8', // Fundo geral da página
      paper: '#ffffff',   // Fundo dos cards e painéis
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12, // Bordas um pouco mais arredondadas
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8, // Bordas dos botões
          textTransform: 'none', // Texto dos botões sem ser tudo maiúsculo
        },
      },
    },
  },
});

export default theme;