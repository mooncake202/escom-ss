@echo off
title Detener Backend y Frontend

echo Liberando puertos y deteniendo servicios...
echo.

:: Cierra todos los procesos flotantes de Node.js que usan los puertos
taskkill /F /IM node.exe /T

echo.
echo ¡Servicios detenidos con éxito!