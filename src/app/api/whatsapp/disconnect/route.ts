import { NextResponse } from "next/server";
import { disconnectWhatsAppSession } from "@/lib/whatsappService";

export async function POST() {
  try {
    const session = disconnectWhatsAppSession();
    return NextResponse.json(session);
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao desconectar" }, { status: 500 });
  }
}
