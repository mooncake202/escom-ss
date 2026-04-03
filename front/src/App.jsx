import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import RegistroSolicitud from './features/gestion-registro/CU-GR-01-enviar-solicitud/RegistroSolicitud'
import LoginPage from "./features/login/LoginPage";
import SolicitudesPendientes from './features/gestion-registro/CU-GR-02-aceptar-rechazar-alumno/SolicitudesPendientes'
import RegistroSISS from './features/gestion-registro/CU-GR-03-registro-siss/RegistroSISS'
import AdjuntarDocumentacion from './features/gestion-registro/CU-GR-04-adjuntar-documentacion/AdjuntarDocumentacion'
import RevisarDocumentacion from './features/gestion-registro/CU-GR-05-revisar-documentacion/RevisarDocumentacion'
import CartaCompromiso from './features/gestion-registro/CU-GR-06-carta-compromiso/CartaCompromiso'
import ValidarEntregaPresencial from './features/gestion-registro/CU-GR-07-validar-entrega-presencial/ValidarEntregaPresencial'
import SubirExpediente from './features/gestion-registro/CU-GR-08-subir-expediente/SubirExpediente'
import RevisarExpediente from './features/gestion-registro/CU-GR-09-revisar-expediente/RevisarExpediente'
import AsignarActividades from './features/gestion-actividades/CU-AH-01-asignar-actividades/AsignarActividades'
import ConsultarActividades from './features/gestion-actividades/CU-AH-02-consultar-actividades/ConsultarActividades'
import RegistrarBitacora from './features/gestion-actividades/CU-AH-03-registrar-bitacora/RegistrarBitacora'
import RevisarAvances from './features/gestion-actividades/CU-AH-04-revisar-avances/RevisarAvances'
import AcumuladoHoras from './features/gestion-actividades/CU-AH-05-acumulado-horas/AcumuladoHoras'
import HistorialActividades from './features/gestion-actividades/CU-AH-06-historial/HistorialActividades'

import EsperandoProfesor from './features/gestion-registro/CU-GR-01-enviar-solicitud/EsperandoProfesor'


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/registro" element={<RegistroSolicitud />} />
        <Route path="/alumnoSinAsignar/esperando_profesor" element={<EsperandoProfesor />} />
        <Route path="/profesor/solicitudes" element={<SolicitudesPendientes />} />
        <Route path="/alumnoSinAsignar/siss" element={<RegistroSISS />} />
        <Route path="/alumnoSinAsignar/documentacion" element={<AdjuntarDocumentacion />} />
        <Route path="/coordinacion/documentacion" element={<RevisarDocumentacion />} />
        <Route path="/alumnoSinAsignar/carta-compromiso" element={<CartaCompromiso />} />
        <Route path="/coordinacion/carta-presencial" element={<ValidarEntregaPresencial />} />
        <Route path="/alumnoSinAsignar/expediente" element={<SubirExpediente />} />
        <Route path="/coordinacion/expedientes" element={<RevisarExpediente />} />
        <Route path="/profesor/actividades" element={<AsignarActividades />} />
        <Route path="/alumno/actividades" element={<ConsultarActividades />} />
        <Route path="/alumno/bitacora" element={<RegistrarBitacora />} />
        <Route path="/profesor/bitacoras" element={<RevisarAvances />} />
        <Route path="/alumno/horas"          element={<AcumuladoHoras rol="alumno" />} />
        <Route path="/profesor/horas"        element={<AcumuladoHoras rol="profesor" />} />
        <Route path="/coordinacion/horas"    element={<AcumuladoHoras rol="coordinacion" />} />
        <Route path="/alumno/historial"          element={<HistorialActividades rol="alumno" />} />
        <Route path="/profesor/historial"        element={<HistorialActividades rol="profesor" />} />
        <Route path="/coordinacion/historial"    element={<HistorialActividades rol="coordinacion" />} />



      </Routes>
    </BrowserRouter>
  );
}

export default App;
