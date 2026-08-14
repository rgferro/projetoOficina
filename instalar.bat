@echo off
chcp 65001 > nul
title AutoGestao ERP - Instalador 1-Clique

echo ========================================================
echo        INSTALADOR - AUTOGESTAO ERP AUTOMOTIVO
echo ========================================================
echo.
echo [1/4] Verificando ambiente Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado!
    echo Por favor, instale o Node.js (versao LTS recomendada: https://nodejs.org)
    echo.
    pause
    exit /b
)

echo [OK] Node.js detectado!
echo.
echo [2/4] Instalando dependencias do sistema...
call npm install
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao instalar dependencias com npm.
    pause
    exit /b
)

echo.
echo [3/4] Inicializando banco de dados local SQLite (dev.db)...
call npx prisma generate
call npx prisma db push
call npx tsx prisma/seed.ts

echo.
echo [4/4] Criando build de producao otimizado...
call npm run build

echo.
echo ========================================================
echo      INSTALACAO CONCLUIDA COM SUCESSO!
echo ========================================================
echo.
echo Para abrir o sistema a qualquer momento, execute o arquivo:
echo -> iniciar.bat
echo.
pause
