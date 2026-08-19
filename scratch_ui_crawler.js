const http = require("http");

async function checkRoute(path) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:3000${path}`, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({ path, statusCode: res.statusCode, length: data.length });
      });
    });
    req.on("error", (err) => {
      resolve({ path, statusCode: 0, error: err.message });
    });
  });
}

async function runRouteCrawler() {
  console.log("=== INICIANDO VARREDURA E TESTE PESADO DE ROTAS E TELAS DO SISTEMA ===");

  const routes = [
    // Páginas Públicas e Institucionais
    "/",
    "/login",
    "/cadastro",
    "/assinatura",
    "/contato",
    "/sobre",
    "/termos",
    "/privacidade",
    "/sistema-para-oficina-mecanica",
    "/sistema-para-lava-jato",
    "/manual",

    // Páginas do Painel / Sistema Operacional
    "/dashboard",
    "/oficina",
    "/oficina/nova",
    "/lavajato",
    "/pdv",
    "/clientes",
    "/estoque",
    "/financeiro",
    "/crm",
    "/equipe",
    "/fornecedores",
    "/servicos",
    "/relatorios",
    "/configuracoes",
    "/master-admin",

    // Endpoints Críticos de API
    "/api/configuracoes",
    "/api/clientes",
    "/api/veiculos",
    "/api/oficina",
    "/api/lavajato",
    "/api/produtos",
    "/api/servicos-padrao",
    "/api/fornecedores",
    "/api/crm",
    "/api/financeiro",
    "/api/relatorios",
    "/api/subscription/status",
  ];

  let passed = 0;
  let failed = 0;

  for (const route of routes) {
    const res = await checkRoute(route);
    if (res.statusCode >= 200 && res.statusCode < 500) {
      console.log(`[PASS] ${res.statusCode} -> ${route} (${res.length} bytes)`);
      passed++;
    } else {
      console.log(`[FAIL] ${res.statusCode || "ERR"} -> ${route} (${res.error || ""})`);
      failed++;
    }
  }

  console.log(`\n=== RESUMO: ${passed} PASSADOS / ${failed} FALHAS ===`);
}

runRouteCrawler();
