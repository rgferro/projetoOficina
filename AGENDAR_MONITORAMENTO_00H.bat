@echo off
chcp 65001 > nul
title Agendamento do Guardião de Segurança IA (00:00)

echo ==============================================================================
echo 🛡️  AGENDAMENTO AUTOMÁTICO - GUARDIÃO DE SEGURANÇA IA (00:00 DIÁRIO)
echo ==============================================================================
echo.
echo Este script registra uma tarefa oficial no Agendador de Tarefas do Windows
echo para rodar a auditoria de segurança inteligente todo dia pontualmente às 00:00.
echo.
echo Modo: 100%% READ-ONLY (Risco Zero de quebrar o sistema em produção).
echo ==============================================================================
echo.

set "TASK_NAME=AutoGestao_Seguranca_IA_00h"
set "NODE_EXEC=node"
set "SCRIPT_PATH=%~dp0scripts\security_ai_monitor.js"

echo [*] Registrando tarefa agendada no Windows (00:00 todo dia)...
schtasks /create /tn "%TASK_NAME%" /tr "\"%NODE_EXEC%\" \"%SCRIPT_PATH%\"" /sc daily /st 00:00 /f

if %ERRORLEVEL% equ 0 (
    echo.
    echo ==============================================================================
    echo ✅ TAREFA AGENDADA COM SUCESSO!
    echo ==============================================================================
    echo ⏰ Horário: Todo dia às 00:00 (Meia-noite)
    echo 🛡️  Nome da Tarefa: %TASK_NAME%
    echo 📁 Relatórios salvos em: logs\security\security_audit_DATA.txt
    echo 📲 Se o WhatsApp Daemon estiver ligado, você receberá a notificação direta!
    echo ==============================================================================
) else (
    echo.
    echo ⚠️ ATENÇÃO: Caso tenha dado erro de permissão, clique com o botão direito
    echo neste arquivo .bat e selecione "Executar como Administrador".
)

echo.
pause
