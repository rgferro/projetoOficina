import { NextRequest, NextResponse } from "next/server";
import { getWhatsAppSession, connectWhatsAppSession } from "@/lib/whatsappService";
import { getTenantContext } from "@/lib/tenant";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { session, isMaster, tenantId } = await getTenantContext(req);

    // 1. Restringe para Perfil Administrador ('ADMIN' / 'DONO' / Master)
    const isAdmin =
      isMaster ||
      session?.accessLevel === "ADMIN" ||
      session?.role === "Administrador" ||
      session?.role === "Proprietário" ||
      session?.isOwner === true;

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem gerenciar o pareamento do WhatsApp." },
        { status: 403 }
      );
    }

    const whatsappData = await getWhatsAppSession();

    // 3. Log de auditoria ao emitir/consultar QR Code ativo
    if (whatsappData.status === "QR_READY" && whatsappData.qrCodeUrl) {
      await logAuditEvent({
        action: "WHATSAPP_QRCODE_REQUESTED",
        req,
        tenantId,
        userEmail: session?.email || "admin",
        details: {
          userId: session?.userId || "unknown",
          ttlSeconds: 45,
          qrGeneratedAt: whatsappData.qrGeneratedAt || new Date().toISOString(),
        },
      });
    }

    return NextResponse.json(whatsappData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao obter status" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session, isMaster } = await getTenantContext(request);

    // 1. Restringe para Perfil Administrador ('ADMIN' / 'DONO' / Master)
    const isAdmin =
      isMaster ||
      session?.accessLevel === "ADMIN" ||
      session?.role === "Administrador" ||
      session?.role === "Proprietário" ||
      session?.isOwner === true;

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem conectar o WhatsApp." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { phoneNumber } = body;
    const whatsappData = connectWhatsAppSession(phoneNumber);
    return NextResponse.json(whatsappData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao conectar" }, { status: 500 });
  }
}

