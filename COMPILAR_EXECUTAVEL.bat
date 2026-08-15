@echo off
chcp 65001 > nul
title AutoGestao ERP - Compilador Desktop Multiplataforma
color 0B

echo =========================================================================
echo       AUTOGESTAO ERP AUTOMOTIVO - COMPILADOR DESKTOP MULTIPLATAFORMA
echo =========================================================================
echo.
echo  [1] Compilar Versao Windows (.exe instalador + .zip portatil)
echo  [2] Testar / Executar Modo Desktop Local (Electron)
echo  [3] Abrir Gerador de Chaves de Licenca (Keygen)
echo  [4] Sair
echo.
set /p opt="Escolha uma opcao [1-4]: "

if "%opt%"=="1" goto BUILD_WIN
if "%opt%"=="2" goto RUN_ELECTRON
if "%opt%"=="3" goto RUN_KEYGEN
if "%opt%"=="4" goto END

:BUILD_WIN
echo.
echo [*] Limpando cache e compilando Next.js (Codigo Fechado Otimizado)...
if exist .next rmdir /s /q .next
call npm run build
if %errorlevel% neq 0 (
    echo [!] Erro ao compilar Next.js.
    pause
    exit /b %errorlevel%
)
echo.
echo [*] Empacotando executavel nativo para Windows (.exe / .zip)...
call npx electron-builder --win --x64
if %errorlevel% neq 0 (
    echo [!] Erro ao empacotar com Electron.
    pause
    exit /b %errorlevel%
)
echo.
echo =========================================================================
echo  SUCESSO! Executavel gerado na pasta: dist_desktop/
echo =========================================================================
pause
goto END

:RUN_ELECTRON
echo.
echo [*] Iniciando aplicacao em modo Desktop Electron...
call npm run electron:dev
goto END

:RUN_KEYGEN
echo.
node tools/keygen.js
pause
goto END

:END
exit /b 0
