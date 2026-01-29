import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { LayoutWrapper } from './pages/Wrapper/LayoutWrapper' 

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LayoutWrapper>
    <App />
    </LayoutWrapper>
  </StrictMode>,
)
