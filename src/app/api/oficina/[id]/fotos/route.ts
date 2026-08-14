import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { imageUrl, type, caption } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: "Imagem é obrigatória" }, { status: 400 });
    }

    const photo = await prisma.serviceOrderPhoto.create({
      data: {
        serviceOrderId: params.id,
        imageUrl,
        type: type || "AVARIA",
        caption: caption || null,
      },
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao salvar foto" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get("photoId");

    if (!photoId) {
      return NextResponse.json({ error: "photoId é obrigatório" }, { status: 400 });
    }

    await prisma.serviceOrderPhoto.delete({
      where: { id: photoId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao excluir foto" }, { status: 500 });
  }
}
