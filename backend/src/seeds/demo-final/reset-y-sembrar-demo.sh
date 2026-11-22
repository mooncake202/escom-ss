#!/bin/bash
set -e
cd /home/tt2/escom-ss

echo
echo "=== 1/5: Vaciando la base de datos (prisma migrate reset) ==="
docker compose exec -T backend npx prisma migrate reset --force

echo
echo "=== 2/5: Corriendo 00-comun ==="
docker compose exec -T backend node backend/src/seeds/demo-final/00-comun/index.js

echo
echo "=== 3/5: Corriendo cred-gr-ah-lss (Karen) ==="
# Este paso SIEMPRE termina su trabajo e imprime "cred-gr-ah-lss completo.", pero
# el proceso se queda colgado dentro del contenedor (conexión de Redis/socket que
# no suelta el proceso) — no hay forma de evitarlo desde aquí, así que se corre en
# segundo plano, se espera a ver esa línea en su log, y se mata el proceso dentro
# del contenedor para poder seguir. Si la línea nunca aparece en 4 minutos, se
# aborta el script (algo realmente falló, no es el colgado de siempre).
LOG_CRED=/tmp/cred-gr-ah-lss.log
docker compose exec -T backend node backend/src/seeds/demo-final/cred-gr-ah-lss/index.js > "$LOG_CRED" 2>&1 &
for i in $(seq 1 120); do
  grep -q "✅ cred-gr-ah-lss completo." "$LOG_CRED" 2>/dev/null && break
  sleep 2
done
cat "$LOG_CRED"
docker compose exec -T backend pkill -f "cred-gr-ah-lss/index.js" >/dev/null 2>&1 || true
if ! grep -q "✅ cred-gr-ah-lss completo." "$LOG_CRED"; then
  echo "❌ cred-gr-ah-lss NO llegó a 'completo' en 4 minutos — revisa $LOG_CRED, algo falló de verdad."
  exit 1
fi

echo
echo "=== 4/5: Corriendo amd-pro-rep (Sol) ==="
docker compose exec -T backend node backend/src/seeds/demo-final/amd-pro-rep/index.js

echo
echo "=== 5/5: Verificando los casos de Sol (verificar.js, solo lectura) ==="
set +e
docker compose exec -T backend node backend/src/seeds/demo-final/amd-pro-rep/verificar.js
CODIGO_VERIFICAR=$?
set -e

echo
echo "=== Listo. BD vaciada y sembrada (00-comun + cred-gr-ah-lss + amd-pro-rep). ==="
if [ "$CODIGO_VERIFICAR" -ne 0 ]; then
  echo "⚠️  verificar.js reportó al menos una falla en los casos de Sol — revisa el detalle arriba."
fi
