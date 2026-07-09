import {
  Document, Page, Text, View, Image, StyleSheet, Svg, Path,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: "40px 50px",
    color: "#000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerCenter: { flex: 1, textAlign: "center" },
  headerTitle: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  headerSubtitle: { fontSize: 9, marginTop: 2 },
  fecha: { textAlign: "right", marginBottom: 12, fontSize: 10 },
  tituloReporte: {
    textAlign: "center", fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4, textTransform: "uppercase",
  },
  periodoTexto: { textAlign: "left", fontSize: 10, marginBottom: 6 },
  horasTexto: {
    textAlign: "left", fontSize: 10, marginBottom: 12,
    fontFamily: "Helvetica-Bold",
  },
  tablaDatos: { border: "1px solid #000", marginBottom: 12 },
  tablaDatosHeader: {
    backgroundColor: "#f0f0f0", padding: "4px 8px",
    fontFamily: "Helvetica-Bold", fontSize: 10,
    textAlign: "center", borderBottom: "1px solid #000",
  },
  tablaDatosBody: { padding: "8px" },
  filaDatos: { flexDirection: "row", marginBottom: 4 },
  filaDatosCol: { flex: 1 },
  actividadesLabel: { fontSize: 10, marginBottom: 8, fontFamily: "Helvetica-Bold" },
  actividadesTexto: {
    fontSize: 10, lineHeight: 1.6,
    marginBottom: 4, textAlign: "justify",
  },
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
  cuadrosInferiores: {
    flexDirection: "row", justifyContent: "space-between", marginTop: 20,
  },
  cuadroVacio: { width: "40%", height: 80, border: "1px solid #000" },
  cuadroSello: {
    width: "40%", height: 80,
    border: "1px solid #000",
    alignItems: "center", justifyContent: "center",
  },
  cuadroLabel: { fontSize: 8, textAlign: "center", marginTop: 4 },
});

export function ReporteGlobalPDF({ datos }) {
  const {
    titulo, fechaGeneracion, periodoTexto,
    alumno, actividades, firmaUrl, totalHoras,
  } = datos;

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
        <Text style={styles.tituloReporte}>{titulo}</Text>

        {/* Periodo */}
        <Text style={styles.periodoTexto}>
          Correspondiente al periodo {periodoTexto}
        </Text>

        {/* Total horas */}
        <Text style={styles.horasTexto}>
          Total de horas acumuladas: {totalHoras} horas
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

        {/* Actividades narrativas */}
        <Text style={styles.actividadesLabel}>Descripción de Actividades Realizadas.</Text>
        <Text style={styles.actividadesTexto}>{actividades}</Text>

        {/* Firmas */}
        <View style={styles.seccionFirmas}>
          <View style={styles.bloqueElabora}>
            {firmaUrl ? (
              <Image src={firmaUrl} style={styles.firmaImg} />
            ) : (
              <View style={{ marginBottom: 4, alignItems: "center" }}>
                <Svg width="120" height="48" viewBox="0 0 120 48">
                  {/* Trazo principal de la rúbrica */}
                  <Path
                    d="M6,36 C10,22 16,16 24,26 C29,33 31,18 40,20 C48,22 50,14 60,17 C67,19 69,12 79,15 C87,18 89,28 96,23 C102,19 106,22 110,28 C113,32 114,30 115,28"
                    stroke="#1a1a1a"
                    strokeWidth="1.8"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Rúbrica secundaria — subrayado decorativo */}
                  <Path
                    d="M6,40 C30,44 60,43 115,40"
                    stroke="#1a1a1a"
                    strokeWidth="0.8"
                    fill="none"
                    strokeLinecap="round"
                  />
                </Svg>
              </View>
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
