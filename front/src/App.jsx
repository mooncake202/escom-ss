import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from './features/dashboard/dashboards'

//CRED
import LoginPage from "./features/login/LoginPage";
import RecuperarContraseña from "./features/login/CU-CRED-02-cambiar-contraseña/RecuperarContrasena";
import CrearUsuario from "./features/login/CU-CRED-03-crear-usuarios/RegistroProfesores";


//GR
import RegistroSolicitud from './features/gestion-registro/CU-GR-01-enviar-solicitud/RegistroSolicitud'
import SolicitudesPendientes from './features/gestion-registro/CU-GR-02-aceptar-rechazar-alumno/SolicitudesPendientes'
import RegistroSISS from './features/gestion-registro/CU-GR-03-registro-siss/RegistroSISS'
import AdjuntarDocumentacion from './features/gestion-registro/CU-GR-04-adjuntar-documentacion/AdjuntarDocumentacion'
import EsperandoValidacionDocs from './features/gestion-registro/CU-GR-04-adjuntar-documentacion/EsperandoValidacionDocs'
import RevisarDocumentacion from './features/gestion-registro/CU-GR-05-revisar-documentacion/RevisarDocumentacion'
import CartaCompromiso from './features/gestion-registro/CU-GR-06-carta-compromiso/CartaCompromiso'
import ValidarEntregaPresencial from './features/gestion-registro/CU-GR-07-validar-entrega-presencial/ValidarEntregaPresencial'
import SubirExpediente from './features/gestion-registro/CU-GR-08-subir-expediente/SubirExpediente'
import RevisarExpediente from './features/gestion-registro/CU-GR-09-revisar-expediente/RevisarExpediente'
import EsperandoProfesor from './features/gestion-registro/CU-GR-01-enviar-solicitud/EsperandoProfesor'
import EsperandoValidacionCarta from './features/gestion-registro/CU-GR-06-carta-compromiso/EsperaEntregaCartaCompromiso'
import EsperaRevisionExpediente from './features/gestion-registro/CU-GR-08-subir-expediente/EsperaRevisionExpediente'
import ModificarSolicitud from './features/gestion-registro/CU-GR-13-MODIFICAR-SOLICITUD/ModificarSolicitud'




//AH
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


//LSS
import IniciarProcesoEvaluacion from './features/liberacion-ss/CU-LSS-01-Iniciar-proceso-evaluacion-desempeño/ValidacionRequisitos'

import SeguimientoEvaluacionAlumno from './features/liberacion-ss/CU-LSS-02-seguimiento-evaluacion-alumno/SeguimientoEvaluacionAlumno'
import EvaluarAlumnoProfesor from './features/liberacion-ss/CU-LSS-03-evaluar-alumno-profesor/EvaluarAlumnoProfesor';
import RevisarEvaluacionAlumnoCoordinacion from './features/liberacion-ss/CU-LSS-04-revisar-evaluacion-coordinacion/FirmarEvaluacionCoordinacion';

import SeguimientoCartaTerminoAlumno from './features/liberacion-ss/CU-LSS-05-seguimiento-carta-termino-alumno/SeguimientoCartaTerminoAlumno'
import EstadoCartaTerminoCoordinacion from './features/liberacion-ss/CU-LSS-06-estado-carta-termino-coordinacion/EstadoCartaTerminoCoordinacion'

import IntegracionExpediente from './features/liberacion-ss/CU-LSS-07-integracion-expediente/IntegracionExpediente'

import EstadoResolucion from './features/liberacion-ss/CU-LSS-08-estado-resolusion-alumno/EstadoResolucionAlumno'
import EvaluacionExpediente from './features/liberacion-ss/CU-LSS-09-evaluacion-expediente-coordinacion/EvaluacionExpedienteCoordinacion'

import ConsultarEstadoConstanciaTermino from './features/liberacion-ss/CU-LSS-10-estado-constancia-termino-alumno/ConsultarConstanciaTermino'
import GestionEstadoConstanciaTermino from './features/liberacion-ss/CU-LSS-11-envio-constancia-termino-coordinacion/GestionarConstanciaTermino'  

