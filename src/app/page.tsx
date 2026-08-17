import Link from "next/link";
import {
  Zap,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Droplets,
  Wrench,
  ShoppingCart,
  MessageSquare,
  QrCode,
  Users,
  ChevronRight,
  Star,
  Sparkles,
} from "lucide-react";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="space-y-16 pb-16">
      {/* 🚀 HERO SECTION */}
      <section className="relative overflow-hidden pt-6 sm:pt-10 pb-8 text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-black shadow-sm">
          <Zap className="w-3.5 h-3.5 fill-current text-amber-500" />
          <span>O ERP Automotivo Mais Rápido do Brasil • 100% Web</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight">
          Acelere a Gestão da sua <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 bg-clip-text text-transparent">
            Oficina & Lava-Jato
          </span>
        </h1>

        <p className="text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Controle de ordens de serviço com fotos de avarias, pátio kanban, PDV de peças com código de barras e <strong>avisos automáticos no WhatsApp</strong> em uma plataforma simples e completa.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            Entrar no Painel Operacional
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/assinatura"
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300 shadow-sm flex items-center justify-center gap-2 transition-all"
          >
            Ver Planos (Grátis até 2 Usuários)
          </Link>
        </div>

        <div className="flex items-center justify-center gap-6 pt-4 text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>2 Usuários Grátis</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Sem Cartão de Crédito</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>100% Online na Nuvem</span>
          </div>
        </div>
      </section>

      {/* 🛠️ RECURSOS ESSENCIAIS */}
      <section className="space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Tudo o que sua oficina precisa do pátio ao caixa
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Ferramentas integradas para acabar com planilhas e papéis perdidos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 hover:border-blue-300 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Wrench className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Oficina & Ordens de Serviço</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Checklist de entrada com fotos de avarias, diagnóstico técnico, peças, comissão de mecânicos e termo de garantia de 90 dias.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 hover:border-cyan-300 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
              <Droplets className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Lava-Jato & Pátio Kanban</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Controle visual de filas e lavagens. Disparo automático no WhatsApp do cliente avisando quando o carro estiver limpo.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 hover:border-emerald-300 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">PDV Balcão & Caixa</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Venda rápida de peças e lubrificantes com leitor de código de barras, pagamentos em PIX e Cartão com cálculo de troco.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 hover:border-rose-300 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">CRM WhatsApp Marketing</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Lembretes de troca de óleo a cada 6 meses, lembretes de lavagem e cupons de aniversário automáticos para fidelizar clientes.
            </p>
          </div>
        </div>
      </section>

      {/* 💰 TABELA DE PLANOS & PREÇOS */}
      <section className="bg-slate-900 text-white p-8 sm:p-12 rounded-3xl shadow-2xl space-y-8 relative overflow-hidden">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-black uppercase tracking-widest text-amber-400">
            Planos & Preços Transparentes
          </span>
          <h2 className="text-2xl sm:text-3xl font-black">
            Escolha o plano ideal para a sua oficina
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Comece de graça e faça upgrade quando sua equipe crescer. Cobrança via PIX ou Cartão no Mercado Pago.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Starter */}
          <div className="bg-slate-800/90 rounded-2xl p-6 border border-slate-700 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase text-slate-400">Starter (Grátis)</div>
              <div className="text-3xl font-black text-white">R$ 0,00</div>
              <p className="text-xs text-slate-300">Até 2 Usuários (Dono + 1 Operador)</p>
              <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-700">
                <li className="flex items-center gap-2">✓ Até 30 OS/mês</li>
                <li className="flex items-center gap-2">✓ Até 50 Lavagens/mês</li>
                <li className="flex items-center gap-2">✓ PDV Balcão & Caixa</li>
              </ul>
            </div>
            <Link
              href="/dashboard"
              className="w-full py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs text-center transition-colors"
            >
              Começar Grátis
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-gradient-to-b from-blue-600 to-indigo-700 rounded-2xl p-6 border-2 border-amber-400 shadow-xl space-y-4 flex flex-col justify-between relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-3 py-0.5 rounded-full">
              Mais Escolhido
            </div>
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase text-blue-200">Oficina Pro</div>
              <div className="text-3xl font-black text-white">
                R$ 69,90 <span className="text-xs font-normal">/mês</span>
              </div>
              <p className="text-xs text-blue-100">Até 4 Usuários com controle de perfis</p>
              <ul className="space-y-2 text-xs text-white pt-2 border-t border-blue-500">
                <li className="flex items-center gap-2">✓ <strong>OS e Lavagens Ilimitadas</strong></li>
                <li className="flex items-center gap-2">✓ CRM WhatsApp Automático</li>
                <li className="flex items-center gap-2">✓ Importador de Notas NF-e XML</li>
              </ul>
            </div>
            <Link
              href="/assinatura"
              className="w-full py-3 rounded-xl bg-white hover:bg-slate-100 text-blue-900 font-extrabold text-xs text-center shadow-md transition-colors"
            >
              Assinar Plano Pro
            </Link>
          </div>

          {/* Elite */}
          <div className="bg-slate-800/90 rounded-2xl p-6 border border-slate-700 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase text-slate-400">Oficina Elite</div>
              <div className="text-3xl font-black text-white">
                R$ 129,90 <span className="text-xs font-normal">/mês</span>
              </div>
              <p className="text-xs text-slate-300">Até 8 Usuários Inclusos</p>
              <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-700">
                <li className="flex items-center gap-2">✓ Multi-Caixas e Múltiplos Turnos</li>
                <li className="flex items-center gap-2">✓ Relatórios Avançados de BI</li>
                <li className="flex items-center gap-2">✓ Suporte VIP Prioritário</li>
              </ul>
            </div>
            <Link
              href="/assinatura"
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs text-center transition-colors"
            >
              Assinar Plano Elite
            </Link>
          </div>
        </div>
      </section>

      {/* 💬 FOOTER INSTITUCIONAL */}
      <footer className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">
            ⚡
          </div>
          <span className="font-bold text-slate-800">Torque ERP</span>
          <span>© 2026 • torquerp.com.br</span>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/sobre" className="hover:text-blue-600 transition-colors">Sobre Nós</Link>
          <Link href="/contato" className="hover:text-blue-600 transition-colors">Fale Conosco</Link>
          <Link href="/termos" className="hover:text-blue-600 transition-colors">Termos de Uso</Link>
          <Link href="/privacidade" className="hover:text-blue-600 transition-colors">Política de Privacidade</Link>
        </div>
      </footer>
    </div>
  );
}
