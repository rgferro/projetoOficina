@echo off
setlocal
cd /d "%~dp0"
title AutoGestao ERP - Instalador Automatico

echo =======================================================================
echo           AUTOGESTAO ERP AUTOMOTIVO - INSTALADOR 1-CLIQUE
echo =======================================================================
echo.
echo Ola! Estamos configurando todo o sistema para voce de forma automatica.
echo Voce nao precisa configurar nada, basta aguardar alguns instantes...
echo.

:: 1. Verificacao / Instalacao Automatica do Node.js
echo [Passo 1/4] Verificando requisitos do sistema...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [!] Node.js nao encontrado. Baixando e instalando automaticamente...
    echo     Aguarde o download oficial (pode levar 1 a 2 minutos)...
    
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $installer = Join-Path $env:TEMP 'node_setup.msi'; Write-Host 'Baixando Node.js LTS...'; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.17.0/node-v20.17.0-x64.msi' -OutFile $installer; Write-Host 'Instalando silenciosamente...'; Start-Process msiexec.exe -ArgumentList '/i', $installer, '/quiet', '/norestart' -Wait; Remove-Item $installer"
    
    set "PATH=%ProgramFiles%\nodejs;%APPDATA%\npm;%PATH%"
)

echo [OK] Ambiente pronto!
echo.

:: 2. Instalacao de Dependencias
echo [Passo 2/4] Configurando componentes do sistema...
call npm install --no-audit --no-fund --loglevel=error
if %errorlevel% neq 0 (
    echo [AVISO] Tentando instalacao com dependencias legadas...
    call npm install --legacy-peer-deps --no-audit --no-fund
)

echo.
:: 3. Banco de Dados Local SQLite
echo [Passo 3/4] Preparando banco de dados local da oficina...
call npx -y prisma generate
call npx -y prisma db push
call npx -y tsx prisma/seed.ts

echo.
:: 4. Criacao do Atalho na Area de Trabalho
echo [Passo 4/4] Criando atalho do sistema na sua Area de Trabalho...
cscript //nologo "%~dp0criar_atalho.vbs"

echo.
echo =======================================================================
echo              TUDO PRONTO! O SISTEMA FOI INSTALADO!
echo =======================================================================
echo.
echo 1. Um atalho chamado 'AutoGestao Oficina' foi criado na sua Area de Trabalho.
echo 2. Estamos iniciando o sistema e abrindo seu navegador agora mesmo!
echo.
echo * DICA: Deixe esta janela aberta/minimizada enquanto usar o sistema.
echo.

timeout /t 2 > nul
start "" "http://localhost:3000"

:: Executa o servidor mantendo a janela aberta
call npm run dev

echo.
echo O servidor foi encerrado. Pressione qualquer tecla para fechar.
pause
cmd /k
