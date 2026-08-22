import { NextRequest, NextResponse } from "next/server";
import {
  SYSTEM_PROMPT,
  queryLocalKnowledge,
  getContextualSuggestions,
  ActionLink,
} from "@/lib/ai-knowledge";

function extractRouteActions(text: string): ActionLink[] {
  const routesMap: { [pattern: string]: { label: string; url: string } } = {
    "/oficina": { label: "Ir para Oficina", url: "/oficina" },
    "/lavajato": { label: "Ir para Lava-Jato", url: "/lavajato" },
    "/pdv": { label: "Abrir PDV Balcão", url: "/pdv" },
    "/estoque": { label: "Ver Estoque", url: "/estoque" },
    "/clientes": { label: "Ver Clientes", url: "/clientes" },
    "/veiculos": { label: "Ver Veículos", url: "/veiculos" },
    "/financeiro": { label: "Abrir Financeiro", url: "/financeiro" },
    "/crm": { label: "Conectar WhatsApp / CRM", url: "/crm" },
    "/equipe": { label: "Gerenciar Equipe", url: "/equipe" },
    "/relatorios": { label: "Ver Relatórios", url: "/relatorios" },
    "/assinatura": { label: "Ver Planos & Assinaturas", url: "/assinatura" },
    "/configuracoes": { label: "Configurações", url: "/configuracoes" },
  };

  const actions: ActionLink[] = [];
  const lower = text.toLowerCase();

  for (const [route, action] of Object.entries(routesMap)) {
    if (text.includes(route) || lower.includes(action.label.toLowerCase())) {
      if (!actions.some((a) => a.url === action.url)) {
        actions.push(action);
      }
    }
  }

  return actions.slice(0, 3);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, currentPath = "/dashboard", history = [] } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Mensagem não informada." },
        { status: 400 }
      );
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const openAiKey = process.env.OPENAI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    // 1. Tentar Google Gemini se a chave estiver configurada
    if (geminiKey) {
      try {
        const contents = [
          ...history.map((h: { role: string; content: string }) => ({
            role: h.role === "user" ? "user" : "model",
            parts: [{ text: h.content }],
          })),
          {
            role: "user",
            parts: [
              {
                text: `[Contexto da tela atual do usuário: ${currentPath}]\nPergunta do Usuário: ${message}`,
              },
            ],
          },
        ];

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents,
              systemInstruction: {
                parts: [{ text: SYSTEM_PROMPT }],
              },
              generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 800,
              },
            }),
            signal: AbortSignal.timeout(10000),
          }
        );

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const reply =
            data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (reply) {
            const actions = extractRouteActions(reply);
            return NextResponse.json({
              reply,
              actions: actions.length > 0 ? actions : undefined,
              suggestions: getContextualSuggestions(currentPath),
              source: "gemini",
            });
          }
        }
      } catch (err) {
        console.warn("[Torque IA] Erro ao chamar Gemini, acionando fallback local:", err);
      }
    }

    // 2. Tentar OpenAI se configurada
    if (openAiKey) {
      try {
        const messages = [
          { role: "system", content: SYSTEM_PROMPT },
          ...history.map((h: { role: string; content: string }) => ({
            role: h.role === "user" ? "user" : "assistant",
            content: h.content,
          })),
          {
            role: "user",
            content: `[Tela atual: ${currentPath}] ${message}`,
          },
        ];

        const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openAiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages,
            temperature: 0.4,
            max_tokens: 800,
          }),
          signal: AbortSignal.timeout(10000),
        });

        if (openAiRes.ok) {
          const data = await openAiRes.json();
          const reply = data?.choices?.[0]?.message?.content?.trim();
          if (reply) {
            const actions = extractRouteActions(reply);
            return NextResponse.json({
              reply,
              actions: actions.length > 0 ? actions : undefined,
              suggestions: getContextualSuggestions(currentPath),
              source: "openai",
            });
          }
        }
      } catch (err) {
        console.warn("[Torque IA] Erro ao chamar OpenAI, acionando fallback local:", err);
      }
    }

    // 3. Tentar Groq se configurada
    if (groqKey) {
      try {
        const messages = [
          { role: "system", content: SYSTEM_PROMPT },
          ...history.map((h: { role: string; content: string }) => ({
            role: h.role === "user" ? "user" : "assistant",
            content: h.content,
          })),
          {
            role: "user",
            content: `[Tela atual: ${currentPath}] ${message}`,
          },
        ];

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages,
            temperature: 0.4,
            max_tokens: 800,
          }),
          signal: AbortSignal.timeout(10000),
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          const reply = data?.choices?.[0]?.message?.content?.trim();
          if (reply) {
            const actions = extractRouteActions(reply);
            return NextResponse.json({
              reply,
              actions: actions.length > 0 ? actions : undefined,
              suggestions: getContextualSuggestions(currentPath),
              source: "groq",
            });
          }
        }
      } catch (err) {
        console.warn("[Torque IA] Erro ao chamar Groq, acionando fallback local:", err);
      }
    }

    // 4. Fallback Resiliente para Motor de Conhecimento Local Especializado
    const localResult = queryLocalKnowledge(message, currentPath);
    return NextResponse.json(localResult);
  } catch (error: any) {
    console.error("[Torque IA] Erro interno na rota de chat:", error);
    return NextResponse.json(
      {
        reply: "Desculpe, ocorreu uma instabilidade momentânea ao processar sua pergunta. Por favor, tente novamente em alguns instantes.",
        suggestions: ["Como criar uma OS?", "Como abrir o PDV?", "Planos e Preços"],
        source: "local-engine",
      },
      { status: 500 }
    );
  }
}
