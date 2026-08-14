@echo off
chcp 65001 > nul
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
call npm run start

if %errorlevel% neq 0 (
    echo.
    echo Servidor de producao nao encontrado. Iniciando modo desenvolvimento...
    call npm run dev
)

pause
