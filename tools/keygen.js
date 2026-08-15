#!/usr/bin/env node

/**
 * =========================================================================
 *  GERADOR DE CHAVES DE LICENÇA (KEYGEN) - USO INTERNO & SUPORTE
 *  AutoGestão ERP Automotivo Pro
 * =========================================================================
 * 
 * Uso via linha de comando:
 *   node tools/keygen.js OFC-XXXX-XXXX-XXXX
 *   ou
 *   node tools/keygen.js --hwid OFC-XXXX-XXXX-XXXX --name "Oficina Silva"
 *   ou apenas:
 *   node tools/keygen.js (modo interativo)
 */

const crypto = require("crypto");
const readline = require("readline");

const PROJECT_ID = "AUTOGESTAO_OFICINA";
const PROJECT_SECRET = "OFICINA_SECRET_2026_AG_PROD_KEY_9981";
const PROJECT_PREFIX = "OFC";

function generateKey(hwid, projectId = PROJECT_ID, secret = PROJECT_SECRET) {
  const cleanHwid = hwid.trim().toUpperCase();
  const payload = `${cleanHwid}|${projectId}|LIFETIME`;

  const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex").toUpperCase();

  const p1 = hmac.substring(0, 4);
  const p2 = hmac.substring(4, 8);
  const p3 = hmac.substring(8, 12);
  const p4 = hmac.substring(12, 16);

  return `LIC-${PROJECT_PREFIX}-${p1}-${p2}-${p3}-${p4}`;
}

function printBanner() {
  console.log("=======================================================================");
  console.log("      AUTOGESTAO ERP - GERADOR DE CHAVES DE LICENCA (KEYGEN)");
  console.log("                    (USO EXCLUSIVO DO SUPORTE)                 ");
  console.log("=======================================================================");
  console.log(` Projeto Identificador : ${PROJECT_ID}`);
  console.log(` Prefixo de Chave      : LIC-${PROJECT_PREFIX}`);
  console.log("-----------------------------------------------------------------------");
}

function processKeygen(hwid, clientName) {
  if (!hwid) {
    console.error("❌ ERRO: Hardware ID e obrigatorio.");
    process.exit(1);
  }

  const cleanHwid = hwid.trim().toUpperCase();
  const key = generateKey(cleanHwid);

  console.log("\n=======================================================================");
  console.log("                  CHAVE DE ATIVACAO GERADA COM SUCESSO                 ");
  console.log("=======================================================================");
  if (clientName) {
    console.log(` Cliente / Empresa : ${clientName}`);
  }
  console.log(` Hardware ID       : ${cleanHwid}`);
  console.log(` Tipo de Licenca   : VITALICIA (LIFETIME - 100% Offline)`);
  console.log("-----------------------------------------------------------------------");
  console.log(` >>> CHAVE : ${key} <<<`);
  console.log("-----------------------------------------------------------------------");
  console.log(" Instrucao para o cliente:");
  console.log(" 1. Abra o sistema no computador.");
  console.log(" 2. Cole a chave acima no campo 'Chave de Licenca' e clique em Ativar.");
  console.log("=======================================================================\n");
}

// Verifica se foi passado via argumento CLI
const args = process.argv.slice(2);

if (args.length > 0) {
  printBanner();
  let hwidArg = "";
  let nameArg = "";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--hwid" && args[i + 1]) {
      hwidArg = args[i + 1];
      i++;
    } else if (args[i] === "--name" && args[i + 1]) {
      nameArg = args[i + 1];
      i++;
    } else if (!hwidArg && !args[i].startsWith("--")) {
      hwidArg = args[i];
    }
  }

  processKeygen(hwidArg, nameArg);
} else {
  // Modo interativo
  printBanner();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("Digite o Hardware ID do cliente (ex: OFC-8821-49F2-C091): ", (hwid) => {
    rl.question("Nome do Cliente / Oficina (opcional): ", (name) => {
      processKeygen(hwid, name);
      rl.close();
    });
  });
}
