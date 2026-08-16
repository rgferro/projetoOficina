import { NextResponse } from "next/server";

export async function GET() {
  const adsContent = `# Google AdSense - Torque ERP
google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0
`;
  return new NextResponse(adsContent, {
    headers: { "Content-Type": "text/plain" },
  });
}
