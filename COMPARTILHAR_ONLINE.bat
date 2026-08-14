@echo off
chcp 65001 > nul
cd /d "%~dp0"
title AutoGestao ERP - Compartilhar Link Online com Cliente
cls

echo =======================================================================
echo          AUTOGESTAO ERP - COMPARTILHAMENTO ONLINE (1-CLIQUE)
echo =======================================================================
echo.
echo Iniciando conexao segura global Cloudflare com HTTPS...
echo.

if not exist cloudflared.exe (
    echo [Download] Baixando Cloudflare Tunnel oficial...
    curl -L -o cloudflared.exe https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe
)

echo.
echo =======================================================================
echo   SISTEMA ONLINE E PRONTO PARA O SEU CLIENTE!
echo   Copie o link que comeca com https://....trycloudflare.com abaixo:
echo =======================================================================
echo.
echo Mantendo o link ativo enquanto esta janela estiver aberta...
echo Pressione Ctrl+C para encerrar o compartilhamento quando terminar.
echo.

cloudflared.exe tunnel --url http://localhost:3000
