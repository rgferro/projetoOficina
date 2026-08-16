import { NextResponse } from "next/server";

export async function GET() {
  const robots = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /master-admin

Sitemap: https://torquerp.com.br/sitemap.xml
`;
  return new NextResponse(robots, {
    headers: { "Content-Type": "text/plain" },
  });
}
