// src/main.jsx

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'; // 1. Importe o BrowserRouter
import { AuthProvider } from './context/AuthContext.jsx'; // 1. Importe o AuthProvider


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 2. Envolva o <App /> com o <BrowserRouter> */}
    <BrowserRouter>
          <AuthProvider> {/* 2. Envolva o App com o AuthProvider */}
      <App />
            </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)