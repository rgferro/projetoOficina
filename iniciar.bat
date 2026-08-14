@echo off
setlocal
cd /d "%~dp0"
title AutoGestao ERP - Servidor Local

echo ========================================================
echo        INICIANDO AUTOGESTAO ERP AUTOMOTIVO
echo ========================================================
echo.
echo Iniciando servidor web local na porta 3000...
echo Abrindo seu navegador automaticamente...
echo.
echo Mantenha esta janela aberta enquanto estiver usando o sistema.
echo.

start "" "http://localhost:3000"
call npm run dev

if %errorlevel% neq 0 (
    call npm run start
)

echo.
echo Servidor finalizado.
pause
cmd /k
