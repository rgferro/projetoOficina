const https = require("https");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || "APP_USR-3945624784861896-081711-c8ce9ea1bd442067bbb967c0986dba83-56376011";

function checkMP(paymentId) {
  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: "api.mercadopago.com",
        path: `/v1/payments/${paymentId}`,
        method: "GET",
        headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve({ error: e.message, raw: body });
          }
        });
      }
    );
    req.on("error", (err) => resolve({ error: err.message }));
    req.end();
  });
}

async function main() {
  const p1 = await checkMP("173435992181");
  console.log("PIX 173435992181 STATUS:", p1.status, p1.status_detail, p1.transaction_amount);

  const p2 = await checkMP("1327894414");
  console.log("PIX 1327894414 STATUS:", p2.status, p2.status_detail, p2.transaction_amount);
}

main().finally(() => prisma.$disconnect());
