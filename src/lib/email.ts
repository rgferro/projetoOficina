import https from "https";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";

/**
 * Envia código de verificação de 6 dígitos para o e-mail do Dono da Oficina
 */
export async function sendVerificationEmail(targetEmail: string, code: string) {
  console.log(`📧 [Torque ERP] Enviando código [${code}] para [${targetEmail}]...`);

  const payload = JSON.stringify({
    from: "Torque ERP <nao-responda@torquerp.com.br>",
    to: [targetEmail],
    subject: `Seu Código de Confirmação: ${code} - Torque ERP`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 25px; color: #1e293b; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #2563eb; margin: 0; font-size: 24px;">⚡ Torque ERP</h2>
          <p style="color: #64748b; font-size: 12px; margin-top: 4px;">Gestão de Oficinas Mecânicas & Lava-Jato</p>
        </div>
        <p style="font-size: 14px;">Olá!</p>
        <p style="font-size: 14px; color: #475569;">Seu código de verificação para ativar sua conta gratuita no <strong>Torque ERP</strong> é:</p>
        <div style="font-size: 36px; font-weight: 900; background: #f8fafc; padding: 18px; border-radius: 12px; text-align: center; letter-spacing: 8px; color: #2563eb; margin: 20px 0; border: 2px dashed #93c5fd;">
          ${code}
        </div>
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">Este código expira em 15 minutos. Se você não solicitou este cadastro, ignore este e-mail.</p>
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
        <p style="font-size: 11px; color: #cbd5e1; text-align: center;">Torque ERP • torquerp.com.br</p>
      </div>
    `,
  });

  const options = {
    hostname: "api.resend.com",
    port: 443,
    path: "/emails",
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "User-Agent": "TorqueERP/1.0",
      "Content-Length": Buffer.byteLength(payload),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        console.log(`✅ [Resend API] Status ${res.statusCode}:`, data);
        resolve(data);
      });
    });

    req.on("error", (e) => {
      console.error("⚠️ [Resend API] Erro ao despachar e-mail:", e.message);
      // Resolve para não travar em caso de limites de API em ambiente de desenvolvimento
      resolve({ fallback: true, error: e.message });
    });

    req.write(payload);
    req.end();
  });
}
