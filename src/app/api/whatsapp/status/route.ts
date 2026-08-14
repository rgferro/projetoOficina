import { NextResponse } from "next/server";
import { getWhatsAppSession, connectWhatsAppSession } from "@/lib/whatsappService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getWhatsAppSession();
    return NextResponse.json(session);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao obter status" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phoneNumber } = body;
    const session = connectWhatsAppSession(phoneNumber);
    return NextResponse.json(session);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao conectar" }, { status: 500 });
  }
}
