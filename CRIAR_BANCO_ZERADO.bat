@echo off
chcp 65001 > nul
title AutoGestao ERP - Criador de Banco SQLite Zerado
color 0E

echo =========================================================================
echo       AUTOGESTAO ERP - PREPARAR BANCO DE DADOS ZERADO PARA CLIENTE
echo =========================================================================
echo.
echo Este script criara um banco de dados dev.db 100%% limpo (com tabelas
echo estruturadas, sem dados de teste pessoais ou historicos de caixa).
echo.
set /p confirm="Deseja recriar o banco zerado para distribuicao? (S/N): "
if /i not "%confirm%"=="S" goto END

echo.
echo [*] Excluindo banco e sessoes temporarias...
if exist dev.db del /F /Q dev.db
if exist dev.db-journal del /F /Q dev.db-journal
if exist .license del /F /Q .license
if exist whatsapp_auth rmdir /s /q whatsapp_auth

echo.
echo [*] Gerando estrutura de tabelas virgem (Prisma)...
call npx prisma db push --skip-generate

echo.
echo [*] Criando usuario Administrador padrao e configuracoes basicas...
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function init() {
  await prisma.workshopSetting.create({
    data: {
      id: 'default',
      workshopName: 'Oficina Mecânica & Centro Automotivo',
      phone: '',
      warrantyDays: 90,
      whatsappWashReadyTemplate: 'Olá {nome}! Seu {veiculo} ({placa}) já está pronto para retirada no {oficina}! 🚗✨',
      whatsappOilReminderTemplate: 'Olá {nome}! Lembrete de revisão preventiva para o seu {veiculo} ({placa}) no {oficina}! 🛠️',
      whatsappWashReminderTemplate: 'Olá {nome}! Que tal trazer o {veiculo} ({placa}) para uma lavagem especial no {oficina}? 🧼',
      whatsappBirthdayTemplate: '🎉 Parabéns {nome}! Desejamos um feliz aniversário com muitas realizações! 🎁🚗'
    }
  });

  await prisma.employee.create({
    data: {
      name: 'Administrador Geral',
      role: 'Administrador',
      accessLevel: 'ADMIN',
      pinCode: '1234',
      active: true
    }
  });

  console.log('✓ Banco virgem criado com sucesso!');
  await prisma.\$disconnect();
}
init().catch(console.error);
"

echo.
echo =========================================================================
echo  SUCESSO! O banco dev.db esta 100%% pronto para distribuicao comercial.
echo =========================================================================
pause

:END
exit /b 0
