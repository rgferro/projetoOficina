import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = "https://torquerp.com.br";
  const pages = [
    "",
    "/sistema-para-oficina-mecanica",
    "/sistema-para-lava-jato",
    "/cadastro",
    "/login",
    "/sobre",
    "/contato",
    "/assinatura",
    "/termos",
    "/privacidade",
    "/manual",
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (page) => `  <url>
    <loc>${baseUrl}${page}</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page === "" ? "1.0" : "0.8"}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: { "Content-Type": "application/xml" },
  });
}
