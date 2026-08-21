export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { imageUrl, type, caption } = body;

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json({ error: "Imagem é obrigatória" }, { status: 400 });
    }

    // 🛡️ Validação de Segurança: Bloqueia scripts, SVGs com XSS e MIME types não seguros
    const isValidImage =
      imageUrl.startsWith("data:image/jpeg;base64,") ||
      imageUrl.startsWith("data:image/jpg;base64,") ||
      imageUrl.startsWith("data:image/png;base64,") ||
      imageUrl.startsWith("data:image/webp;base64,") ||
      imageUrl.startsWith("https://") ||
      imageUrl.startsWith("http://");

    if (!isValidImage) {
      return NextResponse.json(
        { error: "Formato de arquivo inválido. Apenas imagens JPEG, PNG ou WebP são permitidas." },
        { status: 400 }
      );
    }

    // Limite de tamanho máximo de 8MB por imagem em Base64
    if (imageUrl.length > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "A imagem excede o tamanho máximo permitido de 8MB." },
        { status: 400 }
      );
    }

    const { tenantId } = await (await import("@/lib/tenant")).getTenantContext(request);

    const order = await prisma.serviceOrder.findFirst({
      where: { id, tenantId },
    });

    if (!order) {
      return NextResponse.json({ error: "OS não encontrada nesta oficina" }, { status: 404 });
    }

    const photo = await prisma.serviceOrderPhoto.create({
      data: {
        serviceOrderId: id,
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
  { params }: { params: Promise<{ id: string }> }
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
