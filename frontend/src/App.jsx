import { Navigate, Route, Routes, useLocation } from 'react-router'
import InstalarApp from './components/InstalarApp.jsx'
import PanelShell from './components/PanelShell.jsx'
import Layout from './components/Layout.jsx'
import PhishGuardAcceso from './components/PhishGuardAcceso.jsx'
import RutaPrivada from './components/RutaPrivada.jsx'
import AppShell from './components/AppShell.jsx'
import { esAppNativa } from './lib/esAppNativa.js'
import { destinoPanel, destinoSafeLink } from './lib/safelinkApp.js'
import PerfilApp, { PerfilSeccionApp } from './pages/PerfilApp.jsx'
import PhishGuard from './pages/PhishGuard.jsx'
import SafeLink from './pages/SafeLink.jsx'
import Inicio from './pages/Inicio.jsx'
import Landing from './pages/Landing.jsx'
import Empresas from './pages/Empresas.jsx'
import Adquirir from './pages/Adquirir.jsx'
import AdquirirVuelta from './pages/AdquirirVuelta.jsx'
import Personas from './pages/Personas.jsx'
import Privacidad from './pages/Privacidad.jsx'
import Terminos from './pages/Terminos.jsx'
import Funcion from './pages/Funcion.jsx'
import Contacto from './pages/Contacto.jsx'
import Ingresar from './pages/Ingresar.jsx'
import Panel, { PanelHistorial } from './pages/Panel.jsx'
import PanelQr from './pages/PanelQr.jsx'
import Compartido from './pages/Compartido.jsx'
import PanelEmpresa from './pages/PanelEmpresa.jsx'
import PanelCampanas from './pages/PanelCampanas.jsx'
import PanelTablero from './pages/PanelTablero.jsx'
import PanelInforme from './pages/PanelInforme.jsx'
import PanelPerfil from './pages/PanelPerfil.jsx'
import Simulacion from './pages/Simulacion.jsx'
import MetaPagina from './components/MetaPagina.jsx'
import Reconocimiento from './pages/Reconocimiento.jsx'

function MarcoApp() {
  if (!esAppNativa()) return <Navigate to="/" replace />
  return <AppShell />
}

function AlSafeLink() {
  const { search } = useLocation()
  return <Navigate to={destinoSafeLink(search)} replace />
}

function AlPanel() {
  const { search } = useLocation()
  return <Navigate to={destinoPanel(search)} replace />
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
      <MetaPagina />
      <Routes>
      <Route path="simulacion/:token" element={<Simulacion />} />
      <Route path="bien/:token" element={<Reconocimiento />} />
      <Route index element={<Entrada />} />
      <Route element={<MarcoApp />}>
        <Route path="phishguard" element={<PhishGuard />} />
        <Route path="safelink" element={<SafeLink />} />
        <Route element={<PhishGuardAcceso />}>
          <Route path="phishguard/empresa" element={<PanelEmpresa />} />
          <Route path="phishguard/campanas" element={<PanelCampanas />} />
          <Route path="phishguard/tablero" element={<PanelTablero />} />
          <Route path="phishguard/informe" element={<PanelInforme />} />
        </Route>
        <Route element={<RutaPrivada />}>
          <Route path="perfil" element={<PerfilApp />} />
          <Route path="perfil/:seccion" element={<PerfilSeccionApp />} />
          <Route path="safelink/enlaces" element={<AlSafeLink />} />
          <Route path="safelink/whatsapp" element={<AlSafeLink />} />
          <Route path="safelink/pdf" element={<AlSafeLink />} />
          <Route path="safelink/correo" element={<AlSafeLink />} />
          <Route path="safelink/qr" element={<PanelQr />} />
        </Route>
      </Route>
      <Route path="empresas" element={<Empresas />} />
      <Route path="adquirir" element={<Adquirir />} />
      <Route path="adquirir/vuelta" element={<AdquirirVuelta />} />
      <Route path="personas" element={<Personas />} />
      <Route path="privacidad" element={<Privacidad />} />
      <Route path="terminos" element={<Terminos />} />
      <Route path="funcion/:id" element={<Funcion />} />
      <Route path="contacto" element={<Contacto />} />
      <Route path="ingresar" element={<Ingresar />} />

      <Route element={<PanelShell />}>
        <Route path="panel" element={<RutaPrivada />}>
          <Route index element={<Panel />} />
          <Route path="historial" element={<PanelHistorial />} />
          <Route path="enlaces" element={<AlPanel />} />
          <Route path="whatsapp" element={<AlPanel />} />
          <Route path="pdf" element={<AlPanel />} />
          <Route path="correo" element={<AlPanel />} />
          <Route path="qr" element={<PanelQr />} />
          <Route element={<PhishGuardAcceso />}>
            <Route path="empresa" element={<PanelEmpresa />} />
            <Route path="campanas" element={<PanelCampanas />} />
            <Route path="tablero" element={<PanelTablero />} />
            <Route path="informe" element={<PanelInforme />} />
          </Route>
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
