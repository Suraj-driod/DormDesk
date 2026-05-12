import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from "./auth/AuthContext";
import { Toaster } from 'sonner';

createRoot(document.getElementById('root')).render(
  <StrictMode>
        <AuthProvider>
          <Toaster
            position="top-right"
            expand={false}
            closeButton
            toastOptions={{
              duration: 5000,
              style: {
                fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                borderRadius: '16px',
                padding: '14px 18px',
                fontSize: '14px',
                fontWeight: 500,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(124, 243, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 229, 255, 0.15), 0 2px 8px rgba(0, 0, 0, 0.08)',
                background: 'rgba(255, 255, 255, 0.85)',
                color: '#2C3E50',
              },
              classNames: {
                closeButton: 'dormdesk-toast-close',
              },
            }}
            theme="light"
          />
          <App />
        </AuthProvider>
  </StrictMode>,
)
