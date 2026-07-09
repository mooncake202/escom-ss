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
import ContactoProfesor from './features/gestion-administrativa/CU-ADM-01-contacto-profesor/ContactoProfesor'
import GestionarRecursos from './features/gestion-administrativa/CU-ADM-05-gestionar-recursos/GestionarRecursos'
import PublicarAnuncios from './features/gestion-administrativa/CU-ADM-07-publicar-anuncios/PublicarAnuncios'
import AnunciosSistema from './features/gestion-administrativa/CU-ADM-02-anuncios/AnunciosSistema'
import ContactoInstitucional from './features/gestion-administrativa/CU-ADM-06-contacto-institucional/ContactoInstitucional'
import ActualizarDatos from './features/gestion-administrativa/CU-ADM-04-actualizar-datos/ActualizarDatos'
import CalendarioInstitucional from './features/gestion-administrativa/CU-ADM-08-calendario/CalendarioInstitucional'
import SolicitarBajaAlumno from './features/gestion-administrativa/CU-ADM-09-profesor-solicitar-baja/SolicitarBajaAlumno'
import BajaServicioSocial from './features/gestion-administrativa/CU-ADM-11-alumno-solicitar-baja/BajaServicioSocial'
import ActualizarDatosProfesor from './features/gestion-administrativa/CU-ADM-10-profesor-actualizar-datos/ActualizarDatosProfesor'
import GestionarBajas                     from './features/gestion-administrativa/CU-ADM-12-gestionar-bajas/GestionarBajas'
import SolicitarModificacionCaracteristicas from './features/gestion-administrativa/CU-ADM-15-solicitar-modificacion-caracteristicas/SolicitarModificacionCaracteristicas'
import RevisarSolicitudesCaracteristicas    from './features/gestion-administrativa/CU-ADM-16-revisar-solicitudes-caracteristicas/RevisarSolicitudesCaracteristicas'
import ConsultarUsuariosAsignados          from './features/gestion-administrativa/CU-ADM-17-consultar-usuarios-asignados/ConsultarUsuariosAsignados'
import GenerarReporte  from './features/gestion-reportes/CU-REP-01-generar-reporte/GenerarReporte'
import HistorialReportes from './features/gestion-reportes/CU-REP-03-historial-reportes/HistorialReportes'
import ConsultarEstatusReporte from './features/gestion-reportes/CU-REP-02-consultar-estatus-reporte/ConsultarEstatusReporte'
import ModificarReenviarReporte from './features/gestion-reportes/CU-REP-04-modificar-reenviar-reporte/ModificarReenviarReporte'
import RevisarReportes from './features/gestion-reportes/CU-REP-05-revisar-reportes-profesor/RevisarReportes'
import ValidarReportes         from "@/features/gestion-reportes/CU-REP-06-revisar-reportes-coordinacion/ValidarReportes";
import GenerarReporteGlobal   from "@/features/gestion-reportes/CU-REP-07-generar-reporte-global/GenerarReporteGlobal";
import HistorialOfertas        from './features/gestion-ofertas/CU-PRO-05-historial-ofertas/HistorialOfertas'
import SolicitarRegistroOferta from './features/gestion-ofertas/CU-PRO-01-solicitar-registro-oferta/SolicitarRegistroOferta'
import SolicitarOfertaIndividual from './features/gestion-ofertas/CU-PRO-01-solicitar-registro-oferta/SolicitarOfertaIndividual'
import ConsultarOfertas        from './features/gestion-ofertas/CU-PRO-03-consultar-ofertas/ConsultarOfertas'
import Dashboards from './features/dashboards'

//import ContactoEquipo from './features/gestion-administrativa/CU-ADM-03-contacto-equipo/ContactoEquipo'



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/registro" element={<RegistroSolicitud />} />
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
        <Route path="/alumno/contacto-profesor" element={<ContactoProfesor />} />
        <Route path="/coordinacion/admin/recursos" element={<GestionarRecursos />} />
        <Route path="/coordinacion/admin/anuncios" element={<PublicarAnuncios rol="coordinacion" />} />
        <Route path="/profesor/anuncios" element={<PublicarAnuncios rol="profesor" />} />
        <Route path="/alumno/anuncios" element={<AnunciosSistema />} />
        <Route path="/alumno/datos" element={<ActualizarDatos />} />
        <Route path="/coordinacion/calendario" element={<CalendarioInstitucional />} />
        <Route path="/profesor/solicitar-baja-alumno" element={<SolicitarBajaAlumno />} />
        <Route path="/alumno/solicitar-baja" element={<BajaServicioSocial />} />
        <Route path="/profesor/datos-personales" element={<ActualizarDatosProfesor />} />
        <Route path="/profesor/reportes" element={<RevisarReportes />} />
        <Route path="/alumno/contacto-institucional"       element={<ContactoInstitucional rol="alumno" />} />
        <Route path="/profesor/contacto-institucional"     element={<ContactoInstitucional rol="profesor" />} />
        <Route path="/coordinacion/gestionar-bajas"          element={<GestionarBajas />} />
        <Route path="/profesor/solicitar-modificacion"          element={<SolicitarModificacionCaracteristicas />} />
        <Route path="/coordinacion/solicitudes-caracteristicas" element={<RevisarSolicitudesCaracteristicas />} />
        <Route path="/profesor/mis-alumnos"                    element={<ConsultarUsuariosAsignados rol="profesor" />} />
        <Route path="/coordinacion/usuarios-asignados"         element={<ConsultarUsuariosAsignados rol="coordinacion" />} />
        
        <Route path="/dashboard" element={<Dashboards />} />
        <Route path="/alumno/reportes" element={<HistorialReportes />} />
        <Route path="/alumno/reportes/generar"  element={<GenerarReporte />} />
        <Route path="/alumno/reportes/estatus"  element={<ConsultarEstatusReporte />} />
        <Route path="/alumno/reportes/modificar" element={<ModificarReenviarReporte />} />
        <Route path="/alumno/reportes/global"   element={<GenerarReporteGlobal />} />
        <Route path="/coordinacion/reportes"    element={<ValidarReportes />} />
        
        
        
        <Route path="/coordinacion/contacto-institucional" element={<ContactoInstitucional rol="coordinacion" />} />
        <Route path="/profesor/proyectos" element={<HistorialOfertas />} />
        <Route path="/profesor/proyectos/registrar" element={<SolicitarRegistroOferta />} />
        <Route path="/profesor/proyectos/individual" element={<SolicitarOfertaIndividual />} />
        <Route path="/coordinacion/ofertas" element={<ConsultarOfertas />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
