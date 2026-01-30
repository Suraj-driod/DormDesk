import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { LayoutWrapper } from "./pages"; 
import { AuthProvider } from "./auth/AuthContext";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    
      <LayoutWrapper>
        <AuthProvider>
          <App />
        </AuthProvider>
      </LayoutWrapper>
    
  </StrictMode>,
)
