import { NextResponse } from "next/server";
import { activateSystem } from "@/lib/licensing";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { licenseKey, companyName } = body;

    if (!licenseKey) {
      return NextResponse.json(
        { error: "A Chave de Licença é obrigatória." },
        { status: 400 }
      );
    }

    const result = activateSystem(licenseKey, companyName);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message, status: result.status },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar ativação de licença" },
      { status: 500 }
    );
  }
}
