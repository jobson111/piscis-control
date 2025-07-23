// src/pages/LoteDetalhesPage.jsx (VERSÃO FINAL COM CRUD DE ALIMENTAÇÃO)

import { useState, useEffect } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Typography, CircularProgress, Button, Box, Paper, Modal, TextField, Divider 
} from '@mui/material';
import BiometriaList from '../components/BiometriaList';
import AlimentacaoList from '../components/AlimentacaoList';
import AlimentacaoForm from '../components/AlimentacaoForm';
import GraficoCrescimento from '../components/GraficoCrescimento';

const style = {
  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  width: 400, bgcolor: 'background.paper', border: '2px solid #000', boxShadow: 24, p: 4,
};

function LoteDetalhesPage() {
    const { loteId } = useParams();
    const navigate = useNavigate();
    const [lote, setLote] = useState(null);
    const [biometrias, setBiometrias] = useState([]);
    const [registrosAlimentacao, setRegistrosAlimentacao] = useState([]);
    const [projecaoCrescimento, setProjecaoCrescimento] = useState([]);
    const [loading, setLoading] = useState(true);

    // States para Modais
    const [openAlimentacaoModal, setOpenAlimentacaoModal] = useState(false);
    const [alimentacaoParaEditar, setAlimentacaoParaEditar] = useState(null);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                // 1. Busca os dados ESSENCIAIS primeiro.
                const [loteResponse, biometriasResponse, alimentacaoResponse] = await Promise.all([
                    api.get(`/lotes/${loteId}`),
                    api.get(`/biometrias?lote_id=${loteId}`),
                    api.get(`/alimentacao?lote_id=${loteId}`)
                ]);
                
                setLote(loteResponse.data);
                setBiometrias(biometriasResponse.data);
                setRegistrosAlimentacao(alimentacaoResponse.data);

                // 2. SÓ TENTA buscar a projeção se o lote estiver ATIVO.
                if (loteResponse.data.status === 'Ativo') {
                    const projecaoResponse = await api.get(`/lotes/${loteId}/projecao`);
                    setProjecaoCrescimento(projecaoResponse.data);
                }

            } catch (error) {
                console.error("Erro ao buscar dados do lote:", error);
                if (error.response?.status === 404) {
                    alert("Lote não encontrado ou acesso não autorizado.");
                    navigate(-1);
                }
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [loteId, navigate]);

// Prepara os dados para o gráfico
  const pontosReaisGrafico = biometrias.map(bio => {
    const dataEntrada = new Date(lote?.data_entrada);
    const dataBiometria = new Date(bio.data_biometria);
    const diffTime = Math.abs(dataBiometria - dataEntrada);
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    return { semana: diffWeeks, 'Peso Real (g)': parseFloat(bio.peso_medio_gramas) };
  }).sort((a, b) => a.semana - b.semana);
    const pontoInicial = lote ? { semana: 0, 'Peso Real (g)': parseFloat(lote.peso_inicial_medio_g) } : null;
    const dadosReaisCompletos = pontoInicial ? [pontoInicial, ...pontosReaisGrafico] : pontosReaisGrafico;

    // --- Handlers de Alimentação ---
    const handleNovaAlimentacao = (novoRegistro) => {
        fetchData(); // A forma mais simples de garantir que tudo está sincronizado
    };

    const handleDeleteAlimentacao = async (id) => {
        if (window.confirm('Tem certeza que deseja apagar este registo de alimentação?')) {
            try {
                await api.delete(`/alimentacao/${id}`);
                fetchData(); // Recarrega os dados para refletir a exclusão
            } catch (error) {
                alert('Falha ao apagar registo.');
            }
        }
    };

    const handleOpenAlimentacaoModal = (registro) => {
        setAlimentacaoParaEditar({
            ...registro,
            data_alimentacao: new Date(registro.data_alimentacao).toISOString().split('T')[0]
        });
        setOpenAlimentacaoModal(true);
    };
    const handleCloseAlimentacaoModal = () => setOpenAlimentacaoModal(false);

    const handleAlimentacaoUpdateChange = (e) => {
        setAlimentacaoParaEditar({...alimentacaoParaEditar, [e.target.name]: e.target.value});
    };

    const handleUpdateAlimentacaoSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/alimentacao/${alimentacaoParaEditar.id}`, alimentacaoParaEditar);
            fetchData(); // Recarrega os dados para refletir a atualização
            handleCloseAlimentacaoModal();
        } catch (error) {
            alert('Falha ao atualizar registo.');
        }
    };

    if (loading) return <CircularProgress />;
    if (!lote) return <Typography>Lote não encontrado.</Typography>;

    return (
        <Box>
            <Button component={RouterLink} to={`/tanques/${lote.tanque_id}`} variant="outlined" sx={{ mb: 2 }}>Voltar para o Tanque</Button>
            
            {lote.status === 'Ativo' && projecaoCrescimento.length > 0 && (
                <GraficoCrescimento 
                    dadosReais={dadosReaisCompletos} 
                    dadosProjetados={projecaoCrescimento}
                    lote={lote}
                />
            )}

            <Paper elevation={1} sx={{p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <Box>
                    <Typography variant="h5" gutterBottom>Lote de {lote.especie} (ID: {lote.id})</Typography>
                    <Typography variant="body1">Status: {lote.status} | Peso Atual: {lote.peso_atual_medio_g || lote.peso_inicial_medio_g}g</Typography>
                </Box>
                <Button variant="contained" component={RouterLink} to={`/relatorios/desempenho-lote/${lote.id}`}>Ver Relatório de Desempenho</Button>
            </Paper>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
                <Box>
                    <BiometriaList biometrias={biometrias} />
                </Box>
                <Box>
                    <AlimentacaoList registros={registrosAlimentacao} onEdit={handleOpenAlimentacaoModal} onDelete={handleDeleteAlimentacao} />
                    {lote.status === 'Ativo' && (
                        <AlimentacaoForm loteId={loteId} onAlimentacaoRegistada={handleNovaAlimentacao} />
                    )}
                </Box>
            </Box>

            <Modal open={openAlimentacaoModal} onClose={handleCloseAlimentacaoModal}>
                <Box sx={style}>
                    <Typography variant="h6" component="h2">Editar Registo de Alimentação</Typography>
                    {alimentacaoParaEditar && (
                        <Box component="form" onSubmit={handleUpdateAlimentacaoSubmit} sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField label="Data da Alimentação" name="data_alimentacao" type="date" value={alimentacaoParaEditar.data_alimentacao} onChange={handleAlimentacaoUpdateChange} InputLabelProps={{ shrink: true }} fullWidth required />
                            <TextField label="Tipo de Ração" name="tipo_racao" value={alimentacaoParaEditar.tipo_racao || ''} onChange={handleAlimentacaoUpdateChange} fullWidth />
                            <TextField label="Quantidade (kg)" name="quantidade_kg" type="number" value={alimentacaoParaEditar.quantidade_kg} onChange={handleAlimentacaoUpdateChange} fullWidth required />
                            <TextField label="Custo Total (R$)" name="custo_total" type="number" value={alimentacaoParaEditar.custo_total || ''} onChange={handleAlimentacaoUpdateChange} fullWidth />
                            <Button type="submit" variant="contained">Salvar Alterações</Button>
                        </Box>
                    )}
                </Box>
            </Modal>
        </Box>
    );
}

export default LoteDetalhesPage;