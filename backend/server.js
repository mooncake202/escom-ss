const redis = require('./src/lib/redis');
// Conexión explícita al arrancar — con lazyConnect:true (ver lib/redis.js),
// el servidor real debe seguir "caliente" desde el inicio; los scripts
// sueltos que solo requieren este módulo transitivamente (sin llamar esto)
// nunca abren la conexión y por eso terminan solos.
redis.connect().catch((err) => console.error('Error al conectar a Redis en el arranque:', err.message));
const http = require("http");
const express = require("express");
const cors = require("cors");

const ofertasRoutes = require("./routes/ofertas");
const registroRoutes = require("./routes/registro");
const periodosRoutes = require("./routes/fechas_periodo");
const loginRoute = require("./routes/login");
const alumnoRoutes = require("./routes/alumno");
const profesorRoutes = require("./routes/profesor");




const app = express();

app.set('trust proxy', true);

// exposedHeaders: sin esto, el navegador SÍ recibe el header
// Content-Disposition en la respuesta, pero JavaScript (fetch) no puede
// leerlo en peticiones cross-origin — no está en la lista de headers
// "safelisted" por CORS. Bug real encontrado: las descargas de expediente
// LSS ponían el nombre real en Content-Disposition pero el frontend nunca
// podía leerlo, y terminaba guardando el archivo con un nombre genérico.
app.use(cors({ exposedHeaders: ['Content-Disposition'] }));
app.use(express.json());

//app.use("/api/ofertas", ofertasRoutes);
//app.use("/api/registro", registroRoutes);
//app.use("/api/periodos", periodosRoutes);
//app.use("/api/login", loginRoute);
//app.use("/api/alumno", alumnoRoutes);
//app.use("/api/profesor", profesorRoutes);


//login CRED 01
app.use('/auth', require('./src/modules/auth/auth.routes'));

//crear usuario CRED 03
app.use('/usuarios', require('./src/modules/usuarios/usuarios.routes'));
app.use('/caracteristicas', require('./src/modules/caracteristicas/caracteristicas.routes'));
app.use('/perfil', require('./src/modules/perfil/perfil.routes'));

//cambiar contraseña CRED 02
app.use('/password', require('./src/modules/password/password.routes'));

// http.createServer(app) en vez de app.listen directo — necesario para que
// socket.io se adjunte al MISMO servidor HTTP, no un puerto/proceso aparte.
const httpServer = http.createServer(app);

httpServer.listen(3000,()=>{
console.log("Servidor corriendo en http://localhost:3000");
});

// Socket.io — infraestructura base (sin eventos de negocio conectados
// todavía), mismo criterio visible que ya se usó para el cron.
const { inicializarSocketServer } = require('./src/sockets/socket.server');
inicializarSocketServer(httpServer);

//dashboard
app.use('/notificaciones', require('./src/modules/notificaciones/notificaciones.routes'));
app.use('/dashboard', require('./src/modules/dashboard/dashboard.routes'));


//GR01
app.use('/registro', require('./src/modules/gr/gr.routes'));
app.use('/ofertas', require('./src/modules/ofertas/ofertas.routes'));
app.use('/periodos', require('./src/modules/periodos/periodos.routes'));


//GR02
app.use('/profesor', require('./src/modules/gr/gr-profesor.routes'));

//AH01
app.use('/profesor', require('./src/modules/ah/ah.routes'));

//AH02
app.use('/alumno', require('./src/modules/ah/ah-alumno.routes'));

//REP01 — Reportes mensuales (alumno_asignado)
app.use('/reportes', require('./src/modules/reportes/reportes-alumno.routes'));

//REP05 — Reportes (profesor): listado, detalle, PDF, rechazar, aprobar y rúbrica
app.use('/profesor', require('./src/modules/reportes/reportes-profesor.routes'));

//REP06 — Reportes (coordinador): listado, detalle, PDF, rechazar y aprobar (validación con sello del prototipo)
app.use('/coordinador', require('./src/modules/reportes/reportes-coordinacion.routes'));

//ADM08 — Calendario institucional (lectura: todos los roles; escritura: coordinador)
app.use('/calendario', require('./src/modules/administrativa/calendario/calendario.routes'));

//ADM15/ADM16 — Solicitudes de modificación de características (profesor solicita, coordinación resuelve)
app.use('/solicitudes-caracteristicas', require('./src/modules/administrativa/caracteristicas/caracteristicas.routes'));

//ADM09/ADM11/ADM12 — Bajas del servicio social (profesor o alumno solicitan, coordinación resuelve)
app.use('/bajas', require('./src/modules/administrativa/bajas/bajas.routes'));

//ADM01/ADM03/ADM17 — Directorio: profesor y equipo del alumno; usuarios asignados (profesor/coordinación)
app.use('/directorio', require('./src/modules/administrativa/directorio/directorio.routes'));

//ADM02/ADM07 — Anuncios (comunicación manual; distinto de `notificacion`)
app.use('/anuncios', require('./src/modules/administrativa/anuncios/anuncios.routes'));

//ADM13/ADM14 — Expediente documental histórico (consulta) y carta compromiso firmada
app.use('/documentos', require('./src/modules/administrativa/documentos/documentos.routes'));

//ADM05 — Recursos del proceso de registro (coordinación administra, alumnos consultan)
app.use('/recursos', require('./src/modules/administrativa/recursos/recursos.routes'));

//ADM06 — Contacto institucional (coordinación administra, alumno asignado consulta)
app.use('/contacto-institucional', require('./src/modules/administrativa/contacto/contacto.routes'));

//LSS01/02
app.use('/alumno', require('./src/modules/lss/lss-alumno.routes'));

//LSS03
app.use('/profesor', require('./src/modules/lss/lss-profesor.routes'));

//LSS04
app.use('/coordinador', require('./src/modules/lss/lss-coordinador.routes'));

// Cron de vencimiento de actividades (AH02) — arranque explícito y visible
// junto con el resto de los módulos AH, no oculto dentro de otro archivo.
const { iniciarCronVencimientoActividades, iniciarCronsBitacora } = require('./src/modules/ah/ah.cron');
iniciarCronVencimientoActividades();

// Crons de bitácora (AH03) — auto-cierre de jornadas abandonadas (cada 15
// min) y contabilización nocturna de faltas (06:00 UTC = medianoche México).
iniciarCronsBitacora();

//gr07
app.use('/coordinador', require('./src/modules/gr/gr-coordinador.routes'));

// CU-AH-05 — coordinador consulta acumulado de horas (primer actor
// coordinador del módulo ah/). Mismo prefijo que gr-coordinador.routes.js.
app.use('/coordinador', require('./src/modules/ah/ah-coordinador.routes'));

//GR — Cron de vencimiento (Reloj 1 / Reloj 2) — arranque explícito y
// visible, mismo criterio que el cron de AH.
const { inicializarCronGR } = require('./src/modules/gr/gr.cron');
inicializarCronGR();