@echo off
setlocal
cd /d "%~dp0"
title AutoGestao ERP - Instalador 1-Clique

echo ========================================================
echo        INSTALADOR - AUTOGESTAO ERP AUTOMOTIVO
echo ========================================================
echo.
echo [1/4] Verificando ambiente Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado!
    echo Por favor, instale o Node.js: https://nodejs.org
    echo.
    pause
    exit /b
)

echo [OK] Node.js detectado!
echo.
echo [2/4] Instalando dependencias do sistema...
call npm install --no-audit --no-fund
if %errorlevel% neq 0 (
    call npm install --legacy-peer-deps --no-audit --no-fund
)

echo.
echo [3/4] Inicializando banco de dados local SQLite (dev.db)...
call npx -y prisma generate
call npx -y prisma db push
call npx -y tsx prisma/seed.ts

echo.
echo [4/4] Criando atalho na Area de Trabalho...
cscript //nologo "%~dp0criar_atalho.vbs"

echo.
echo ========================================================
echo      INSTALACAO CONCLUIDA COM SUCESSO!
echo ========================================================
echo.
echo Para abrir o sistema a qualquer momento, execute o atalho:
echo -> 'AutoGestao Oficina' na Area de Trabalho
echo.
pause
