import { NextResponse } from "next/server";
import { disconnectWhatsAppSession } from "@/lib/whatsappService";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = await disconnectWhatsAppSession();
    return NextResponse.json(session);
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao desconectar" }, { status: 500 });
  }
}
