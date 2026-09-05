export function validateStep(step, form, aceptaCreditos) {
  const errors = {};
    const correoInstRegex = /^[a-zA-Z]+[0-9]{4}@alumno\.ipn\.mx$/;
    const correoPersonalRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const telefonoRegex = /^[2-9]\d{9}$/;
    const nombresRegex = /^[A-ZÁÉÍÓÚÜÑ]+(?:\s+[A-ZÁÉÍÓÚÜÑ]+)*$/;
    // Exactamente dos apellidos (paterno y materno) — ni uno ni tres.
    const apellidosRegex = /^[A-ZÁÉÍÓÚÜÑ]+\s+[A-ZÁÉÍÓÚÜÑ]+$/;
    const boletaRegex = /^(19|20)\d{2}63\d{4}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;




  if (step === 0) {

    if (!form.correoInst) errors.correoInst = "Campo requerido";
    else if (!correoInstRegex.test(form.correoInst.trim()))
      errors.correoInst = "Ingresa correo institucional válido @alumno.ipn.mx";



    // correoPersonal es OPCIONAL (según el schema y la ficha del CU) —
    // solo se valida el formato si el alumno decide capturarlo.
    if (form.correoPersonal && !correoPersonalRegex.test(form.correoPersonal.trim()))
      errors.correoPersonal = "Ingresa un correo válido";



    if (!form.telefono) errors.telefono = "Campo requerido";
    else if(!telefonoRegex.test(form.telefono))
      errors.telefono="Ingresa un número válido";


    if (!form.nombres)   errors.nombres   = "Campo requerido";
    else if(!nombresRegex.test(form.nombres.trim().toUpperCase()))
      errors.nombres="Ingresa un nombre válido";

    if (!form.apellidos)   errors.apellidos   = "Campo requerido";
    else if(!apellidosRegex.test(form.apellidos.trim().toUpperCase()))
      errors.apellidos="Ingresa tus dos apellidos (paterno y materno)";

    if (!form.boleta)   errors.boleta   = "Campo requerido";
    else if(!boletaRegex.test(form.boleta))
      errors.boleta="Ingresa una boleta válida en ESCOM";
  }//listo

  if (step === 1) {
    if (!form.carrera)  errors.carrera  = "Selecciona una carrera";

    if (!form.creditos) errors.creditos = "Campo requerido";
    if (!form.semestre)  errors.semestre  = "Campo requerido";
    if (!form.periodo)  errors.periodo  = "Selecciona un periodo";

    // RN-GR-02 / RN-GR-03 / Flujos Alternos A y B: el umbral de créditos
    // depende del dictamen activo (form.tipoLiberacion).
    if (form.creditos && form.semestre) {
      const creditos = Number(form.creditos);
      const semestre = Number(form.semestre);

      if (!form.tipoLiberacion) {
        if (creditos < 70)
          errors.creditos = "Necesitas mínimo el 70% para realizar tu servicio";
      } else if (form.tipoLiberacion === "creditos") {
        // Rango 60–70%: este dictamen es específicamente para quien está
        // por debajo del 70% requerido normalmente.
        if (creditos < 60 || creditos > 70 || semestre < 6)
          errors.tipoLiberacion = "Con este dictamen tus créditos deben estar entre 60% y 70%, y debes estar en semestre 6 o superior";
      } else if (form.tipoLiberacion === "electiva") {
        
        if (creditos < 96.01)
          errors.tipoLiberacion = "Con este dictamen necesitas mínimo 96.01% de créditos";
      } else if (form.tipoLiberacion === "estancia") {
        // RN-GR-03: estancia profesional no modifica los rangos.
        if (creditos < 70)
          errors.creditos = "Necesitas mínimo el 70% para realizar tu servicio";
      }
    }
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