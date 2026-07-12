export function validateStep(step, form, aceptaCreditos) {
  const errors = {};
    const correoInstRegex = /^[a-zA-Z]+[0-9]{4}@alumno\.ipn\.mx$/;
    const correoPersonalRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const telefonoRegex = /^[2-9]\d{9}$/;
    const nombresRegex = /^[A-ZÁÉÍÓÚÜÑ]+(?:\s+[A-ZÁÉÍÓÚÜÑ]+)*$/;
    const apellidosRegex = /^[A-ZÁÉÍÓÚÜÑ]+(?:\s+[A-ZÁÉÍÓÚÜÑ]+)+$/;
    const boletaRegex = /^(19|20)\d{2}63\d{4}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;




  if (step === 0) {

    if (!form.correoInst) errors.correoInst = "Campo requerido";
    else if (!correoInstRegex.test(form.correoInst.trim()))
      errors.correoInst = "Ingresa correo institucional válido @alumno.ipn.mx";



    if (!form.correoPersonal) errors.correoPersonal = "Campo requerido";
    else if (!correoPersonalRegex.test(form.correoPersonal.trim()))
      errors.correoPersonal = "Ingresa un correo válido";



    if (!form.telefono) errors.telefono = "Campo requerido";
    else if(!telefonoRegex.test(form.telefono))
      errors.telefono="Ingresa un número válido";


    if (!form.nombres)   errors.nombres   = "Campo requerido";
    else if(!nombresRegex.test(form.nombres.trim().toUpperCase()))
      errors.nombres="Ingresa un nombre válido";

    if (!form.apellidos)   errors.apellidos   = "Campo requerido";
    else if(!apellidosRegex.test(form.apellidos.trim().toUpperCase()))
      errors.apellidos="Ingresa un nombre válido";

    if (!form.boleta)   errors.boleta   = "Campo requerido";
    else if(!boletaRegex.test(form.boleta))
      errors.boleta="Ingresa una boleta válida en ESCOM";
  }//listo

  if (step === 1) {
    if (!form.carrera)  errors.carrera  = "Selecciona una carrera";

    if (!form.creditos) errors.creditos = "Campo requerido";
    else if (form.creditos<70)
      errors.creditos="Necesitas mínimo el 70% para realizar tu servicio";

    if (!form.periodo)  errors.periodo  = "Selecciona un periodo";

    if (!form.semestre)  errors.semestre  = "Campo requerido";
  }//listo

  if (step === 2) {
    if (!form.oferta) errors.oferta = "Selecciona una oferta";
    if (!form.motivacion || form.motivacion.trim().length < 20)
    errors.motivacion = "Describe por qué deseas participar (mínimo 20 caracteres)";
  }//listo

  if (step === 3) {
    
    
    if (!form.password) errors.password = "Campo requerido";
    else if (!passwordRegex.test(form.password.trim())) 
      errors.password="Debe tener mínimo 8 caracteres, mayúscula, minúscula, número y símbolo";

    if (form.password !== form.confirmarPassword)
      errors.confirmarPassword = "Las contraseñas no coinciden";



    if (!aceptaCreditos) errors.acepta = "Debes aceptar la declaración";
  }

  return errors;
}
