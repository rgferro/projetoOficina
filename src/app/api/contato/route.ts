import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, error: "Preencha todos os campos obrigatórios." },
        { status: 400 }
      );
    }

    // Salva a mensagem de contato no banco de dados para o Master Admin
    const contactMsg = await prisma.contactMessage.create({
      data: {
        name,
        email,
        phone: phone || "",
        subject: subject || "Dúvida Comercial / Suporte Torque ERP",
        message,
        status: "UNREAD",
      },
    });

    console.log(`📩 [Fale Conosco] Nova mensagem de ${name} (${email}): ${subject}`);

    return NextResponse.json({
      success: true,
      message: "Sua mensagem foi enviada com sucesso! Nossa equipe entrará em contato em breve.",
      id: contactMsg.id,
    });
  } catch (error: any) {
    console.error("Erro ao enviar mensagem de contato:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao enviar mensagem. Tente novamente mais tarde." },
      { status: 500 }
    );
  }
}
