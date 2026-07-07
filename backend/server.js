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

app.use("/api/ofertas", ofertasRoutes);
app.use("/api/registro", registroRoutes);
app.use("/api/periodos", periodosRoutes);
app.use("/api/login", loginRoute);
app.use("/api/alumno", alumnoRoutes);
app.use("/api/profesor", profesorRoutes);



app.listen(3000,()=>{
console.log("Servidor corriendo en http://localhost:3000");
});