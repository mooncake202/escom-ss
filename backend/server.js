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

app.use(cors());
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

// Cron de vencimiento de actividades (AH02) — arranque explícito y visible
// junto con el resto de los módulos AH, no oculto dentro de otro archivo.
const { iniciarCronVencimientoActividades, iniciarCronsBitacora } = require('./src/modules/ah/ah.cron');
iniciarCronVencimientoActividades();

// Crons de bitácora (AH03) — auto-cierre de jornadas abandonadas (cada 15
// min) y contabilización nocturna de faltas (06:00 UTC = medianoche México).
iniciarCronsBitacora();

//gr07
app.use('/coordinador', require('./src/modules/gr/gr-coordinador.routes'));

//GR — Cron de vencimiento (Reloj 1 / Reloj 2) — arranque explícito y
// visible, mismo criterio que el cron de AH.
const { inicializarCronGR } = require('./src/modules/gr/gr.cron');
inicializarCronGR();