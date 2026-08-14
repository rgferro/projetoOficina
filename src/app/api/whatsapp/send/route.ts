import { NextResponse } from "next/server";
import { sendSilentWhatsAppMessage } from "@/lib/whatsappService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, message, customerName, referenceType, referenceId } = body;

    if (!phone || !message) {
      return NextResponse.json(
        { error: "Telefone e texto da mensagem são obrigatórios" },
        { status: 400 }
      );
    }

    const result = await sendSilentWhatsAppMessage({
      phone,
      message,
      customerName,
      referenceType,
      referenceId,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Erro ao enviar WhatsApp interno:", error);
    return NextResponse.json(
      { error: error.message || "Falha ao enviar mensagem de WhatsApp" },
      { status: 500 }
    );
  }
}
