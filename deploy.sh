#!/usr/bin/env bash
set -e

echo "========================================================================="
echo "       TORQUE ERP (torquerp.com.br) - SCRIPT DE DEPLOY NA VM LINUX       "
echo "========================================================================="
echo ""

cd /var/www/torquerp

echo "[1/4] Puxando atualizações do GitHub..."
git stash || true
git pull origin main

echo "[2/4] Configurando variáveis de ambiente..."
cat << 'EOF' > .env
DATABASE_URL=file:./dev.db
APP_URL=https://torquerp.com.br
PORT=3001
EOF

echo "[3/4] Sincronizando banco Prisma e compilando Next.js..."
npx prisma generate
npx prisma db push
npm run build

echo "[4/4] Reiniciando serviços no PM2..."
pm2 restart all || (pm2 start npx --name "torquerp" -- next start -p 3001 && pm2 start server-whatsapp.js --name "torquerp-whatsapp")
pm2 save

echo ""
echo "========================================================================="
echo " SUCESSO! Torque ERP atualizado e rodando em https://torquerp.com.br"
echo "========================================================================="
pm2 status
