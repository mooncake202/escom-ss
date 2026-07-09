import {
  Document, Page, Text, View, Image, StyleSheet, Font,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: "40px 50px",
    color: "#000",
  },
  // Encabezado institucional
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerLogo: { width: 50, height: 50 },
  headerCenter: { flex: 1, textAlign: "center" },
  headerTitle: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  headerSubtitle: { fontSize: 9, marginTop: 2 },
  // Fecha
  fecha: { textAlign: "right", marginBottom: 12, fontSize: 10 },
  // Título del reporte
  tituloReporte: {
    textAlign: "center", fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6, textTransform: "uppercase",
  },
  periodoTexto: { textAlign: "left", fontSize: 10, marginBottom: 12 },
  // Datos del prestador
  tablaDatos: {
    border: "1px solid #000", marginBottom: 12,
  },
  tablaDatosHeader: {
    backgroundColor: "#f0f0f0", padding: "4px 8px",
    fontFamily: "Helvetica-Bold", fontSize: 10,
    textAlign: "center", borderBottom: "1px solid #000",
  },
  tablaDatosBody: { padding: "8px" },
  filaDatos: {
    flexDirection: "row", marginBottom: 4,
  },
  filaDatosCol: { flex: 1 },
  // Actividades
  actividadesLabel: {
    fontSize: 10, marginBottom: 6,
  },
  actividadItem: { fontSize: 10, marginBottom: 4, paddingLeft: 10 },
  // Firmas
  seccionFirmas: {
    flexDirection: "row", justifyContent: "space-between",
    marginTop: 40,
  },
  bloqueElabora: { width: "40%", alignItems: "center" },
  bloqueAutoriza: { width: "40%", alignItems: "center" },
  firmaImg: { width: 100, height: 50, objectFit: "contain", marginBottom: 4 },
  lineaFirma: { width: "100%", borderTop: "1px solid #000", marginBottom: 4 },
  firmaLabel: { fontSize: 9, textAlign: "center" },
  firmaName: { fontSize: 9, textAlign: "center", fontFamily: "Helvetica-Bold" },
  // Cuadros inferiores
  cuadrosInferiores: {
    flexDirection: "row", justifyContent: "space-between", marginTop: 20,
  },
  cuadroVacio: {
    width: "40%", height: 80,
    border: "1px solid #000",
  },
  cuadroSello: {
    width: "40%", height: 80,
    border: "1px solid #000",
    alignItems: "center", justifyContent: "center",
  },
  cuadroLabel: { fontSize: 8, textAlign: "center", marginTop: 4 },
});

export function ReportePDF({ datos }) {
  const {
    numeroReporte, fechaGeneracion, periodoTexto,
    alumno, actividades, firmaUrl,
  } = datos;

  // Parsear actividades en lista numerada
  const lineasActividades = actividades
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>

        {/* Encabezado institucional */}
        <View style={styles.header}>
          <View style={{ width: 50 }} />
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Instituto Politécnico Nacional</Text>
            <Text style={styles.headerTitle}>ESCUELA SUPERIOR DE CÓMPUTO</Text>
            <Text style={styles.headerSubtitle}>SUBDIRECCIÓN DE SERVICIOS EDUCATIVOS E INTEGRACIÓN SOCIAL</Text>
            <Text style={styles.headerSubtitle}>Departamento de Extensión y Apoyos Educativos.</Text>
          </View>
          <View style={{ width: 50 }} />
        </View>

        {/* Fecha */}
        <Text style={styles.fecha}>
          Ciudad de México a {fechaGeneracion}
        </Text>

        {/* Título */}
        <Text style={styles.tituloReporte}>
          REPORTE MENSUAL DE ACTIVIDADES No. {numeroReporte}
        </Text>

        {/* Periodo */}
        <Text style={styles.periodoTexto}>
          Correspondiente al periodo {periodoTexto}
        </Text>

        {/* Datos del prestador */}
        <View style={styles.tablaDatos}>
          <Text style={styles.tablaDatosHeader}>Datos del Prestador</Text>
          <View style={styles.tablaDatosBody}>
            <View style={styles.filaDatos}>
              <Text style={styles.filaDatosCol}>Nombre: {alumno.nombre}</Text>
            </View>
            <View style={styles.filaDatos}>
              <Text style={styles.filaDatosCol}>Boleta: {alumno.boleta}</Text>
              <Text style={styles.filaDatosCol}>Programa Académico: {alumno.carrera}</Text>
            </View>
            <View style={styles.filaDatos}>
              <Text style={styles.filaDatosCol}>Semestre: {alumno.semestre}</Text>
              <Text style={styles.filaDatosCol}>Teléfono Particular: {alumno.telefono}</Text>
            </View>
            <View style={styles.filaDatos}>
              <Text style={styles.filaDatosCol}>Correo electrónico: {alumno.correo}</Text>
            </View>
            <View style={styles.filaDatos}>
              <Text style={styles.filaDatosCol}>Prestatario: Escuela Superior de Cómputo</Text>
            </View>
          </View>
        </View>

        {/* Actividades */}
        <Text style={styles.actividadesLabel}>Actividades Realizadas.</Text>
        {lineasActividades.map((linea, i) => (
          <Text key={i} style={styles.actividadItem}>
            {i + 1}. {linea}
          </Text>
        ))}

        {/* Firmas */}
        <View style={styles.seccionFirmas}>
          <View style={styles.bloqueElabora}>
            {firmaUrl && (
              <Image src={firmaUrl} style={styles.firmaImg} />
            )}
            <View style={styles.lineaFirma} />
            <Text style={styles.firmaLabel}>Elaboró</Text>
            <Text style={styles.firmaName}>{alumno.nombre}</Text>
          </View>
          <View style={styles.bloqueAutoriza}>
            <View style={{ height: 50 }} />
            <View style={styles.lineaFirma} />
            <Text style={styles.firmaLabel}>Autorizó</Text>
            <Text style={styles.firmaName}> </Text>
            <Text style={styles.firmaLabel}>Jefe de Departamento UTEyCV</Text>
          </View>
        </View>

        {/* Cuadros inferiores */}
        <View style={styles.cuadrosInferiores}>
          <View>
            <View style={styles.cuadroVacio} />
            <Text style={styles.cuadroLabel}>En este cuadro no va nada</Text>
          </View>
          <View>
            <View style={styles.cuadroSello} />
            <Text style={styles.cuadroLabel}>Sello de la dependencia</Text>
          </View>
        </View>

      </Page>
    </Document>
  );
}