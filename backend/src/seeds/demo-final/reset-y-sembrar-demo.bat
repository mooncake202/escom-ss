@echo off
title Vaciar BD + sembrar demo (00-comun + cred-gr-ah-lss)
cd /d C:\Users\peach\servicio-social

echo.
echo === 1/3: Vaciando la base de datos (prisma migrate reset) ===
docker compose exec -T backend npx prisma migrate reset --force
if errorlevel 1 goto :error

echo.
echo === 2/3: Corriendo 00-comun ===
docker compose exec -T backend node backend/src/seeds/demo-final/00-comun/index.js
if errorlevel 1 goto :error

echo.
echo === 3/3: Corriendo cred-gr-ah-lss ===
docker compose exec -T backend node backend/src/seeds/demo-final/cred-gr-ah-lss/index.js
if errorlevel 1 goto :error

echo.
echo === Listo. BD vaciada y sembrada (00-comun + cred-gr-ah-lss). ===
pause
exit /b 0

:error
echo.
echo === FALLO en uno de los pasos de arriba. Revisa el mensaje antes de continuar. ===
pause
exit /b 1
