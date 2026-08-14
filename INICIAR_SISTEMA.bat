@echo off
setlocal
cd /d "%~dp0"
title AutoGestao ERP - Sistema da Oficina

echo =======================================================================
echo                 AUTOGESTAO ERP - OFICINA E LAVA-JATO
echo =======================================================================
echo.
echo Abrindo o sistema no seu navegador (http://localhost:3000)...
echo.
echo * DICA: Deixe esta janela minimizada enquanto estiver usando o sistema.
echo.

set "PATH=%ProgramFiles%\nodejs;%APPDATA%\npm;%PATH%"

ping 127.0.0.1 -n 2 > nul
start "" "http://localhost:3000"

call npm run dev
if %errorlevel% equ 0 goto FIM

echo.
echo [AVISO] Tentando iniciar via npm start...
call npm run start

:FIM
echo.
echo O servidor foi encerrado. Pressione qualquer tecla para sair.
pause
cmd /k
