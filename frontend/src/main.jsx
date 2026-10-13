import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import SesionProvider from './components/SesionProvider.jsx'
import './index.css'
import App from './App.jsx'
import './TemaOscuro.css'
import './pages/Noche.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SesionProvider>
        <App />
      </SesionProvider>
    </BrowserRouter>
  </StrictMode>,
)
