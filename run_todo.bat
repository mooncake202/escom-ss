@echo off
title Arrancar Backend y Frontend

echo Iniciando el Backend...
cd /d C:\Users\peach\servicio-social\backend
start /b npx nodemon server.js

echo.
echo Iniciando el Frontend...
cd /d C:\Users\peach\servicio-social\front
call npm run dev