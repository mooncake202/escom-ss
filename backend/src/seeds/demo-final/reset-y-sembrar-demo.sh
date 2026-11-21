#!/bin/bash
set -e
cd /home/tt2/escom-ss

echo
echo "=== 1/3: Vaciando la base de datos (prisma migrate reset) ==="
docker compose exec -T backend npx prisma migrate reset --force

echo
echo "=== 2/3: Corriendo 00-comun ==="
docker compose exec -T backend node backend/src/seeds/demo-final/00-comun/index.js

echo
echo "=== 3/3: Corriendo cred-gr-ah-lss ==="
docker compose exec -T backend node backend/src/seeds/demo-final/cred-gr-ah-lss/index.js

echo
echo "=== Listo. BD vaciada y sembrada (00-comun + cred-gr-ah-lss). ==="
