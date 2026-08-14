@echo off
chcp 65001 > nul
title AutoGestão ERP - Instalador Automático Inteligente

echo =======================================================================
echo           AUTOGESTÃO ERP AUTOMOTIVO - INSTALADOR 1-CLIQUE
echo =======================================================================
echo.
echo Olá! Estamos configurando todo o sistema para você de forma automática.
echo Você não precisa configurar nada, basta aguardar alguns instantes...
echo.

:: 1. Verificação / Instalação Automática do Node.js
echo [Passo 1/4] Verificando requisitos do sistema...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [!] Node.js nao encontrado. Baixando e instalando automaticamente...
    echo     Aguarde o download oficial (pode levar 1 a 2 minutos)...
    
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $installer = Join-Path $env:TEMP 'node_setup.msi'; Write-Host 'Baixando Node.js LTS...'; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.17.0/node-v20.17.0-x64.msi' -OutFile $installer; Write-Host 'Instalando silenciosamente...'; Start-Process msiexec.exe -ArgumentList '/i', $installer, '/quiet', '/norestart' -Wait; Remove-Item $installer"
    
    :: Atualiza PATH na sessão atual
    set "PATH=%ProgramFiles%\nodejs;%APPDATA%\npm;%PATH%"
)

echo [OK] Ambiente pronto!
echo.

:: 2. Instalação de Dependências
echo [Passo 2/4] Configurando componentes do sistema...
call npm install --no-audit --no-fund --loglevel=error
if %errorlevel% neq 0 (
    call npm install --legacy-peer-deps
)

echo.
:: 3. Banco de Dados Local SQLite
echo [Passo 3/4] Preparando banco de dados local da oficina...
call npx prisma generate
call npx prisma db push
call npx tsx prisma/seed.ts

echo.
:: 4. Criação do Atalho na Área de Trabalho
echo [Passo 4/4] Criando atalho do sistema na sua Área de Trabalho...
powershell -ExecutionPolicy Bypass -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut([System.IO.Path]::Combine([System.Environment]::GetFolderPath('Desktop'), 'AutoGestao Oficina.lnk')); $Shortcut.TargetPath = (Join-Path '%~dp0' 'INICIAR_SISTEMA.bat'); $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.WindowStyle = 1; $Shortcut.Description = 'Sistema AutoGestao ERP Oficina e Lava-Jato'; $Shortcut.Save();"

echo.
echo =======================================================================
echo              TUDO PRONTO! O SISTEMA FOI INSTALADO!
echo =======================================================================
echo.
echo 1. Um atalho chamado 'AutoGestao Oficina' foi criado na sua Area de Trabalho.
echo 2. Estamos iniciando o sistema e abrindo seu navegador agora mesmo!
echo.

timeout /t 2 > nul
start "" "http://localhost:3000"
call npm run dev
