@echo off
chcp 65001 > nul
title Guardião de Segurança IA - Execução Manual

echo ==============================================================================
echo 🛡️  GUARDIÃO DE SEGURANÇA IA - AUDITORIA NÃO-DESTRUTIVA
echo ==============================================================================
echo.

node "%~dp0scripts\security_ai_monitor.js"

echo.
echo ==============================================================================
echo Auditoria finalizada. Pressione qualquer tecla para fechar.
echo ==============================================================================
pause > nul
