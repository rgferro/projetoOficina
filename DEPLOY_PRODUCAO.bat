@echo off
chcp 65001 > nul
title Torque ERP - Deploy 1-Clique na VM Oracle Cloud
color 0B

echo =========================================================================
echo       TORQUE ERP (torquerp.com.br) - DEPLOY AUTOMATICO NA NUVEM
echo =========================================================================
echo.
echo IP da VM: 137.131.221.53
echo Dominio:  https://torquerp.com.br
echo.

set /p confirm="Deseja compilar e publicar a versao mais recente na nuvem? (S/N): "
if /i not "%confirm%"=="S" goto END

echo.
echo [1/4] Enviando alteracoes locais para o GitHub...
git add .
git commit -m "deploy: atualizacao automatica de producao"
git push origin main

echo.
echo [2/4] Conectando na VM via SSH e atualizando com Zero-Downtime...
powershell -Command "ssh -o StrictHostKeyChecking=no -i $env:USERPROFILE\.ssh\id_ed25519 ubuntu@137.131.221.53 'cd /var/www/torquerp && git stash && git checkout main && git pull origin main && npm install && npx prisma generate && npx prisma db push && npm run build && pm2 reload torquerp --update-env && pm2 status torquerp'"

if %errorlevel% neq 0 (
    echo.
    echo [!] Tentando com chave secundaria oci_key...
    powershell -Command "ssh -o StrictHostKeyChecking=no -i $env:USERPROFILE\.ssh\oci_key ubuntu@137.131.221.53 'cd /var/www/torquerp && git stash && git checkout main && git pull origin main && npm install && npx prisma generate && npx prisma db push && npm run build && pm2 reload torquerp --update-env && pm2 status torquerp'"
)

echo.
echo =========================================================================
echo  SUCESSO! O Torque ERP foi atualizado no ar com sucesso!
echo  Acesse: https://torquerp.com.br
echo =========================================================================
pause

:END
exit /b 0