//ADMIN
import CartaCompromisoFirmada from './features/gestion-admin/001- enviar-carta-firmada/CartaCompromisofirmada'
import DocumentosAlumnosAsignados from './features/gestion-admin/002-docuemtnos-alumnos/ExpedienteAlumno'
import DocumentosAlumnosAsignadosCoordinacion from './features/gestion-admin/002-docuemtnos-alumnos/ExpedienteCoordinacion'
import GestionFaltas from './features/gestion-admin/003-gestion incidentes/GestionIncidencias'



function App() {
  return (
    <BrowserRouter>
      <Routes>
        -- dashboard --
        <Route path="/dashboard" element={<Dashboard />} />

        --CRED
        <Route path="/" element={<LoginPage />} />
        <Route path="/recuperar-contraseña" element={<RecuperarContraseña />} />
        <Route path="/crear-usuario" element={<CrearUsuario />} />

        -- rutas REGISTRO--
        
        <Route path="/registro" element={<RegistroSolicitud />} />
        <Route path="/alumnoSinAsignar/esperando_profesor" element={<EsperandoProfesor />} />
        <Route path="/profesor/solicitudes" element={<SolicitudesPendientes />} />
        <Route path="/alumnoSinAsignar/siss" element={<RegistroSISS />} />
        <Route path="/alumnoSinAsignar/documentacion" element={<AdjuntarDocumentacion />} />
        <Route path="/alumnoSinAsignar/esperando_validacion_docs" element={<EsperandoValidacionDocs />} />
        <Route path="/coordinacion/documentacion" element={<RevisarDocumentacion />} />
        <Route path="/alumnoSinAsignar/carta-compromiso" element={<CartaCompromiso />} />
        <Route path="/alumnoSinAsignar/esperando-validacion" element={<EsperandoValidacionCarta />} />
        <Route path="/coordinacion/carta-presencial" element={<ValidarEntregaPresencial />} />
        <Route path="/alumnoSinAsignar/expediente" element={<SubirExpediente />} />
        <Route path="/alumnoSinAsignar/estado-expediente" element={<EsperaRevisionExpediente />} />
        <Route path="/coordinacion/expedientes" element={<RevisarExpediente />} />
        <Route path="/alumnoSinAsignar/modificar-solicitud" element={<ModificarSolicitud />} />


        -- rutas ACTIVIDADES--
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

        
        
        --LSS--
        <Route path="/alumno/iniciar-proceso-evaluacion"    element={<IniciarProcesoEvaluacion rol="alumno" />} />

        <Route path="/alumno/seguimiento-evaluacion"    element={<SeguimientoEvaluacionAlumno rol="alumno" />} />
        <Route path="/profesor/evaluar-alumno"    element={<EvaluarAlumnoProfesor rol="profesor" />} />
        <Route path="/coordinacion/revisar-evaluacion-alumno"    element={<RevisarEvaluacionAlumnoCoordinacion rol="coordinacion" />} />

        <Route path="/alumno/seguimiento-carta-termino"    element={<SeguimientoCartaTerminoAlumno rol="alumno" />} />
        <Route path="/coordinacion/estado-carta-termino"    element={<EstadoCartaTerminoCoordinacion rol="coordinacion" />} />
        
        <Route path="/alumno/integracion-expediente"    element={<IntegracionExpediente rol="alumno" />} />


        <Route path="/alumno/estado-resolucion"    element={<EstadoResolucion rol="alumno" />} />
        <Route path="/coordinacion/evaluacion-expediente"    element={<EvaluacionExpediente rol="coordinacion" />} />

        <Route path="/alumno/consultar-constancia-termino"    element={<ConsultarEstadoConstanciaTermino rol="alumno" />} />
        <Route path="/coordinacion/gestion-constancia-termino"    element={<GestionEstadoConstanciaTermino rol="coordinacion" />} />
        
        
        --ADMIN--
        <Route path="/cartacompromisofirmada" element={<CartaCompromisoFirmada />} />
        <Route path="/alumnoasignado-documentacion" element={<DocumentosAlumnosAsignados />} />
        <Route path="/coordinación-alumnoasignado-documentacion" element={<DocumentosAlumnosAsignadosCoordinacion />} />
        <Route path="/gestion-faltas" element={<GestionFaltas />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
