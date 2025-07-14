// src/components/ProtectedComponent.jsx

import { useAuth } from '../context/AuthContext';

/**
 * Um componente que renderiza seus filhos apenas se o usuário logado
 * tiver a permissão necessária.
 * * @param {object} props
 * @param {string} props.requiredPermission A permissão necessária (ex: 'vendas:criar').
 * @param {React.ReactNode} props.children O conteúdo a ser renderizado se o usuário tiver a permissão.
 */
function ProtectedComponent({ requiredPermission, children }) {
  const { can } = useAuth();

  // Usa a função 'can' do nosso AuthContext para verificar a permissão
  if (can(requiredPermission)) {
    return <>{children}</>; // Se tiver permissão, renderiza o conteúdo
  }

  return null; // Se não tiver permissão, não renderiza nada
}

export default ProtectedComponent;