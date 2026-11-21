# amd-pro-rep — pendiente de implementar

Carpeta de tu compañera — AMD, PRO, REP. Depende de `../00-comun` Y de
`../cred-gr-ah-lss` (los usa como base, no los modifica ni los reemplaza).

Antes de escribir aquí, lee `backend/src/seeds/README.md` completo — tiene las reglas
que esta parte debe confirmar o puede ajustar (características, contacto institucional)
y las que NO debe tocar bajo ninguna circunstancia (calendario, catálogos, coordinadores).

## Orden OBLIGATORIO para correr todo (siempre los 3 pasos, en este orden)

```bash
docker compose exec -T backend npx prisma migrate reset --force
docker compose exec -T backend node backend/src/seeds/demo-final/00-comun/index.js
docker compose exec -T backend node backend/src/seeds/demo-final/cred-gr-ah-lss/index.js
docker compose exec -T backend node backend/src/seeds/demo-final/amd-pro-rep/index.js
```

Nunca corras `amd-pro-rep` sin que los 2 anteriores ya hayan corrido, sobre una BD
recién vaciada con el primer comando — si alguno de los 3 corre fuera de este orden,
o se corre dos veces, los `id` autoincrementales de todo (periodos, usuarios, ofertas,
etc.) cambian y ya no coinciden con los que `cred-gr-ah-lss` asume.

**Importante sobre ids:** `03-gr.js`, `04-ah.js` y `06-lss.js` (dentro de
`cred-gr-ah-lss`) referencian varios periodos oficiales de `00-comun` por su
**id fijo** (ej. `PERIODO = { VIGENTE_LARGO: 25, FUTURO: 24, ... }`), asumiendo que
el autoincremento siempre los numera igual porque siempre corren en este mismo orden
sobre una BD vacía. Si tu seed (`amd-pro-rep`) necesita crear sus propios periodos,
usuarios u otras filas con id autoincremental, **NO asumas un id fijo para nada que
hayan creado `00-comun` o `cred-gr-ah-lss`** — en vez de eso, búscalos por un dato
real (como ya hace `cred-gr-ah-lss` para su periodo exclusivo de Mónica:
`evento_calendario.findFirst({ where: { fecha_inicio: ... } })`), o recibe el id
directamente devuelto por la función de `cred-gr-ah-lss` que lo creó, nunca lo
escribas como número suelto. Esto evitó un bug real: dos escenarios de
`cred-gr-ah-lss` (K y L) dejaron de funcionar porque su periodo oficial referenciado
por id ya tenía la fecha límite vencida — si hubieras hardcodeado un id pensando que
sería "el siguiente libre" después de los de `cred-gr-ah-lss`, cualquier cambio futuro
en esa carpeta (como el que yo mismo acabo de hacer, que agregó un periodo nuevo con
id 40) correría ese número y rompería tu seed sin que te dieras cuenta por qué.
