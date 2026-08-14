---
name: whatsapp-baileys-daemon
description: >-
  Arquitetura de integração de WhatsApp Multi-Device 100% nativa, silenciosa e em segundo plano
  usando @whiskeysockets/baileys em microserviço daemon dedicado (porta 3005) para Next.js ou Node.js.
---

# 📲 Arquitetura de Disparo Silencioso de WhatsApp com Baileys Daemon

Esta habilidade ensina como integrar o WhatsApp oficial Multi-Device em qualquer sistema Web/Next.js/Node.js sem abrir abas externas (`wa.me`) e com 100% de estabilidade.

---

## 🎯 Por que usar um Daemon Dedicado?
Em frameworks modernos como Next.js (App Router), rotas de API são temporárias e sofrem reciclagem de threads. O WhatsApp (Baileys) exige um socket WebSocket TCP contínuo. 
A solução arquitetural definitiva é rodar um **microserviço Node.js dedicado (`server-whatsapp.js`) em porta separada (ex: `3005`)** que mantém a conexão ativa 24/7 e expõe endpoints REST simples para o backend principal.

---

## 📦 1. Dependências Necessárias
```bash
npm install @whiskeysockets/baileys@6.7.9 pino qrcode concurrently
```

---

## 🛠️ 2. Microserviço Daemon (`server-whatsapp.js`)
```javascript
const http = require('http');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const {
  default: makeWASocket,
  Browsers,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');
const pino = require('pino');

const PORT = 3005;
const AUTH_DIR = path.join(__dirname, 'whatsapp_auth');

let sock = null;
let isReconnecting = false;
let sessionState = {
  status: 'CONNECTING',
  connectedNumber: null,
  qrCodeUrl: null,
  lastConnectedAt: null,
};

// Tratamento global contra quedas
process.on('uncaughtException', (err) => console.log('⚠️ [WA] Erro capturado:', err.message || err));
process.on('unhandledRejection', (reason) => console.log('⚠️ [WA] Rejeição capturada:', reason));

async function startWhatsAppService() {
  if (isReconnecting) return;
  isReconnecting = true;

  if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion().catch(() => ({
      version: [2, 3000, 1043857760],
    }));

    sock = makeWASocket({
      version,
      auth: state,
      browser: Browsers.macOS('Desktop'),
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      syncFullHistory: false,
      generateHighQualityLinkPreview: false,
      markOnlineOnConnect: false,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        const qrDataUrl = await QRCode.toDataURL(qr, {
          width: 320,
          margin: 2,
          color: { dark: '#0f172a', light: '#ffffff' },
        });

        sessionState = {
          status: 'QR_READY',
          connectedNumber: null,
          qrCodeUrl: qrDataUrl,
          lastConnectedAt: null,
        };
      }

      if (connection === 'open') {
        const cleanNumber = (sock.user?.id || '').split(':')[0].split('@')[0];
        sessionState = {
          status: 'CONNECTED',
          connectedNumber: `+${cleanNumber}`,
          qrCodeUrl: null,
          lastConnectedAt: new Date().toISOString(),
        };
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut;

        if (isLoggedOut) {
          if (fs.existsSync(AUTH_DIR)) fs.rmSync(AUTH_DIR, { recursive: true, force: true });
          sessionState = { status: 'DISCONNECTED', connectedNumber: null, qrCodeUrl: null, lastConnectedAt: null };
          setTimeout(() => { isReconnecting = false; startWhatsAppService(); }, 2000);
        } else {
          setTimeout(() => { isReconnecting = false; startWhatsAppService(); }, 2500);
        }
      }
    });

    isReconnecting = false;
  } catch (err) {
    isReconnecting = false;
    setTimeout(startWhatsAppService, 3000);
  }
}

// Servidor REST interno
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.method === 'GET' && (req.url === '/status' || req.url === '/')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(sessionState));
    return;
  }

  if (req.method === 'POST' && req.url === '/send') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const { phone, message } = JSON.parse(body);
        let cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length === 10 || cleanPhone.length === 11) cleanPhone = `55${cleanPhone}`;

        if (sock && sessionState.status === 'CONNECTED') {
          const jid = `${cleanPhone}@s.whatsapp.net`;
          const result = await sock.sendMessage(jid, { text: message });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, messageId: result?.key?.id, formattedPhone: cleanPhone }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, messageId: `wamid_${Date.now()}`, formattedPhone: cleanPhone, statusText: 'Modo simulado' }));
        }
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/logout') {
    try {
      if (sock) { await sock.logout().catch(() => {}); sock.end(undefined); sock = null; }
      if (fs.existsSync(AUTH_DIR)) fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    } catch (e) {}

    sessionState = { status: 'DISCONNECTED', connectedNumber: null, qrCodeUrl: null, lastConnectedAt: null };
    setTimeout(() => { isReconnecting = false; startWhatsAppService(); }, 1000);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 [WhatsApp Daemon] Rodando na porta ${PORT}`);
  startWhatsAppService();
});
```

---

## ⚡ 3. Integração com o Next.js / Backend Client (`src/lib/whatsappService.ts`)
```typescript
const DAEMON_URL = "http://127.0.0.1:3005";

export async function getWhatsAppSession() {
  const res = await fetch(`${DAEMON_URL}/status`, { cache: "no-store" });
  return await res.json();
}

export async function sendSilentWhatsAppMessage({ phone, message }: { phone: string; message: string }) {
  const res = await fetch(`${DAEMON_URL}/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, message }),
  });
  return await res.json();
}
```

---

## 🚀 4. Execução Concorrente (`package.json`)
```json
"scripts": {
  "dev": "concurrently -k \"node server-whatsapp.js\" \"next dev -p 3000\"",
  "start": "concurrently -k \"node server-whatsapp.js\" \"next start -p 3000\""
}
```
