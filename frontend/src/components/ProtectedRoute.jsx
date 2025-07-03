// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { token } = useAuth();

  if (!token) {
    // Se não há token, redireciona para a página de login
    return <Navigate to="/login" replace />;
  }

  return children; // Se há token, renderiza o componente filho (a página protegida)
}

export default ProtectedRoute;