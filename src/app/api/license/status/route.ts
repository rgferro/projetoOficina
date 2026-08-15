import { NextResponse } from "next/server";
import { checkLicenseStatus } from "@/lib/licensing";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = checkLicenseStatus();
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao consultar status da licença" },
      { status: 500 }
    );
  }
}
