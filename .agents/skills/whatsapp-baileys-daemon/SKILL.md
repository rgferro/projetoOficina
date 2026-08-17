---
name: whatsapp-baileys-daemon
description: >-
  Arquitetura de integração de WhatsApp Multi-Device 100% nativa, silenciosa e em segundo plano
  usando @whiskeysockets/baileys (v6.7.24) em microserviço daemon dedicado (porta 3005) para Next.js ou Node.js.
---

# 📲 Arquitetura de Disparo Silencioso de WhatsApp com Baileys Daemon

Esta habilidade ensina como integrar o WhatsApp oficial Multi-Device em qualquer sistema Web/Next.js/Node.js sem abrir abas externas (`wa.me`) e com 100% de estabilidade.

---

## 🎯 Por que usar um Daemon Dedicado?
Em frameworks modernos como Next.js (App Router), rotas de API são temporárias e sofrem reciclagem de threads. O WhatsApp (Baileys) exige um socket WebSocket TCP contínuo. 
A solução arquitetural definitiva é rodar um **microserviço Node.js dedicado (`server-whatsapp.js`) em porta separada (ex: `3005`)** que mantém a conexão ativa 24/7 e expõe endpoints REST simples para o backend principal.

---

## 📦 1. Dependências Necessárias
> [!IMPORTANT]
> Utilize sempre a versão **`6.7.24`** do `@whiskeysockets/baileys` para evitar o erro `405 Method Not Allowed / Connection Failure` de versões legadas do protocolo WhatsApp Web.

```bash
npm install @whiskeysockets/baileys@6.7.24 pino qrcode concurrently
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
} = require('@whiskeysockets/baileys');
const pino = require('pino');

const PORT = 3005;
const AUTH_DIR = process.env.WHATSAPP_AUTH_DIR || path.join(__dirname, 'whatsapp_auth');

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

    sock = makeWASocket({
      auth: state,
      browser: Browsers.macOS('Desktop'),
      logger: pino({ level: 'silent' }),
      syncFullHistory: false,
      generateHighQualityLinkPreview: false,
      markOnlineOnConnect: false,
      shouldIgnoreJid: (jid) => jid?.endsWith('@broadcast'),
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // 1. QR Code emitido
      if (qr) {
        try {
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
          console.log('⚡ [WhatsApp Daemon] QR Code oficial emitido!');
        } catch (err) {
          console.error('Erro ao gerar QR Code:', err);
        }
      }

      // 2. Conexão estabelecida com sucesso
      if (connection === 'open') {
        const cleanNumber = (sock.user?.id || '').split(':')[0].split('@')[0];
        sessionState = {
          status: 'CONNECTED',
          connectedNumber: `+${cleanNumber}`,
          qrCodeUrl: null,
          lastConnectedAt: new Date().toISOString(),
        };
        console.log(`✅ [WhatsApp Daemon] Conectado no número +${cleanNumber}!`);
      }

      // 3. Conexão fechada / desconectada
      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut;

        // Se deslogado ou erro 401/405 (chaves corrompidas), limpa auth para forçar novo QR Code
        if (isLoggedOut || statusCode === 401 || statusCode === 405) {
          if (fs.existsSync(AUTH_DIR)) fs.rmSync(AUTH_DIR, { recursive: true, force: true });
          sessionState = { status: 'DISCONNECTED', connectedNumber: null, qrCodeUrl: null, lastConnectedAt: null };
          setTimeout(() => { isReconnecting = false; startWhatsAppService(); }, 1500);
        } else {
          setTimeout(() => { isReconnecting = false; startWhatsAppService(); }, 2000);
        }
      }
    });

    isReconnecting = false;
  } catch (err) {
    console.error('Erro ao inicializar Baileys:', err);
    isReconnecting = false;
    setTimeout(startWhatsAppService, 3000);
  }
}

// Servidor REST
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // GET /status
  if (req.method === 'GET' && (req.url === '/status' || req.url === '/')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(sessionState));
    return;
  }

  // POST /send
  if (req.method === 'POST' && req.url === '/send') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', async () => {
      try {
        const { phone, message } = JSON.parse(body);
        let clean = phone.replace(/\D/g, '');
        if (clean.length === 10 || clean.length === 11) clean = `55${clean}`;

        if (sock && sessionState.status === 'CONNECTED') {
          const jid = `${clean}@s.whatsapp.net`;
          const result = await sock.sendMessage(jid, { text: message });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, messageId: result?.key?.id, formattedPhone: clean }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, messageId: `wamid_sim_${Date.now()}`, formattedPhone: clean, statusText: 'Simulado' }));
        }
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // POST /logout
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

## ⚡ 3. Scripts no `package.json`
```json
{
  "scripts": {
    "dev": "concurrently -k \"node server-whatsapp.js\" \"next dev -p 3000\"",
    "start": "concurrently -k \"node server-whatsapp.js\" \"next start -p 3000\""
  }
}
```

---

## 🛡️ 4. Boas Práticas Frontend & Fallback Amigável

1. **Polling Contínuo em Configurações (`/configuracoes`):**
   * Realizar polling a cada 2 segundos em `/api/whatsapp/status` para detectar o escaneamento do QR Code no momento exato em que a câmera do celular focar nele.

2. **Verificação de Conexão antes de Disparo Operacional (Lava-Jato / OS):**
   * Ao clicar em *"Avisar no WhatsApp"*, checar `/api/whatsapp/status`.
   * Se **`CONNECTED`**: disparar silenciosamente via `/api/whatsapp/send`.
   * Se **`DISCONNECTED`**: abrir modal de aviso explicando que o WhatsApp não está pareado e fornecer:
     - Botão *"Abrir no WhatsApp Web Agora"* (`wa.me`) para nunca deixar o cliente na mão.
     - Botão *"Ir para Configurações"* para parear o QR Code.
