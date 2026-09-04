import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from './features/dashboard/dashboards'
import { RutaProtegida } from './components/RutaProtegida'

//CRED
import { AvisoSesionExpirada } from './components/AvisoSesionExpirada';
import LoginPage from "./features/login/LoginPage";
import RecuperarContraseña from "./features/login/CU-CRED-02-cambiar-contraseña/RecuperarContrasena";
import EstablecerContrasena from "./features/login/CU-CRED-02-cambiar-contraseña/EstablecerContrasena";
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


// Roles usados en RutaProtegida — coinciden con el enum RolUsuario del backend.
const ALUMNO_ASIGNADO = ["alumno_asignado"];
const ALUMNO_SIN_ASIGNAR = ["alumno_sin_asignar"];
const PROFESOR = ["profesor"];
const COORDINADOR = ["coordinador"];

function App() {
  return (
    <BrowserRouter>
      <AvisoSesionExpirada />
      <Routes>
        
        <Route path="/dashboard" element={
          <RutaProtegida><Dashboard /></RutaProtegida>
        } />

        {/* --CRED */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/recuperar-contrasena" element={<RecuperarContraseña />} />
        <Route path="/establecer-contrasena/:token" element={<EstablecerContrasena />} />
        <Route path="/crear-usuario" element={
          <RutaProtegida roles={COORDINADOR}><CrearUsuario /></RutaProtegida>
        } />

        {/* --GR */}

        {/* SIN proteger a propósito: LoginPage la enlaza como "Regístrate
            aquí" para alguien que TODAVÍA no tiene cuenta. Si se protege,
            nadie nuevo podría registrarse.  */}
        <Route path="/registro" element={<RegistroSolicitud />} />

        <Route path="/alumnoSinAsignar/esperando_profesor" element={
          <RutaProtegida roles={ALUMNO_SIN_ASIGNAR}><EsperandoProfesor /></RutaProtegida>
        } />
        <Route path="/profesor/solicitudes" element={
          <RutaProtegida roles={PROFESOR}><SolicitudesPendientes /></RutaProtegida>
        } />
        <Route path="/alumnoSinAsignar/siss" element={
          <RutaProtegida roles={ALUMNO_SIN_ASIGNAR}><RegistroSISS /></RutaProtegida>
        } />
        <Route path="/alumnoSinAsignar/documentacion" element={
          <RutaProtegida roles={ALUMNO_SIN_ASIGNAR}><AdjuntarDocumentacion /></RutaProtegida>
        } />
        <Route path="/alumnoSinAsignar/esperando_validacion_docs" element={
          <RutaProtegida roles={ALUMNO_SIN_ASIGNAR}><EsperandoValidacionDocs /></RutaProtegida>
        } />
        <Route path="/coordinacion/documentacion" element={
          <RutaProtegida roles={COORDINADOR}><RevisarDocumentacion /></RutaProtegida>
        } />
        <Route path="/alumnoSinAsignar/carta-compromiso" element={
          <RutaProtegida roles={ALUMNO_SIN_ASIGNAR}><CartaCompromiso /></RutaProtegida>
        } />
        <Route path="/alumnoSinAsignar/esperando-validacion" element={
          <RutaProtegida roles={ALUMNO_SIN_ASIGNAR}><EsperandoValidacionCarta /></RutaProtegida>
        } />
        <Route path="/coordinacion/carta-presencial" element={
          <RutaProtegida roles={COORDINADOR}><ValidarEntregaPresencial /></RutaProtegida>
        } />
        <Route path="/alumnoSinAsignar/expediente" element={
          <RutaProtegida roles={ALUMNO_SIN_ASIGNAR}><SubirExpediente /></RutaProtegida>
        } />
        <Route path="/alumnoSinAsignar/estado-expediente" element={
          <RutaProtegida roles={ALUMNO_SIN_ASIGNAR}><EsperaRevisionExpediente /></RutaProtegida>
        } />
        <Route path="/coordinacion/expedientes" element={
          <RutaProtegida roles={COORDINADOR}><RevisarExpediente /></RutaProtegida>
        } />
        <Route path="/alumnoSinAsignar/modificar-solicitud" element={
          <RutaProtegida roles={ALUMNO_SIN_ASIGNAR}><ModificarSolicitud /></RutaProtegida>
        } />


        {/* --  AH-- */}
        <Route path="/profesor/actividades" element={
          <RutaProtegida roles={PROFESOR}><AsignarActividades /></RutaProtegida>
        } />
        <Route path="/alumno/actividades" element={
          <RutaProtegida roles={ALUMNO_ASIGNADO}><ConsultarActividades /></RutaProtegida>
        } />

        <Route path="/alumno/bitacora" element={
          <RutaProtegida roles={ALUMNO_ASIGNADO}><RegistrarBitacora /></RutaProtegida>
        } />
        <Route path="/profesor/bitacoras" element={
          <RutaProtegida roles={PROFESOR}><RevisarAvances /></RutaProtegida>
        } />

        <Route path="/alumno/horas" element={
          <RutaProtegida roles={ALUMNO_ASIGNADO}><AcumuladoHoras rol="alumno" /></RutaProtegida>
        } />
        <Route path="/profesor/horas" element={
          <RutaProtegida roles={PROFESOR}><AcumuladoHoras rol="profesor" /></RutaProtegida>
        } />
        <Route path="/coordinacion/horas" element={
          <RutaProtegida roles={COORDINADOR}><AcumuladoHoras rol="coordinacion" /></RutaProtegida>
        } />



      

        <Route path="/alumno/historial" element={
          <RutaProtegida roles={ALUMNO_ASIGNADO}><HistorialActividades rol="alumno" /></RutaProtegida>
        } />
        <Route path="/profesor/historial" element={
          <RutaProtegida roles={PROFESOR}><HistorialActividades rol="profesor" /></RutaProtegida>
        } />
        <Route path="/coordinacion/historial" element={
          <RutaProtegida roles={COORDINADOR}><HistorialActividades rol="coordinacion" /></RutaProtegida>
        } />

  {/* --  ADM-- */}
        <Route path="/alumno/contacto-profesor" element={
          <RutaProtegida roles={ALUMNO_ASIGNADO}><ContactoProfesor /></RutaProtegida>
        } />
        <Route path="/coordinacion/admin/recursos" element={
          <RutaProtegida roles={COORDINADOR}><GestionarRecursos /></RutaProtegida>
        } />
        <Route path="/coordinacion/admin/anuncios" element={
          <RutaProtegida roles={COORDINADOR}><PublicarAnuncios rol="coordinacion" /></RutaProtegida>
        } />
        <Route path="/profesor/anuncios" element={
          <RutaProtegida roles={PROFESOR}><PublicarAnuncios rol="profesor" /></RutaProtegida>
        } />
        <Route path="/alumno/anuncios" element={
          <RutaProtegida roles={ALUMNO_ASIGNADO}><AnunciosSistema /></RutaProtegida>
        } />
        <Route path="/alumno/datos" element={
          <RutaProtegida roles={ALUMNO_ASIGNADO}><ActualizarDatos /></RutaProtegida>
        } />
        <Route path="/coordinacion/calendario" element={
          <RutaProtegida roles={COORDINADOR}><CalendarioInstitucional /></RutaProtegida>
        } />
        <Route path="/profesor/solicitar-baja-alumno" element={
          <RutaProtegida roles={PROFESOR}><SolicitarBajaAlumno /></RutaProtegida>
        } />
        <Route path="/alumno/solicitar-baja" element={
          <RutaProtegida roles={ALUMNO_ASIGNADO}><BajaServicioSocial /></RutaProtegida>
        } />
        <Route path="/profesor/datos-personales" element={
          <RutaProtegida roles={PROFESOR}><ActualizarDatosProfesor /></RutaProtegida>
        } />
        <Route path="/profesor/reportes" element={
          <RutaProtegida roles={PROFESOR}><RevisarReportes /></RutaProtegida>
        } />
        <Route path="/alumno/contacto-institucional" element={
          <RutaProtegida roles={ALUMNO_ASIGNADO}><ContactoInstitucional rol="alumno" /></RutaProtegida>
        } />
        <Route path="/profesor/contacto-institucional" element={
          <RutaProtegida roles={PROFESOR}><ContactoInstitucional rol="profesor" /></RutaProtegida>
        } />
        <Route path="/coordinacion/gestionar-bajas" element={
          <RutaProtegida roles={COORDINADOR}><GestionarBajas /></RutaProtegida>
        } />
        <Route path="/profesor/solicitar-modificacion" element={
          <RutaProtegida roles={PROFESOR}><SolicitarModificacionCaracteristicas /></RutaProtegida>
        } />
        <Route path="/coordinacion/solicitudes-caracteristicas" element={
          <RutaProtegida roles={COORDINADOR}><RevisarSolicitudesCaracteristicas /></RutaProtegida>
        } />
        <Route path="/profesor/mis-alumnos" element={
          <RutaProtegida roles={PROFESOR}><ConsultarUsuariosAsignados rol="profesor" /></RutaProtegida>
        } />
        <Route path="/coordinacion/usuarios-asignados" element={
          <RutaProtegida roles={COORDINADOR}><ConsultarUsuariosAsignados rol="coordinacion" /></RutaProtegida>
        } />
        
        <Route path="/alumno/reportes" element={
          <RutaProtegida roles={ALUMNO_ASIGNADO}><HistorialReportes /></RutaProtegida>
        } />
        <Route path="/alumno/reportes/generar" element={
          <RutaProtegida roles={ALUMNO_ASIGNADO}><GenerarReporte /></RutaProtegida>
        } />
        <Route path="/alumno/reportes/estatus" element={
          <RutaProtegida roles={ALUMNO_ASIGNADO}><ConsultarEstatusReporte /></RutaProtegida>
        } />
        <Route path="/alumno/reportes/modificar" element={
          <RutaProtegida roles={ALUMNO_ASIGNADO}><ModificarReenviarReporte /></RutaProtegida>
        } />
        <Route path="/alumno/reportes/global" element={
          <RutaProtegida roles={ALUMNO_ASIGNADO}><GenerarReporteGlobal /></RutaProtegida>
        } />
        <Route path="/coordinacion/reportes" element={
          <RutaProtegida roles={COORDINADOR}><ValidarReportes /></RutaProtegida>
        } />



        <Route path="/coordinacion/contacto-institucional" element={
          <RutaProtegida roles={COORDINADOR}><ContactoInstitucional rol="coordinacion" /></RutaProtegida>
        } />


        {/* --PRO-- */}
        <Route path="/profesor/proyectos" element={
          <RutaProtegida roles={PROFESOR}><HistorialOfertas /></RutaProtegida>
        } />
        <Route path="/profesor/proyectos/registrar" element={
          <RutaProtegida roles={PROFESOR}><SolicitarRegistroOferta /></RutaProtegida>
        } />
        <Route path="/profesor/proyectos/individual" element={
          <RutaProtegida roles={PROFESOR}><SolicitarOfertaIndividual /></RutaProtegida>
        } />
        <Route path="/coordinacion/ofertas" element={
          <RutaProtegida roles={COORDINADOR}><ConsultarOfertas /></RutaProtegida>
        } />



        {/* --LSS-- */}
        <Route path="/alumno/iniciar-proceso-evaluacion" element={
          <RutaProtegida roles={ALUMNO_ASIGNADO}><IniciarProcesoEvaluacion rol="alumno" /></RutaProtegida>
        } />

        <Route path="/alumno/seguimiento-evaluacion" element={
          <RutaProtegida roles={ALUMNO_ASIGNADO}><SeguimientoEvaluacionAlumno rol="alumno" /></RutaProtegida>
        } />
        <Route path="/profesor/evaluar-alumno" element={
          <RutaProtegida roles={PROFESOR}><EvaluarAlumnoProfesor rol="profesor" /></RutaProtegida>
        } />
        <Route path="/coordinacion/revisar-evaluacion-alumno" element={
          <RutaProtegida roles={COORDINADOR}><RevisarEvaluacionAlumnoCoordinacion rol="coordinacion" /></RutaProtegida>
        } />

        <Route path="/alumno/seguimiento-carta-termino" element={
          <RutaProtegida roles={ALUMNO_ASIGNADO}><SeguimientoCartaTerminoAlumno rol="alumno" /></RutaProtegida>
        } />
        <Route path="/coordinacion/estado-carta-termino" element={
          <RutaProtegida roles={COORDINADOR}><EstadoCartaTerminoCoordinacion rol="coordinacion" /></RutaProtegida>
        } />

        <Route path="/alumno/integracion-expediente" element={
          <RutaProtegida roles={ALUMNO_ASIGNADO}><IntegracionExpediente rol="alumno" /></RutaProtegida>
        } />


        <Route path="/alumno/estado-resolucion" element={
          <RutaProtegida roles={ALUMNO_ASIGNADO}><EstadoResolucion rol="alumno" /></RutaProtegida>
        } />
        <Route path="/coordinacion/evaluacion-expediente" element={
          <RutaProtegida roles={COORDINADOR}><EvaluacionExpediente rol="coordinacion" /></RutaProtegida>
        } />

        <Route path="/alumno/consultar-constancia-termino" element={
          <RutaProtegida roles={ALUMNO_ASIGNADO}><ConsultarEstadoConstanciaTermino rol="alumno" /></RutaProtegida>
        } />
        <Route path="/coordinacion/gestion-constancia-termino" element={
          <RutaProtegida roles={COORDINADOR}><GestionEstadoConstanciaTermino rol="coordinacion" /></RutaProtegida>
        } />


        {/* --ADMIN-- */}
        {/* Estas 4 no tienen prefijo /alumno /profesor /coordinacion en la
            URL, así que no pude inferir el rol con certeza — las dejé solo
            con "requiere sesión" (sin restricción de rol). Ajusta roles={...}
            si sabes a quién le toca cada una. */}
        <Route path="/cartacompromisofirmada" element={
          <RutaProtegida><CartaCompromisoFirmada /></RutaProtegida>
        } />
        <Route path="/alumnoasignado-documentacion" element={
          <RutaProtegida><DocumentosAlumnosAsignados /></RutaProtegida>
        } />
        <Route path="/coordinación-alumnoasignado-documentacion" element={
          <RutaProtegida><DocumentosAlumnosAsignadosCoordinacion /></RutaProtegida>
        } />
        <Route path="/gestion-faltas" element={
          <RutaProtegida><GestionFaltas /></RutaProtegida>
        } />

      </Routes>
    </BrowserRouter>
  );
}

export default App;