import { NextRequest, NextResponse } from "next/server";
import { disconnectWhatsAppSession } from "@/lib/whatsappService";
import { getTenantContext } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { session, isMaster } = await getTenantContext(req);

    const isAdmin =
      isMaster ||
      session?.accessLevel === "ADMIN" ||
      session?.role === "Administrador" ||
      session?.role === "Proprietário" ||
      session?.isOwner === true;

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem desconectar o WhatsApp." },
        { status: 403 }
      );
    }

    const whatsappData = await disconnectWhatsAppSession();
    return NextResponse.json(whatsappData);
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao desconectar" }, { status: 500 });
  }
}

