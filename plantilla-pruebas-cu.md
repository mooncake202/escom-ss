# Plantilla para replicar el proceso de pruebas por CU

Copia y pega esto al inicio de una conversación nueva, junto con la ficha del CU.

---

Proyecto: Sistema de Servicio Social ESCOM. Backend Node/Express/Prisma/MariaDB en
`backend/src/modules/<modulo>/`, frontend React/Vite en `front/src/`. Corre en Docker
(`docker compose`, contenedores `escom_backend`/`escom_mariadb`/`escom_redis`/`escom_nginx`),
expuesto en `https://ttservicio.com`.

Para pruebas en vivo: genera tokens JWT con `generarToken({sub, rol})` desde
`backend/src/lib/jwt` dentro de scripts node de un solo uso ejecutados con
`docker compose exec backend node ...`. Para escribir en BD usa Prisma directo
(`require('/app/backend/src/lib/prisma')`) en esos mismos scripts.

**Reglas que no debes romper:**
- Nunca borres, apruebes una baja, ni hagas nada irreversible sin preguntarme primero,
  aunque sea sobre datos que parezcan de prueba.
- Para probar, crea usuarios/alumnos NUEVOS (boletas nuevas) — nunca modifiques datos
  de alumnos reales ni de periodos/ofertas compartidos con otros alumnos, a menos que
  yo confirme que no importa.
- Al terminar una prueba, deja todo como estaba (restaura lo que cambiaste) o
  pregúntame si lo dejo para que yo lo vea en el navegador.
- Cuando encuentres una discrepancia entre lo que dice el código/comentarios y lo que
  realmente hace, verifícalo tú mismo contra la fuente real (el módulo que escribe el
  dato), no asumas que el comentario tiene razón.

**El proceso, en orden — no te saltes pasos:**

**Paso 0 (SIEMPRE primero): documentación vs código.**
Te voy a pasar la ficha de un CU. Antes de cualquier prueba, revisa el código real
contra lo que dice la ficha de forma exhaustiva y minuciosa. No asumas que el código
hace lo que dice el texto, ni que el texto está actualizado. Dime las discrepancias
que encuentres, con cita exacta de archivo y línea. No cambies nada todavía — yo
decido qué se corrige en el código y qué se corrige en la ficha.

**Paso 1: matriz de pruebas, una vez que yo confirme los cambios.**
Arma una matriz (Caso/Precondición/Entrada/Resultado esperado/Obtenido/Pasa) y CORRE
las pruebas de verdad contra el sistema (HTTP real o llamando a la función real), no
las inventes ni las deduzcas leyendo el código.

**Paso 2: pruebas de integración con otros módulos.**
Investiga qué necesita consumir este CU de otros módulos (busca imports de código Y
tablas compartidas en BD — no asumas que solo cuenta el import). Para cada
dependencia encontrada, créame usuarios de prueba nuevos, hazlos avanzar por los
módulos de origen hasta llegar a los estados límite (el mínimo que pasa, el máximo
que no pasa, cada estado intermedio posible), y confirma que el módulo que estamos
probando los lee y procesa bien. Documenta con evidencia real (respuestas JSON,
capturas), no con "debería funcionar".

---

**Ficha a revisar (Paso 0):**

[pega aquí la ficha del CU]
