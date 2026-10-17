import { Navigate, Route, Routes } from 'react-router'
import InstalarApp from './components/InstalarApp.jsx'
import PanelShell from './components/PanelShell.jsx'
import Layout from './components/Layout.jsx'
import RutaPrivada from './components/RutaPrivada.jsx'
import AppShell from './components/AppShell.jsx'
import { esAppNativa } from './lib/esAppNativa.js'
import DestinoApp from './pages/DestinoApp.jsx'
import Inicio from './pages/Inicio.jsx'
import Landing from './pages/Landing.jsx'
import Empresas from './pages/Empresas.jsx'
import Adquirir from './pages/Adquirir.jsx'
import AdquirirVuelta from './pages/AdquirirVuelta.jsx'
import Personas from './pages/Personas.jsx'
import Privacidad from './pages/Privacidad.jsx'
import Contacto from './pages/Contacto.jsx'
import Ingresar from './pages/Ingresar.jsx'
import Panel from './pages/Panel.jsx'
import PanelEnlaces from './pages/PanelEnlaces.jsx'
import PanelWhatsapp from './pages/PanelWhatsapp.jsx'
import PanelPdf from './pages/PanelPdf.jsx'
import PanelCorreo from './pages/PanelCorreo.jsx'
import PanelQr from './pages/PanelQr.jsx'
import Compartido from './pages/Compartido.jsx'
import PanelEmpresa from './pages/PanelEmpresa.jsx'
import PanelCampanas from './pages/PanelCampanas.jsx'
import PanelTablero from './pages/PanelTablero.jsx'
import PanelInforme from './pages/PanelInforme.jsx'
import PanelPerfil from './pages/PanelPerfil.jsx'
import Simulacion from './pages/Simulacion.jsx'
import Reconocimiento from './pages/Reconocimiento.jsx'

function MarcoApp() {
  if (!esAppNativa()) return <Navigate to="/" replace />
  return <AppShell />
}

function Entrada() {
  if (esAppNativa()) {
    return (
      <AppShell>
        <Inicio />
      </AppShell>
    )
  }
  return <Landing />
}

function App() {
  return (
    <>
      <Routes>
      <Route path="simulacion/:token" element={<Simulacion />} />
      <Route path="bien/:token" element={<Reconocimiento />} />
      <Route index element={<Entrada />} />
      <Route element={<MarcoApp />}>
        <Route path="phishguard" element={<DestinoApp id="phishguard" />} />
        <Route path="safelink" element={<DestinoApp id="safelink" />} />
        <Route path="perfil" element={<DestinoApp id="perfil" />} />
      </Route>
      <Route path="empresas" element={<Empresas />} />
      <Route path="adquirir" element={<Adquirir />} />
      <Route path="adquirir/vuelta" element={<AdquirirVuelta />} />
      <Route path="personas" element={<Personas />} />
      <Route path="privacidad" element={<Privacidad />} />
      <Route path="contacto" element={<Contacto />} />
      <Route path="ingresar" element={<Ingresar />} />

      <Route element={<PanelShell />}>
        <Route path="panel" element={<RutaPrivada />}>
          <Route index element={<Panel />} />
          <Route path="enlaces" element={<PanelEnlaces />} />
          <Route path="whatsapp" element={<PanelWhatsapp />} />
          <Route path="pdf" element={<PanelPdf />} />
          <Route path="correo" element={<PanelCorreo />} />
          <Route path="qr" element={<PanelQr />} />
          <Route path="empresa" element={<PanelEmpresa />} />
          <Route path="campanas" element={<PanelCampanas />} />
          <Route path="tablero" element={<PanelTablero />} />
          <Route path="informe" element={<PanelInforme />} />
          <Route path="perfil" element={<PanelPerfil />} />
        </Route>
      </Route>

      <Route element={<Layout />}>
        <Route path="c/:token" element={<Compartido />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
      </Routes>
      <InstalarApp />
    </>
  )
}

export default App
