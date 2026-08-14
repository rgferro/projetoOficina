@echo off
chcp 65001 > nul
title AutoGestão ERP - Sistema da Oficina

echo =======================================================================
echo                 AUTOGESTÃO ERP - OFICINA & LAVA-JATO
echo =======================================================================
echo.
echo Abrindo o sistema no seu navegador...
echo.
echo * DICA: Deixe esta janela minimizada enquanto estiver usando o sistema.
echo.

:: Garante PATH do Node se tiver sido instalado recentemente
set "PATH=%ProgramFiles%\nodejs;%APPDATA%\npm;%PATH%"

:: Abre o navegador no endereço do sistema
start "" "http://localhost:3000"

:: Inicia o servidor
call npm run dev
