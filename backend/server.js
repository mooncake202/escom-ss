const express = require("express");
const cors = require("cors");

const ofertasRoutes = require("./routes/ofertas");
const registroRoutes = require("./routes/registro");
const periodosRoutes = require("./routes/fechas_periodo");
const loginRoute = require("./routes/login");
const alumnoRoutes = require("./routes/alumno");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/ofertas", ofertasRoutes);
app.use("/registro", registroRoutes);
app.use("/periodos", periodosRoutes);
app.use("/login", loginRoute);
app.use("/alumno", alumnoRoutes);


app.listen(3000,()=>{
console.log("Servidor corriendo en http://localhost:3000");
});