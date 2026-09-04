require('./src/lib/redis');
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
app.use("/api/periodos", periodosRoutes);
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

app.listen(3000,()=>{
console.log("Servidor corriendo en http://localhost:3000");
});

//dashboard
app.use('/notificaciones', require('./src/modules/notificaciones/notificaciones.routes'));
app.use('/dashboard', require('./src/modules/dashboard/dashboard.routes'));