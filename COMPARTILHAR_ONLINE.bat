@echo off
chcp 65001 > nul
cd /d "%~dp0"
title AutoGestao ERP - Compartilhar Link Online com Cliente
cls

echo =======================================================================
echo          AUTOGESTAO ERP - COMPARTILHAMENTO ONLINE (1-CLIQUE)
echo =======================================================================
echo.
echo Gerando link seguro com HTTPS para demonstracao ao cliente...
echo.

for /f %%a in ('curl -s https://loca.lt/mytunnelpassword') do set SENHA_TUNEL=%%a

echo [OK] Servidor detectado na porta 3000!
echo.
echo =======================================================================
echo   LINK PARA ENVIAR AO SEU CLIENTE:
echo.
echo   Caso a tela peca a Senha de Acesso (Tunnel Password), digite:
echo   SENHA: %SENHA_TUNEL%
echo =======================================================================
echo.
echo Mantendo o link ativo enquanto esta janela estiver aberta...
echo Pressione Ctrl+C para encerrar o compartilhamento quando terminar.
echo.

npx -y localtunnel --port 3000
