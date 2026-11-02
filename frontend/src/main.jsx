import { StrictMode } from 'react'
import './lib/instalar.js'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import SesionProvider from './components/SesionProvider.jsx'
import './index.css'
import App from './App.jsx'
import { seguirSistema } from './lib/tema.js'
import './TemaOscuro.css'
import './pages/Noche.css'

seguirSistema()

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SesionProvider>
        <App />
      </SesionProvider>
    </BrowserRouter>
  </StrictMode>,
)
