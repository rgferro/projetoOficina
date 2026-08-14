import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date"); // YYYY-MM-DD ou vazio

    let startOfDay: Date;
    let endOfDay: Date;

    if (dateParam) {
      const parts = dateParam.split("-");
      startOfDay = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 0, 0, 0, 0);
      endOfDay = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 23, 59, 59, 999);
    } else {
      // Hoje por padrão
      const now = new Date();
      startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    }

    const transactions = await prisma.financialTransaction.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { date: "desc" },
    });

    // Totalizadores do dia
    let totalIncome = 0;
    let totalExpense = 0;
    const byMethod: Record<string, number> = {
      PIX: 0,
      DINHEIRO: 0,
      CARTAO_CREDITO: 0,
      CARTAO_DEBITO: 0,
      BOLETO: 0,
    };

    transactions.forEach((tx) => {
      if (tx.type === "RECEITA") {
        totalIncome += tx.amount;
        if (byMethod[tx.paymentMethod] !== undefined) {
          byMethod[tx.paymentMethod] += tx.amount;
        } else {
          byMethod[tx.paymentMethod] = tx.amount;
        }
      } else if (tx.type === "DESPESA") {
        totalExpense += tx.amount;
      }
    });

    const netBalance = totalIncome - totalExpense;

    return NextResponse.json({
      date: dateParam || new Date().toISOString().split("T")[0],
      summary: {
        totalIncome,
        totalExpense,
        netBalance,
        byMethod,
      },
      transactions,
    });
  } catch (error) {
    console.error("Erro ao buscar dados do financeiro:", error);
    return NextResponse.json({ error: "Erro ao buscar transações" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { description, type, category, amount, paymentMethod, date } = body;

    if (!description || !type || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: "Descrição, Tipo, Valor e Forma de Pagamento são obrigatórios" },
        { status: 400 }
      );
    }

    const transaction = await prisma.financialTransaction.create({
      data: {
        description,
        type, // RECEITA ou DESPESA
        category: category || "OUTROS",
        amount: Number(amount),
        paymentMethod,
        date: date ? new Date(date) : new Date(),
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao criar lançamento" }, { status: 500 });
  }
}
