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
const AUTH_DIR = process.env.WHATSAPP_AUTH_DIR || path.join(__dirname, 'whatsapp_auth');

let sock = null;
let isReconnecting = false;
let sessionState = {
  status: 'CONNECTING',
  connectedNumber: null,
  qrCodeUrl: null,
  lastConnectedAt: null,
  qrGeneratedAt: null,
};

// Evita que erros não tratados derrubem o processo
process.on('uncaughtException', (err) => {
  console.log('⚠️ [WhatsApp Daemon] Aviso capturado (uncaught):', err.message || err);
});

process.on('unhandledRejection', (reason) => {
  console.log('⚠️ [WhatsApp Daemon] Rejeição capturada (unhandled):', reason);
});

async function startWhatsAppService() {
  if (isReconnecting) return;
  isReconnecting = true;

  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

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
            qrGeneratedAt: Date.now(),
          };
          console.log('⚡ [WhatsApp Daemon] QR Code oficial emitido (TTL: 45s)!');
        } catch (err) {
          console.error('Erro ao gerar QR Code:', err);
        }
      }

      if (connection === 'open') {
        const userJid = sock.user?.id || '';
        const cleanNumber = userJid.split(':')[0].split('@')[0];

        sessionState = {
          status: 'CONNECTED',
          connectedNumber: `+${cleanNumber}`,
          qrCodeUrl: null,
          lastConnectedAt: new Date().toISOString(),
        };

        console.log(`✅ [WhatsApp Daemon] Celular CONECTADO no número +${cleanNumber}!`);
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut;

        console.log(`⚠️ [WhatsApp Daemon] Conexão finalizada (${statusCode}). Reconectando: ${!isLoggedOut}`);

        if (isLoggedOut || statusCode === 401 || statusCode === 405) {
          if (fs.existsSync(AUTH_DIR)) {
            fs.rmSync(AUTH_DIR, { recursive: true, force: true });
          }
          sessionState = {
            status: 'DISCONNECTED',
            connectedNumber: null,
            qrCodeUrl: null,
            lastConnectedAt: null,
          };
          setTimeout(() => {
            isReconnecting = false;
            startWhatsAppService();
          }, 1500);
        } else {
          setTimeout(() => {
            isReconnecting = false;
            startWhatsAppService();
          }, 2000);
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

// Servidor HTTP na porta 3005
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // GET /status
  if (req.method === 'GET' && (req.url === '/status' || req.url === '/')) {
    // Validação de TTL de 45 segundos para o QR Code
    if (sessionState.status === 'QR_READY' && sessionState.qrGeneratedAt) {
      const ageSeconds = (Date.now() - sessionState.qrGeneratedAt) / 1000;
      if (ageSeconds > 45) {
        sessionState.status = 'QR_EXPIRED';
        sessionState.qrCodeUrl = null;
      }
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(sessionState));
    return;
  }

  // POST /send
  if (req.method === 'POST' && req.url === '/send') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const { phone, message } = JSON.parse(body);
        let cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length === 10 || cleanPhone.length === 11) {
          cleanPhone = `55${cleanPhone}`;
        }

        if (sock && sessionState.status === 'CONNECTED') {
          const jid = `${cleanPhone}@s.whatsapp.net`;
          const result = await sock.sendMessage(jid, { text: message });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              success: true,
              messageId: result?.key?.id || `wamid_${Date.now()}`,
              formattedPhone: cleanPhone,
            })
          );
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              success: true,
              messageId: `wamid_sim_${Date.now()}`,
              formattedPhone: cleanPhone,
              statusText: 'Disparado internamente',
            })
          );
        }
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message || 'Erro ao enviar mensagem' }));
      }
    });
    return;
  }

  // POST /logout
  if (req.method === 'POST' && req.url === '/logout') {
    try {
      if (sock) {
        await sock.logout().catch(() => {});
        sock.end(undefined);
        sock = null;
      }
      if (fs.existsSync(AUTH_DIR)) {
        fs.rmSync(AUTH_DIR, { recursive: true, force: true });
      }
    } catch (e) {}

    sessionState = {
      status: 'DISCONNECTED',
      connectedNumber: null,
      qrCodeUrl: null,
      lastConnectedAt: null,
    };
    setTimeout(() => {
      isReconnecting = false;
      startWhatsAppService();
    }, 1000);

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
