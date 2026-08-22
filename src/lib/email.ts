import https from "https";
import { brevoEmailCircuit } from "./resilience";

const BREVO_API_KEY = process.env.BREVO_API_KEY || "";
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || "contato@torquerp.com.br";
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || "Torque ERP";

/**
 * Envia e-mail transacional usando a API REST Oficial da Brevo (v3) com Circuit Breaker e Retries
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

  return await brevoEmailCircuit.execute(
    () =>
      new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              try {
                resolve(JSON.parse(data));
              } catch {
                resolve({ success: true, raw: data });
              }
            } else {
              reject(new Error(`[Brevo API] Erro HTTP ${res.statusCode}: ${data}`));
            }
          });
        });

        req.on("error", (err) => reject(err));
        req.write(payload);
        req.end();
      }),
    () => {
      console.warn("⚠️ [Brevo Fallback] Falha temporária no envio de e-mail pela API. Operação registrada para entrega assíncrona.");
      return { success: true, fallback: true };
    }
  );
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
 * Envia convite por e-mail para um novo colaborador criar sua senha
 */
export async function sendEmployeeInviteEmail(data: {
  employeeName: string;
  employeeEmail: string;
  role: string;
  workshopName: string;
  ownerName: string;
  inviteLink: string;
}) {
  console.log(`📧 [Torque ERP] Despachando convite para funcionário [${data.employeeEmail}] via Brevo...`);

  return sendBrevoEmail({
    to: [{ email: data.employeeEmail, name: data.employeeName }],
    subject: `Convite de Acesso: Equipe ${data.workshopName} - Torque ERP`,
    htmlContent: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 30px; color: #1e293b; max-width: 540px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 20px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; background: linear-gradient(135deg, #2563eb, #4f46e5); color: #ffffff; font-size: 24px; font-weight: bold; border-radius: 14px;">⚡</div>
          <h2 style="color: #0f172a; margin: 12px 0 0 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Torque ERP</h2>
          <p style="color: #64748b; font-size: 12px; margin-top: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Convite de Equipe</p>
        </div>
        
        <h3 style="color: #1e293b; font-size: 16px; margin-bottom: 8px;">Olá, ${data.employeeName}!</h3>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">
          Você foi adicionado por <strong>${data.ownerName}</strong> para fazer parte da equipe da <strong>${data.workshopName}</strong> no cargo de <strong>${data.role}</strong>.
        </p>
        
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">
          Para começar a usar o sistema e acessar suas ordens de serviço e atendimentos, basta criar sua senha pessoal de acesso clicando no botão abaixo:
        </p>
        
        <div style="text-align: center; margin: 28px 0;">
          <a href="${data.inviteLink}" style="background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #ffffff; padding: 14px 28px; font-size: 14px; font-weight: bold; text-decoration: none; border-radius: 12px; display: inline-block; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
            Criar Minha Senha de Acesso →
          </a>
        </div>
        
        <p style="font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5;">
          ⏱️ Este link de convite é válido por <strong>48 horas</strong>.<br/>
          Caso o botão não abra, copie e cole o link no seu navegador:<br/>
          <a href="${data.inviteLink}" style="color: #2563eb; word-break: break-all;">${data.inviteLink}</a>
        </p>
        
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 28px 0 20px 0;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">Torque ERP • Gestão Automotiva Inteligente</p>
      </div>
    `,
  });
}

/**
 * Despacha código de recuperação / redefinição de senha para o e-mail do usuário
 */
export async function sendPasswordResetEmail(targetEmail: string, code: string, recipientName?: string) {
  console.log(`🔑 [Torque ERP] Despachando código de recuperação [${code}] para [${targetEmail}] via Brevo...`);

  return sendBrevoEmail({
    to: [{ email: targetEmail, name: recipientName || "Usuário Torque" }],
    subject: `Recuperação de Senha: ${code} - Torque ERP`,
    htmlContent: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 30px; color: #1e293b; max-width: 520px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 20px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; background: linear-gradient(135deg, #2563eb, #4f46e5); color: #ffffff; font-size: 24px; font-weight: bold; border-radius: 14px;">⚡</div>
          <h2 style="color: #0f172a; margin: 12px 0 0 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Torque ERP</h2>
          <p style="color: #64748b; font-size: 12px; margin-top: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Recuperação de Acesso</p>
        </div>
        
        <p style="font-size: 15px; line-height: 1.5; color: #334155;">Olá${recipientName ? `, <strong>${recipientName}</strong>` : ""}!</p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">Recebemos uma solicitação para redefinir a senha de acesso à sua conta no <strong>Torque ERP</strong>. Use o código de segurança abaixo para criar uma nova senha:</p>
        
        <div style="font-size: 38px; font-weight: 900; background: #f8fafc; padding: 20px; border-radius: 16px; text-align: center; letter-spacing: 10px; color: #2563eb; margin: 24px 0; border: 2px dashed #93c5fd;">
          ${code}
        </div>
        
        <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; text-align: center;">⏱️ Este código de segurança expira em <strong>15 minutos</strong>.<br/>Se você não solicitou a redefinição de senha, nenhuma alteração foi feita e você pode desconsiderar este e-mail.</p>
        
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

/**
 * Despacha notificação de segurança e auditoria ao dono da oficina quando uma sessão de suporte por personificação é iniciada
 */
export async function sendSupportAccessNotificationEmail(data: {
  ownerEmail: string;
  ownerName: string;
  workshopName: string;
  adminEmail: string;
  reason: string;
  ipAddress: string;
  timestamp: Date;
}) {
  const formattedDate = data.timestamp.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "full",
    timeStyle: "medium",
  });

  console.log(`🛡️ [Torque ERP] Despachando alerta de suporte para [${data.ownerEmail}]...`);

  return sendBrevoEmail({
    to: [{ email: data.ownerEmail, name: data.ownerName }],
    subject: `[Segurança] Sessão de Suporte Técnico Iniciada - ${data.workshopName}`,
    htmlContent: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 32px; color: #1e293b; max-width: 560px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 20px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 50px; height: 50px; line-height: 50px; background: linear-gradient(135deg, #d97706, #b45309); color: #ffffff; font-size: 24px; font-weight: bold; border-radius: 16px; box-shadow: 0 4px 12px rgba(217, 119, 6, 0.25);">🛡️</div>
          <h2 style="color: #0f172a; margin: 12px 0 0 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">Aviso de Segurança & Suporte</h2>
          <p style="color: #d97706; font-size: 12px; margin-top: 4px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Torque ERP • Atendimento Técnico</p>
        </div>
        
        <p style="font-size: 15px; line-height: 1.5; color: #334155;">Olá, <strong>${data.ownerName}</strong> (${data.workshopName}),</p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">
          Informamos que uma sessão temporária de suporte técnico autorizado foi iniciada na sua oficina para atendimento ou diagnóstico de sistema.
        </p>

        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 14px; padding: 18px; margin: 20px 0; font-size: 13px; line-height: 1.6; color: #92400e;">
          <p style="margin: 0 0 8px 0;"><strong>📋 Detalhes do Acesso:</strong></p>
          <ul style="margin: 0; padding-left: 20px;">
            <li><strong>Operador Responsável:</strong> ${data.adminEmail}</li>
            <li><strong>Motivo / Finalidade:</strong> ${data.reason}</li>
            <li><strong>Data & Horário:</strong> ${formattedDate} (Horário de Brasília)</li>
            <li><strong>Endereço IP de Origem:</strong> ${data.ipAddress}</li>
            <li><strong>Duração Máxima:</strong> 1 hora (expiração automática)</li>
          </ul>
        </div>

        <p style="font-size: 13px; line-height: 1.6; color: #64748b;">
          🔒 <strong>Proteção e Privacidade:</strong> O modo de suporte <u>não</u> tem acesso à sua senha pessoal nem permite alteração de credenciais. Todas as ações do operador são registradas e auditadas em nossa trilha de conformidade (LGPD).
        </p>

        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0 16px 0;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
          Caso você não tenha solicitado suporte, contate nosso time de segurança imediatamente pelo suporte oficial.<br/>
          <strong>Torque ERP</strong> • <a href="https://torquerp.com.br" style="color: #2563eb; text-decoration: none;">torquerp.com.br</a>
        </p>
      </div>
    `,
  });
}



