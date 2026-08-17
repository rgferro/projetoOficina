import https from "https";

const BREVO_API_KEY = process.env.BREVO_API_KEY || "";
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || "contato@torquerp.com.br";
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || "Torque ERP";

/**
 * Envia e-mail transacional usando a API REST Oficial da Brevo (v3)
 */
async function sendBrevoEmail(payloadData: {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  sender?: { email: string; name: string };
}) {
  if (!BREVO_API_KEY) {
    console.warn("⚠️ [Brevo] BREVO_API_KEY não configurada. E-mail simulado com sucesso.");
    return { success: true, simulated: true };
  }

  const payload = JSON.stringify({
    sender: payloadData.sender || {
      name: BREVO_SENDER_NAME,
      email: BREVO_SENDER_EMAIL,
    },
    to: payloadData.to,
    subject: payloadData.subject,
    htmlContent: payloadData.htmlContent,
  });

  const options = {
    hostname: "api.brevo.com",
    port: 443,
    path: "/v3/smtp/email",
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY,
      "Content-Type": "application/json",
      "Accept": "application/json",
      "User-Agent": "TorqueERP/1.0",
      "Content-Length": Buffer.byteLength(payload),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ [Brevo API] E-mail enviado com sucesso (Status ${res.statusCode}):`, data);
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve({ success: true, raw: data });
          }
        } else {
          console.error(`⚠️ [Brevo API] Erro no envio (Status ${res.statusCode}):`, data);
          resolve({ success: false, error: data, statusCode: res.statusCode });
        }
      });
    });

    req.on("error", (e) => {
      console.error("⚠️ [Brevo API] Erro de rede:", e.message);
      resolve({ success: false, error: e.message });
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Envia código de verificação de 6 dígitos para o e-mail do Dono da Oficina
 */
export async function sendVerificationEmail(targetEmail: string, code: string) {
  console.log(`📧 [Torque ERP] Despachando código [${code}] para [${targetEmail}] via Brevo...`);

  return sendBrevoEmail({
    to: [{ email: targetEmail }],
    subject: `Seu Código de Confirmação: ${code} - Torque ERP`,
    htmlContent: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 30px; color: #1e293b; max-width: 520px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 20px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; background: linear-gradient(135deg, #2563eb, #4f46e5); color: #ffffff; font-size: 24px; font-weight: bold; border-radius: 14px;">⚡</div>
          <h2 style="color: #0f172a; margin: 12px 0 0 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Torque ERP</h2>
          <p style="color: #64748b; font-size: 12px; margin-top: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Gestão de Oficinas & Lava-Jato</p>
        </div>
        
        <p style="font-size: 15px; line-height: 1.5; color: #334155;">Olá!</p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">Obrigado por escolher o <strong>Torque ERP</strong>. Para ativar seu cadastro gratuito com até 2 usuários, digite o código de confirmação abaixo:</p>
        
        <div style="font-size: 38px; font-weight: 900; background: #f8fafc; padding: 20px; border-radius: 16px; text-align: center; letter-spacing: 10px; color: #2563eb; margin: 24px 0; border: 2px dashed #93c5fd;">
          ${code}
        </div>
        
        <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; text-align: center;">⏱️ Este código é válido por <strong>15 minutos</strong>. Se você não solicitou esta confirmação, ignore esta mensagem com segurança.</p>
        
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 28px 0 20px 0;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">Torque ERP • <a href="https://torquerp.com.br" style="color: #2563eb; text-decoration: none; font-weight: bold;">torquerp.com.br</a></p>
      </div>
    `,
  });
}

/**
 * Despacha mensagens recebidas do formulário de contato para seu e-mail
 */
export async function sendContactEmail(data: {
  name: string;
  senderEmail: string;
  phone?: string;
  subject: string;
  message: string;
}) {
  return sendBrevoEmail({
    to: [{ email: "rafael.gielow@gmail.com", name: "Rafael Gielow" }],
    subject: `[Torque ERP Fale Conosco] ${data.subject} - De: ${data.name}`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; padding: 25px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
        <h2 style="color: #2563eb; margin-top: 0;">⚡ Torque ERP - Nova Mensagem de Contato</h2>
        <p><strong>Nome:</strong> ${data.name}</p>
        <p><strong>E-mail:</strong> ${data.senderEmail}</p>
        <p><strong>WhatsApp / Telefone:</strong> ${data.phone || "Não informado"}</p>
        <p><strong>Assunto:</strong> ${data.subject}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p><strong>Mensagem:</strong></p>
        <div style="background: #f8fafc; padding: 16px; border-radius: 12px; font-size: 14px; white-space: pre-wrap; line-height: 1.6; border: 1px solid #cbd5e1;">
          ${data.message}
        </div>
      </div>
    `,
  });
}
