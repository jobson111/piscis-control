// src/pages/LoteDetalhesPage.jsx (Com Alimentação)

import { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import api from '../services/api';
import { Typography, CircularProgress, Button, Box, Paper } from '@mui/material';
import BiometriaList from '../components/BiometriaList';
import BiometriaForm from '../components/BiometriaForm';
import AlimentacaoList from '../components/AlimentacaoList';
import AlimentacaoForm from '../components/AlimentacaoForm';

function LoteDetalhesPage() {
  const { loteId } = useParams();
  const [lote, setLote] = useState(null);
  const [biometrias, setBiometrias] = useState([]);
  const [registrosAlimentacao, setRegistrosAlimentacao] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [loteResponse, biometriasResponse, alimentacaoResponse] = await Promise.all([
          api.get(`/lotes/${loteId}`),
          api.get(`/biometrias?lote_id=${loteId}`),
          api.get(`/alimentacao?lote_id=${loteId}`) // Busca os dados de alimentação
        ]);
        setLote(loteResponse.data);
        setBiometrias(biometriasResponse.data);
        setRegistrosAlimentacao(alimentacaoResponse.data);
      } catch (error) {
        console.error("Erro ao buscar dados do lote:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [loteId]);

  function handleNovaBiometria(novaBiometria) {
    setBiometrias(current => [novaBiometria, ...current]);
    setLote(loteAtual => ({...loteAtual, peso_atual_medio_g: novaBiometria.peso_medio_gramas}));
  }

  function handleNovaAlimentacao(novoRegistro) {
    setRegistrosAlimentacao(current => [novoRegistro, ...current]);
  }

  if (loading) return <CircularProgress />;
  if (!lote) return <Typography>Lote não encontrado.</Typography>;

  return (
    <Box>
      <Button component={RouterLink} to={`/tanques/${lote.tanque_id}`} variant="outlined" sx={{ mb: 2 }}>
        Voltar para o Tanque
      </Button>

      <Paper elevation={1} sx={{p: 2, mb: 4}}>
        <Typography variant="h5" gutterBottom>Lote de {lote.especie} (ID: {lote.id})</Typography>
        <Typography variant="body1">Status: {lote.status} | Peso Atual: {lote.peso_atual_medio_g || lote.peso_inicial_medio_g}g</Typography>
      </Paper>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
        {/* Coluna da Esquerda: Biometria */}
        <Box>
          <BiometriaList biometrias={biometrias} />
          <BiometriaForm loteId={loteId} pisciculturaId={lote.piscicultura_id} onBiometriaRegistada={handleNovaBiometria} />
        </Box>
        {/* Coluna da Direita: Alimentação */}
        <Box>
          <AlimentacaoList registros={registrosAlimentacao} />
          <AlimentacaoForm loteId={loteId} pisciculturaId={lote.piscicultura_id} onAlimentacaoRegistada={handleNovaAlimentacao} />
        </Box>
      </Box>
    </Box>
  );
}

export default LoteDetalhesPage;