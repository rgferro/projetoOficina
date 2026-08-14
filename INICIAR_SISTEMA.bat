@echo off
setlocal enabledelayedexpansion
chcp 65001 > nul
title AutoGestão ERP - Sistema da Oficina

:: Garante que o diretório de trabalho é a pasta onde o .bat está localizado
cd /d "%~dp0"

echo =======================================================================
echo                 AUTOGESTÃO ERP - OFICINA & LAVA-JATO
echo =======================================================================
echo.
echo Abrindo o sistema no seu navegador (http://localhost:3000)...
echo.
echo * DICA: Deixe esta janela minimizada enquanto estiver usando o sistema.
echo.

:: Garante PATH do Node se tiver sido instalado recentemente
set "PATH=%ProgramFiles%\nodejs;%APPDATA%\npm;%PATH%"

:: Abre o navegador no endereço do sistema
timeout /t 1 > nul
start "" "http://localhost:3000"

:: Inicia o servidor
call npm run dev

echo.
echo O servidor foi encerrado.
pause
