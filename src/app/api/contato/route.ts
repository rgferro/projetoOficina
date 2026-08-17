import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendContactEmail } from "@/lib/email";

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

    const cleanSubject = subject || "Dúvida Comercial / Suporte Torque ERP";

    // 1. Salva a mensagem de contato no banco de dados para o Master Admin
    const contactMsg = await prisma.contactMessage.create({
      data: {
        name,
        email,
        phone: phone || "",
        subject: cleanSubject,
        message,
        status: "UNREAD",
      },
    });

    // 2. Despacha e-mail para rafael.gielow@gmail.com via Brevo REST API
    await sendContactEmail({
      name,
      senderEmail: email,
      phone: phone || "",
      subject: cleanSubject,
      message,
    }).catch((err) => {
      console.warn("Aviso ao despachar e-mail do Fale Conosco:", err);
    });

    console.log(`📩 [Fale Conosco] Nova mensagem de ${name} (${email}): ${cleanSubject}`);

    return NextResponse.json({
      success: true,
      message: "Sua mensagem foi enviada com sucesso! Nossa equipe entrará em contato em breve.",
      id: contactMsg.id,
    });
  } catch (error: any) {
    console.error("Erro ao processar mensagem de contato:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao processar mensagem. Tente novamente mais tarde." },
      { status: 500 }
    );
  }
}
