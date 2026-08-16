import https from "https";

export interface PlanConfig {
  id: "STARTER" | "PRO" | "ELITE" | "EXTRA_SEAT";
  name: string;
  price: number;
  maxUsers: number;
  description: string;
}

export const SAAS_PLANS: Record<string, PlanConfig> = {
  STARTER: {
    id: "STARTER",
    name: "Torque Starter (Grátis)",
    price: 0,
    maxUsers: 2,
    description: "Até 2 usuários, 30 Ordens de Serviço/mês e 50 Lavagens/mês.",
  },
  PRO: {
    id: "PRO",
    name: "Torque Oficina Pro",
    price: 69.9,
    maxUsers: 4,
    description: "Até 4 usuários, Ordens de Serviço e Lavagens ilimitadas + CRM WhatsApp.",
  },
  ELITE: {
    id: "ELITE",
    name: "Torque Oficina Elite",
    price: 129.9,
    maxUsers: 8,
    description: "Até 8 usuários, Multi-Caixas, BI Avançado e Suporte Prioritário.",
  },
  EXTRA_SEAT: {
    id: "EXTRA_SEAT",
    name: "Usuário Extra Adicional",
    price: 14.9,
    maxUsers: 1,
    description: "Adiciona +1 colaborador na equipe da sua oficina.",
  },
};

const MP_ACCESS_TOKEN =
  process.env.MP_ACCESS_TOKEN ||
  "TEST-0000000000000000-000000-00000000000000000000000000000000-000000000";

const APP_URL = process.env.APP_URL || "https://torquerp.com.br";

/**
 * Cria cobrança instantânea via PIX no Mercado Pago
 */
export async function createMercadoPagoPixPayment(tenant: {
  id: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  document?: string | null;
}, amount: number, planName: string = "Plano Torque Pro") {
  return new Promise<{
    payment_id: string;
    status: string;
    qr_code: string;
    qr_code_base64: string;
    ticket_url?: string;
  }>((resolve, reject) => {
    const cleanDoc = tenant.document?.replace(/\D/g, "") || "00000000000";
    const docType = cleanDoc.length > 11 ? "CNPJ" : "CPF";

    const postData = JSON.stringify({
      transaction_amount: Number(amount),
      description: `${planName} - Torque ERP (${tenant.name})`,
      payment_method_id: "pix",
      payer: {
        email: tenant.ownerEmail,
        first_name: tenant.ownerName.split(" ")[0] || "Cliente",
        last_name: tenant.ownerName.split(" ").slice(1).join(" ") || "Oficina",
        identification: {
          type: docType,
          number: cleanDoc,
        },
      },
      external_reference: tenant.id,
      notification_url: `${APP_URL}/api/webhooks/mercadopago`,
    });

    const req = https.request(
      {
        hostname: "api.mercadopago.com",
        path: "/v1/payments",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
          "X-Idempotency-Key": `pix_${tenant.id}_${Date.now()}`,
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            const data = JSON.parse(body);
            if (data.id) {
              const poi = data.point_of_interaction?.transaction_data;
              resolve({
                payment_id: String(data.id),
                status: data.status,
                qr_code: poi?.qr_code || "",
                qr_code_base64: poi?.qr_code_base64 || "",
                ticket_url: poi?.ticket_url,
              });
            } else {
              reject(new Error(data.message || "Erro ao gerar PIX no Mercado Pago"));
            }
          } catch (e) {
            reject(e);
          }
        });
      }
    );

    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Cria assinatura recorrente no Cartão de Crédito via Mercado Pago (/preapproval)
 */
export async function createMercadoPagoPreapproval(tenant: {
  id: string;
  name: string;
  ownerEmail: string;
}, amount: number, planName: string = "Plano Torque Pro") {
  return new Promise<{
    preapproval_id: string;
    init_point: string;
  }>((resolve, reject) => {
    const postData = JSON.stringify({
      payer_email: tenant.ownerEmail,
      back_url: `${APP_URL}/assinatura?status=sucesso`,
      reason: `${planName} - Torque ERP`,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: Number(amount),
        currency_id: "BRL",
      },
      external_reference: tenant.id,
      notification_url: `${APP_URL}/api/webhooks/mercadopago`,
    });

    const req = https.request(
      {
        hostname: "api.mercadopago.com",
        path: "/preapproval",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            const data = JSON.parse(body);
            if (data.id && data.init_point) {
              resolve({
                preapproval_id: data.id,
                init_point: data.init_point,
              });
            } else {
              reject(new Error(data.message || "Erro ao criar assinatura recorrente no Mercado Pago"));
            }
          } catch (e) {
            reject(e);
          }
        });
      }
    );

    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Consulta status de um pagamento pelo ID no Mercado Pago
 */
export async function getMercadoPagoPaymentStatus(paymentId: string) {
  return new Promise<any>((resolve, reject) => {
    const req = https.request(
      {
        hostname: "api.mercadopago.com",
        path: `/v1/payments/${paymentId}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            const data = JSON.parse(body);
            resolve(data);
          } catch (e) {
            reject(e);
          }
        });
      }
    );

    req.on("error", reject);
    req.end();
  });
}
