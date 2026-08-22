"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bot,
  X,
  Send,
  Sparkles,
  Maximize2,
  Minimize2,
  Trash2,
  Mic,
  MicOff,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Zap,
} from "lucide-react";
import { ActionLink, getContextualSuggestions } from "@/lib/ai-knowledge";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: ActionLink[];
  suggestions?: string[];
  timestamp: string;
}

export function AiChatbot() {
  const pathname = usePathname();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Inicializar mensagens padrão ou restaurar do localStorage
  useEffect(() => {
    const saved = localStorage.getItem("torque_ai_messages");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      } catch (e) {
        console.error("Erro ao carregar mensagens do chat:", e);
      }
    }

    // Mensagem inicial de boas-vindas
    const welcomeMsg: Message = {
      id: "welcome-1",
      role: "assistant",
      content: `Olá! Sou o **Torque IA**, seu assistente especializado do **Torque ERP** 🚗⚡\n\nEstou aqui para tirar dúvidas, guiar seus primeiros passos ou ajudar com Ordens de Serviço, PDV, Lava-Jato, WhatsApp e Financeiro.\n\nComo posso acelerar seu dia hoje?`,
      suggestions: getContextualSuggestions(pathname),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages([welcomeMsg]);
  }, []);

  // Salvar histórico no localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("torque_ai_messages", JSON.stringify(messages.slice(-20)));
    }
  }, [messages]);

  // Listener para eventos de abertura externa (ex: botão no Header)
  useEffect(() => {
    const handleOpenAi = () => {
      setIsOpen(true);
      setHasUnread(false);
    };
    window.addEventListener("torque:open-ai-chat", handleOpenAi);
    return () => {
      window.removeEventListener("torque:open-ai-chat", handleOpenAi);
    };
  }, []);

  // Rolar para o final do chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  // Inicializar Speech Recognition (Nativo)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "pt-BR";

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInputMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
          }
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("Reconhecimento de voz não suportado pelo seu navegador.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch (err) {
        setIsListening(false);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Histórico recente para contexto
      const historyContext = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          currentPath: pathname,
          history: historyContext,
        }),
      });

      if (!res.ok) {
        throw new Error("Falha na comunicação");
      }

      const data = await res.json();
      const assistantMsg: Message = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: data.reply || "Aqui está a orientação solicitada.",
        actions: data.actions,
        suggestions: data.suggestions,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const fallbackMsg: Message = {
        id: `ai-err-${Date.now()}`,
        role: "assistant",
        content:
          "Tive um problema momentâneo ao processar sua dúvida. Você pode tentar reformular ou usar os atalhos abaixo.",
        suggestions: getContextualSuggestions(pathname),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    const welcomeMsg: Message = {
      id: `welcome-${Date.now()}`,
      role: "assistant",
      content: `Histórico limpo! Como posso te ajudar agora? 🚗⚡`,
      suggestions: getContextualSuggestions(pathname),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages([welcomeMsg]);
    localStorage.removeItem("torque_ai_messages");
  };

  const handleActionClick = (url: string) => {
    router.push(url);
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  // Renderizador simples de Markdown para formatação bonita
  const renderFormattedContent = (content: string) => {
    return content.split("\n").map((line, idx) => {
      if (line.startsWith("### ")) {
        return (
          <h4 key={idx} className="font-bold text-slate-900 mt-2 mb-1 text-sm flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 inline" />
            {line.replace("### ", "")}
          </h4>
        );
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <li key={idx} className="ml-4 list-disc text-slate-700 text-xs sm:text-sm my-0.5 leading-relaxed">
            {formatBold(line.substring(2))}
          </li>
        );
      }
      if (/^\d+\.\s/.test(line)) {
        return (
          <div key={idx} className="flex items-start gap-1.5 text-slate-700 text-xs sm:text-sm my-1 leading-relaxed">
            <span className="font-bold text-blue-600 min-w-[18px]">{line.match(/^\d+\./)?.[0]}</span>
            <span>{formatBold(line.replace(/^\d+\.\s/, ""))}</span>
          </div>
        );
      }
      if (line.trim() === "") {
        return <div key={idx} className="h-1.5" />;
      }
      return (
        <p key={idx} className="text-slate-700 text-xs sm:text-sm my-0.5 leading-relaxed">
          {formatBold(line)}
        </p>
      );
    });
  };

  const formatBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return (
          <em key={i} className="italic text-slate-600">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* Botão Flutuante Discreto (Canto Inferior Direito) */}
      {!isOpen && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-40">
          <button
            onClick={() => {
              setIsOpen(true);
              setHasUnread(false);
            }}
            className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
            title="Assistente IA de Suporte"
          >
            <div className="relative">
              <Bot className="w-6 h-6 text-white animate-bounce-short" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full animate-pulse" />
            </div>
            <span className="font-semibold text-sm tracking-wide hidden sm:inline">
              Torque IA
            </span>
            <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-medium hidden md:inline">
              Suporte
            </span>
          </button>
        </div>
      )}

      {/* Janela do Chat Flutuante */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 flex flex-col bg-white shadow-2xl border border-slate-200 overflow-hidden ${
            isExpanded
              ? "inset-4 sm:inset-10 rounded-2xl"
              : "bottom-20 lg:bottom-6 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[420px] h-[580px] max-h-[85vh] rounded-2xl"
          }`}
        >
          {/* Top Bar / Header */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative p-2 bg-blue-600/30 border border-blue-400/30 rounded-xl">
                <Bot className="w-5 h-5 text-blue-400" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-900 rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white">Torque IA</h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
                    Online
                  </span>
                </div>
                <p className="text-xs text-slate-300">Assistente Especialista Automotivo</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearHistory}
                className="p-1.5 text-slate-400 hover:text-red-300 hover:bg-white/10 rounded-lg transition-colors"
                title="Limpar Conversa"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors hidden sm:inline-block"
                title={isExpanded ? "Reduzir" : "Expandir"}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Área de Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-sm ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-none"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div>{renderFormattedContent(msg.content)}</div>
                  ) : (
                    <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  )}

                  {/* Botões de Ação Direta */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-2">
                      {msg.actions.map((act, i) => (
                        <button
                          key={i}
                          onClick={() => handleActionClick(act.url)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 transition-colors shadow-xs"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                          {act.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <div
                    className={`text-[10px] mt-1.5 text-right ${
                      msg.role === "user" ? "text-blue-200" : "text-slate-400"
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {/* Sugestões Rápidas de Próximas Perguntas */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 max-w-[95%]">
                    {msg.suggestions.map((sug, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(sug)}
                        className="text-left text-xs bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-700 px-2.5 py-1 rounded-full border border-slate-200 hover:border-blue-300 transition-all duration-200 flex items-center gap-1 shadow-2xs"
                      >
                        <Zap className="w-3 h-3 text-amber-500" />
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-slate-500 bg-white border border-slate-200 rounded-2xl px-4 py-2.5 max-w-[200px] shadow-xs">
                <Bot className="w-4 h-4 text-blue-600 animate-spin" />
                <span className="text-xs font-medium">Torque IA digitando...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Barra de Entrada / Input */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Pergunte qualquer coisa sobre o sistema..."
                  className="w-full pl-3 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
                    isListening
                      ? "bg-red-500 text-white animate-pulse"
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-200"
                  }`}
                  title={isListening ? "Parar Gravação" : "Falar por Voz"}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-xl shadow-md transition-all flex items-center justify-center"
                title="Enviar Mensagem"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>Pressione Enter para enviar</span>
              <span className="flex items-center gap-1 text-slate-500 font-medium">
                <Sparkles className="w-3 h-3 text-amber-500" /> Torque IA v3.3
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
