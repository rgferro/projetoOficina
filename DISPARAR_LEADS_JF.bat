@echo off
chcp 65001 > nul
cls
echo ===================================================================
echo           TORQ ERP - DISPARO DE PROSPECÇÃO B2B (JUIZ DE FORA)
echo ===================================================================
echo.
echo Escolha o modo de execução:
echo.
echo [1] MODO SIMULAÇÃO (Testar e validar sem enviar e-mails reais)
echo [2] MODO REAL (Disparar agora via API Brevo: contato@torquerp.com.br)
echo [3] Sair
echo.
set /p MODO="Digite a opção desejada [1, 2 ou 3]: "

if "%MODO%"=="1" (
    echo.
    echo Rodando simulação (--dry-run)...
    node scripts/disparar_emails_leads_jf.js --dry-run
    goto FIM
)

if "%MODO%"=="2" (
    echo.
    echo ⚠️ ATENÇÃO: Os 13 e-mails serão despachados oficialmente via Brevo!
    set /p CONFIRMA="Deseja continuar? (S/N): "
    if /i "%CONFIRMA%"=="S" (
        echo.
        echo Iniciando envio real...
        node scripts/disparar_emails_leads_jf.js
    ) else (
        echo Operação cancelada.
    )
    goto FIM
)

:FIM
echo.
pause
