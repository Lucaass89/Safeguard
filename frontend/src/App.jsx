import { Navigate, Route, Routes } from 'react-router'
import PanelShell from './components/PanelShell.jsx'
import Layout from './components/Layout.jsx'
import RutaPrivada from './components/RutaPrivada.jsx'
import Landing from './pages/Landing.jsx'
import Empresas from './pages/Empresas.jsx'
import Personas from './pages/Personas.jsx'
import Privacidad from './pages/Privacidad.jsx'
import Contacto from './pages/Contacto.jsx'
import Ingresar from './pages/Ingresar.jsx'
import Panel from './pages/Panel.jsx'
import PanelEnlaces from './pages/PanelEnlaces.jsx'
import PanelWhatsapp from './pages/PanelWhatsapp.jsx'
import PanelPdf from './pages/PanelPdf.jsx'
import PanelCorreo from './pages/PanelCorreo.jsx'
import Compartido from './pages/Compartido.jsx'
import PanelEmpresa from './pages/PanelEmpresa.jsx'
import PanelCampanas from './pages/PanelCampanas.jsx'
import PanelDarkconsole from './pages/PanelDarkconsole.jsx'
import PanelTablero from './pages/PanelTablero.jsx'
import PanelPerfil from './pages/PanelPerfil.jsx'
import Simulacion from './pages/Simulacion.jsx'
import Reconocimiento from './pages/Reconocimiento.jsx'

function App() {
  return (
    <Routes>
      <Route path="simulacion/:token" element={<Simulacion />} />
      <Route path="bien/:token" element={<Reconocimiento />} />
      <Route index element={<Landing />} />
      <Route path="empresas" element={<Empresas />} />
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
          <Route path="empresa" element={<PanelEmpresa />} />
          <Route path="campanas" element={<PanelCampanas />} />
          <Route path="darkconsole" element={<PanelDarkconsole />} />
          <Route path="tablero" element={<PanelTablero />} />
          <Route path="perfil" element={<PanelPerfil />} />
        </Route>
      </Route>

      <Route element={<Layout />}>
        <Route path="c/:token" element={<Compartido />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
