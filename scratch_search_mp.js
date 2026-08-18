const https = require("https");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || "APP_USR-3945624784861896-081711-c8ce9ea1bd442067bbb967c0986dba83-56376011";

function searchPayments() {
  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: "api.mercadopago.com",
        path: `/v1/payments/search?sort=date_created&criteria=desc&limit=10`,
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
  const result = await searchPayments();
  console.log("SEARCH PAYMENTS TOTAL:", result.paging?.total);
  if (result.results) {
    for (const p of result.results) {
      console.log(`Payment ID: ${p.id} | Status: ${p.status} | Amount: ${p.transaction_amount} | Date: ${p.date_created} | Payer: ${p.payer?.email} | ExtRef: ${p.external_reference} | Desc: ${p.description}`);
    }
  } else {
    console.log("Nenhum resultado ou erro:", JSON.stringify(result, null, 2));
  }
}

main().finally(() => prisma.$disconnect());
