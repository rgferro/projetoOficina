/**
 * ============================================================================
 * SCRIPT DE DISPARO DE PROSPECÇÃO B2B (JUIZ DE FORA) - TORQ ERP
 * ============================================================================
 * Remetente Oficial: contato@torquerp.com.br
 * Provedor: Brevo REST API v3 (/v3/smtp/email)
 *
 * Como Executar:
 *   - Modo Simulação (não envia, apenas valida e exibe):
 *       node scripts/disparar_emails_leads_jf.js --dry-run
 *
 *   - Modo Real (disparo oficial via API do Brevo):
 *       node scripts/disparar_emails_leads_jf.js
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// 1. Carrega variáveis do arquivo .env automaticamente
function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...values] = trimmed.split('=');
        const val = values.join('=').replace(/^["']|["']$/g, '');
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = val;
        }
      }
    }
  }
}

loadEnv();

const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'contato@torquerp.com.br';
const BREVO_SENDER_NAME = 'Torq ERP';

const isDryRun = process.argv.includes('--dry-run');

// 2. Lista de Leads com Cópias Personalizadas
const leads = [
  {
    empresa: 'Elite Centro Automotivo',
    email: 'eliteautocar@hotmail.com',
    assunto: 'Gestão ágil de OS e estoque para o Elite Centro Automotivo',
    corpoHtml: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h3 style="color: #0f172a; margin-top: 0;">Olá, equipe do Elite Centro Automotivo, tudo bem?</h3>
        <p style="line-height: 1.6; color: #334155;">Sabemos que o dia a dia da oficina exige velocidade na abertura de Ordens de Serviço, precisão no controle de estoque de peças e rapidez na aprovação de orçamentos.</p>
        <p style="line-height: 1.6; color: #334155;">O <strong>Torq ERP</strong> é uma plataforma 100% em nuvem desenvolvida especialmente para centros automotivos otimizarem toda a sua operação em uma única tela: emissão de OS em segundos, baixa automática de estoque, controle financeiro e emissão de notas fiscais.</p>
        <p style="line-height: 1.6; color: #334155;">Tudo funciona direto no navegador, sem instalações pesadas, e você conta com a tranquilidade de um suporte técnico com equipe local aqui de Juiz de Fora para qualquer dúvida.</p>
        <p style="line-height: 1.6; color: #334155;">Para solicitar seu acesso de teste ou conferir os planos online, basta acessar a aba <strong>Fale Conosco</strong> em nosso site oficial (torquerp com br) ou falar com nosso time de atendimento.</p>
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0 16px 0;" />
        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 4px;"><em>(Este é um e-mail de envio automático. Para atendimento direto, utilize o canal Fale Conosco em nosso site).</em></p>
        <p style="font-size: 13px; color: #475569; margin: 0;"><strong>Equipe Torq ERP</strong><br/>Gestão Automotiva Inteligente em Nuvem</p>
      </div>
    `,
    corpoTexto: `Olá, equipe do Elite Centro Automotivo, tudo bem?\n\nSabemos que o dia a dia da oficina exige velocidade na abertura de Ordens de Serviço, precisão no controle de estoque de peças e rapidez na aprovação de orçamentos.\n\nO Torq ERP é uma plataforma 100% em nuvem desenvolvida especialmente para centros automotivos otimizarem toda a sua operação em uma única tela: emissão de OS em segundos, baixa automática de estoque, controle financeiro e emissão de notas fiscais.\n\nTudo funciona direto no navegador, sem instalações pesadas, e você conta com a tranquilidade de um suporte técnico com equipe local aqui de Juiz de Fora para qualquer dúvida.\n\nPara solicitar seu acesso de teste ou conferir os planos online, basta acessar a aba Fale Conosco em nosso site oficial (torquerp com br) ou falar com nosso time de atendimento.\n\n(Este é um e-mail de envio automático. Para atendimento direto, utilize o canal Fale Conosco em nosso site).\n\nAtenciosamente,\nEquipe Torq ERP\nGestão Automotiva Inteligente em Nuvem`
  },
  {
    empresa: 'Motor Center',
    email: 'motorcentermc@qualidadejf.com.br',
    assunto: 'Otimização de fluxo e OS no Motor Center',
    corpoHtml: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h3 style="color: #0f172a; margin-top: 0;">Olá, equipe Motor Center, tudo bem?</h3>
        <p style="line-height: 1.6; color: #334155;">Acompanhar a entrada e saída de veículos, orçamentos pendentes e o estoque de componentes em tempo real não precisa ser um processo burocrático.</p>
        <p style="line-height: 1.6; color: #334155;">O <strong>Torq ERP</strong> foi criado para simplificar a gestão da sua oficina: abertura de OS descomplicada, controle rigoroso de peças e serviços, módulo financeiro integrado e emissão de notas fiscais, tudo acessível de qualquer computador ou celular.</p>
        <p style="line-height: 1.6; color: #334155;">Além de ser uma plataforma 100% em nuvem e de contratação simples e online, nosso grande diferencial é o suporte técnico especializado com equipe local de Juiz de Fora, garantindo suporte ágil e sem enrolação.</p>
        <p style="line-height: 1.6; color: #334155;">Para liberar um período de teste ou tirar dúvidas com nossos especialistas, mande uma mensagem pelo menu <strong>Fale Conosco</strong> em nosso site oficial (torquerp com br).</p>
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0 16px 0;" />
        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 4px;"><em>(Mensagem automática. Solicitamos que não responda a este e-mail e utilize o Fale Conosco do site).</em></p>
        <p style="font-size: 13px; color: #475569; margin: 0;"><strong>Equipe Torq ERP</strong><br/>Juiz de Fora - MG</p>
      </div>
    `,
    corpoTexto: `Olá, equipe Motor Center, tudo bem?\n\nAcompanhar a entrada e saída de veículos, orçamentos pendentes e o estoque de componentes em tempo real não precisa ser um processo burocrático.\n\nO Torq ERP foi criado para simplificar a gestão da sua oficina: abertura de OS descomplicada, controle rigoroso de peças e serviços, módulo financeiro integrado e emissão de notas fiscais, tudo acessível de qualquer computador ou celular.\n\nAlém de ser uma plataforma 100% em nuvem e de contratação simples e online, nosso grande diferencial é o suporte técnico especializado com equipe local de Juiz de Fora, garantindo suporte ágil e sem enrolação.\n\nPara liberar um período de teste ou tirar dúvidas com nossos especialistas, mande uma mensagem pelo menu Fale Conosco em nosso site oficial (torquerp com br).\n\n(Mensagem automática. Solicitamos que não responda a este e-mail e utilize o Fale Conosco do site).\n\nAtenciosamente,\nEquipe Torq ERP\nJuiz de Fora - MG`
  },
  {
    empresa: 'Cro Vato Automotivo',
    email: 'crovato.adm@gmail.com',
    assunto: 'Gestão em nuvem para o Cro Vato Automotivo',
    corpoHtml: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h3 style="color: #0f172a; margin-top: 0;">Olá, time administrativo do Cro Vato Automotivo, tudo bem?</h3>
        <p style="line-height: 1.6; color: #334155;">Manter o controle de ordens de serviço, precificação de mão de obra e peças aplicadas de forma integrada é o que garante o lucro real no final do mês.</p>
        <p style="line-height: 1.6; color: #334155;">Com o <strong>Torq ERP</strong>, você gerencia sua oficina de forma 100% online: emissão rápida de Ordens de Serviço (OS), controle detalhado de estoque de peças, fechamento de caixa e emissão fiscal simplificada em nuvem.</p>
        <p style="line-height: 1.6; color: #334155;">Além da autonomia de testar e contratar tudo pela internet, nossa equipe técnica está baseada em Juiz de Fora, oferecendo atendimento rápido e próximo sempre que precisar.</p>
        <p style="line-height: 1.6; color: #334155;">Para conhecer a plataforma e ativar o seu acesso de teste, entre em contato através da área de <strong>Fale Conosco</strong> em nosso site oficial (torquerp com br).</p>
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0 16px 0;" />
        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 4px;"><em>(Envio automático. Para falar com nosso time, utilize a seção Fale Conosco em nosso site).</em></p>
        <p style="font-size: 13px; color: #475569; margin: 0;"><strong>Equipe Torq ERP</strong><br/>Soluções em Nuvem para Oficinas</p>
      </div>
    `,
    corpoTexto: `Olá, time administrativo do Cro Vato Automotivo, tudo bem?\n\nManter o controle de ordens de serviço, precificação de mão de obra e peças aplicadas de forma integrada é o que garante o lucro real no final do mês.\n\nCom o Torq ERP, você gerencia sua oficina de forma 100% online: emissão rápida de Ordens de Serviço (OS), controle detalhado de estoque de peças, fechamento de caixa e emissão fiscal simplificada em nuvem.\n\nAlém da autonomia de testar e contratar tudo pela internet, nossa equipe técnica está baseada em Juiz de Fora, oferecendo atendimento rápido e próximo sempre que precisar.\n\nPara conhecer a plataforma e ativar o seu acesso de teste, entre em contato através da área de Fale Conosco em nosso site oficial (torquerp com br).\n\n(Envio automático. Para falar com nosso time, utilize a seção Fale Conosco em nosso site).\n\nAtenciosamente,\nEquipe Torq ERP\nSoluções em Nuvem para Oficinas`
  },
  {
    empresa: 'Centro Automotivo Pai e Filho (Lava Jato)',
    email: 'fernando.henrique.souza.jf@gmail.com',
    assunto: 'Controle de serviços e estoque no Pai e Filho',
    corpoHtml: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h3 style="color: #0f172a; margin-top: 0;">Olá, Fernando e equipe Pai e Filho, tudo bem?</h3>
        <p style="line-height: 1.6; color: #334155;">A rotina de serviços automotivos e lava-jato demanda rapidez no registro de placas, controle dos produtos utilizados e acompanhamento das entradas diárias do caixa.</p>
        <p style="line-height: 1.6; color: #334155;">O <strong>Torq ERP</strong> é o sistema em nuvem feito para tornar essa gestão prática: registro rápido de serviços/OS, controle de consumo de produtos, orçamentos no ato e histórico completo de cada veículo atendido.</p>
        <p style="line-height: 1.6; color: #334155;">A plataforma funciona 100% online (sem travamentos ou instalações) e conta com o suporte técnico com equipe local de Juiz de Fora para ajudar você no dia a dia.</p>
        <p style="line-height: 1.6; color: #334155;">Para solicitar uma demonstração ou iniciar seu teste online, envie uma solicitação através do formulário <strong>Fale Conosco</strong> no site oficial (torquerp com br).</p>
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0 16px 0;" />
        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 4px;"><em>(Este e-mail é gerado automaticamente. Por favor, utilize o Fale Conosco em nosso site).</em></p>
        <p style="font-size: 13px; color: #475569; margin: 0;"><strong>Equipe Torq ERP</strong><br/>Gestão em Nuvem para Serviços Automotivos</p>
      </div>
    `,
    corpoTexto: `Olá, Fernando e equipe Pai e Filho, tudo bem?\n\nA rotina de serviços automotivos e lava-jato demanda rapidez no registro de placas, controle dos produtos utilizados e acompanhamento das entradas diárias do caixa.\n\nO Torq ERP é o sistema em nuvem feito para tornar essa gestão prática: registro rápido de serviços/OS, controle de consumo de produtos, orçamentos no ato e histórico completo de cada veículo atendido.\n\nA plataforma funciona 100% online (sem travamentos ou instalações) e conta com o suporte técnico com equipe local de Juiz de Fora para ajudar você no dia a dia.\n\nPara solicitar uma demonstração ou iniciar seu teste online, envie uma solicitação através do formulário Fale Conosco no site oficial (torquerp com br).\n\n(Este e-mail é gerado automaticamente. Por favor, utilize o Fale Conosco em nosso site).\n\nAtenciosamente,\nEquipe Torq ERP\nGestão em Nuvem para Serviços Automotivos`
  },
  {
    empresa: 'E-Drive Serviços Automotivos',
    email: 'contato@edrivejf.com.br',
    assunto: 'Tecnologia em nuvem para a gestão da E-Drive',
    corpoHtml: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h3 style="color: #0f172a; margin-top: 0;">Olá, time da E-Drive Serviços Automotivos, tudo bem?</h3>
        <p style="line-height: 1.6; color: #334155;">A modernização dos serviços automotivos exige ferramentas ágeis que acompanhem o ritmo do atendimento e a organização técnica da oficina.</p>
        <p style="line-height: 1.6; color: #334155;">O <strong>Torq ERP</strong> oferece um ecossistema completo e direto ao ponto: emissão ágil de Ordens de Serviço (OS), controle em tempo real de estoque de peças, fluxo de caixa e emissão de notas fiscais, operando 100% em nuvem e com acesso seguro de qualquer dispositivo.</p>
        <p style="line-height: 1.6; color: #334155;">Você ganha mais produtividade com uma contratação totalmente online e tem o respaldo de suporte técnico com equipe própria em Juiz de Fora.</p>
        <p style="line-height: 1.6; color: #334155;">Quer ver como o Torq ERP se adapta à rotina da E-Drive? Acesse a opção <strong>Fale Conosco</strong> em nosso site (torquerp com br) e solicite seu acesso de teste.</p>
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0 16px 0;" />
        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 4px;"><em>(Envio automático do sistema. Favor direcionar mensagens pelo Fale Conosco do site).</em></p>
        <p style="font-size: 13px; color: #475569; margin: 0;"><strong>Equipe Torq ERP</strong><br/>Tecnologia e Gestão Automotiva</p>
      </div>
    `,
    corpoTexto: `Olá, time da E-Drive Serviços Automotivos, tudo bem?\n\nA modernização dos serviços automotivos exige ferramentas ágeis que acompanhem o ritmo do atendimento e a organização técnica da oficina.\n\nO Torq ERP oferece um ecossistema completo e direto ao ponto: emissão ágil de Ordens de Serviço (OS), controle em tempo real de estoque de peças, fluxo de caixa e emissão de notas fiscais, operando 100% em nuvem e com acesso seguro de qualquer dispositivo.\n\nVocê ganha mais produtividade com uma contratação totalmente online e tem o respaldo de suporte técnico com equipe própria em Juiz de Fora.\n\nQuer ver como o Torq ERP se adapta à rotina da E-Drive? Acesse a opção Fale Conosco em nosso site (torquerp com br) e solicite seu acesso de teste.\n\n(Envio automático do sistema. Favor direcionar mensagens pelo Fale Conosco do site).\n\nAtenciosamente,\nEquipe Torq ERP\nTecnologia e Gestão Automotiva`
  },
  {
    empresa: 'Auto Certo Serviços',
    email: 'autocertojf@gmail.com',
    assunto: 'Redução de tempo na abertura de OS - Auto Certo',
    corpoHtml: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h3 style="color: #0f172a; margin-top: 0;">Olá, pessoal da Auto Certo Serviços, tudo bem?</h3>
        <p style="line-height: 1.6; color: #334155;">Quanto tempo a sua oficina gasta hoje para abrir uma OS, dar baixa nas peças utilizadas e fechar a conta com o cliente?</p>
        <p style="line-height: 1.6; color: #334155;">Com o <strong>Torq ERP</strong>, todo esse fluxo é feito em poucos cliques. Nosso software de gestão em nuvem centraliza ordens de serviço, controle de estoque, orçamentos, faturamento e notas fiscais com total praticidade.</p>
        <p style="line-height: 1.6; color: #334155;">A contratação e o teste são 100% online, e você ainda tem a tranquilidade de contar com suporte técnico de equipe local em Juiz de Fora, garantindo suporte rápido sempre que necessário.</p>
        <p style="line-height: 1.6; color: #334155;">Para iniciar seu teste gratuito ou conhecer os recursos, envie uma mensagem pelo canal <strong>Fale Conosco</strong> em nosso site (torquerp com br).</p>
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0 16px 0;" />
        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 4px;"><em>(Mensagem automática. Para dúvidas ou atendimento, favor usar o Fale Conosco do site).</em></p>
        <p style="font-size: 13px; color: #475569; margin: 0;"><strong>Equipe Torq ERP</strong><br/>Sistemas para Oficinas Mecânicas</p>
      </div>
    `,
    corpoTexto: `Olá, pessoal da Auto Certo Serviços, tudo bem?\n\nQuanto tempo a sua oficina gasta hoje para abrir uma OS, dar baixa nas peças utilizadas e fechar a conta com o cliente?\n\nCom o Torq ERP, todo esse fluxo é feito em poucos cliques. Nosso software de gestão em nuvem centraliza ordens de serviço, controle de estoque, orçamentos, faturamento e notas fiscais com total praticidade.\n\nA contratação e o teste são 100% online, e você ainda tem a tranquilidade de contar com suporte técnico de equipe local em Juiz de Fora, garantindo suporte rápido sempre que necessário.\n\nPara iniciar seu teste gratuito ou conhecer os recursos, envie uma mensagem pelo canal Fale Conosco em nosso site (torquerp com br).\n\n(Mensagem automática. Para dúvidas ou atendimento, favor usar o Fale Conosco do site).\n\nAtenciosamente,\nEquipe Torq ERP\nSistemas para Oficinas Mecânicas`
  },
  {
    empresa: 'Auto Fort Centro Automotivo',
    email: 'autofortcentercar@gmail.com',
    assunto: 'Gestão simplificada de estoque e serviços - Auto Fort',
    corpoHtml: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h3 style="color: #0f172a; margin-top: 0;">Olá, equipe do Auto Fort Centro Automotivo, tudo bem?</h3>
        <p style="line-height: 1.6; color: #334155;">Evitar furos no estoque de peças e agilizar a liberação das Ordens de Serviço é essencial para manter o pátio girando com alta rentabilidade.</p>
        <p style="line-height: 1.6; color: #334155;">O <strong>Torq ERP</strong> é um sistema completo em nuvem projetado para oficinas e centros automotivos: emissão de OS limpa e rápida, controle de estoque integrado, gestão financeira e módulo fiscal automatizado.</p>
        <p style="line-height: 1.6; color: #334155;">Sem necessidade de servidores locais e com teste 100% online, você conta também com o suporte técnico de equipe sediada em Juiz de Fora.</p>
        <p style="line-height: 1.6; color: #334155;">Para obter seu acesso de teste e conhecer a plataforma, entre em contato via <strong>Fale Conosco</strong> no site oficial (torquerp com br).</p>
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0 16px 0;" />
        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 4px;"><em>(Este é um e-mail automático. Para contato, utilize o Fale Conosco do site).</em></p>
        <p style="font-size: 13px; color: #475569; margin: 0;"><strong>Equipe Torq ERP</strong><br/>Juiz de Fora - MG</p>
      </div>
    `,
    corpoTexto: `Olá, equipe do Auto Fort Centro Automotivo, tudo bem?\n\nEvitar furos no estoque de peças e agilizar a liberação das Ordens de Serviço é essencial para manter o pátio girando com alta rentabilidade.\n\nO Torq ERP é um sistema completo em nuvem projetado para oficinas e centros automotivos: emissão de OS limpa e rápida, controle de estoque integrado, gestão financeira e módulo fiscal automatizado.\n\nSem necessidade de servidores locais e com teste 100% online, você conta também com o suporte técnico de equipe sediada em Juiz de Fora.\n\nPara obter seu acesso de teste e conhecer a plataforma, entre em contato via Fale Conosco no site oficial (torquerp com br).\n\n(Este é um e-mail automático. Para contato, utilize o Fale Conosco do site).\n\nAtenciosamente,\nEquipe Torq ERP\nJuiz de Fora - MG`
  },
  {
    empresa: 'Auto Ville Serviços',
    email: 'autovillejf@gmail.com',
    assunto: 'Controle total da Auto Ville direto na nuvem',
    corpoHtml: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h3 style="color: #0f172a; margin-top: 0;">Olá, equipe da Auto Ville Serviços, tudo bem?</h3>
        <p style="line-height: 1.6; color: #334155;">Gerenciar o fluxo de atendimento aos clientes, peças em estoque e orçamentos aprovados pode ser muito mais simples do que planilhas ou sistemas antigos.</p>
        <p style="line-height: 1.6; color: #334155;">O <strong>Torq ERP</strong> foi desenvolvido para colocar a gestão da sua oficina na palma da mão: emissão veloz de OS, controle automático de peças, orçamentos detalhados e notas fiscais sem complicação.</p>
        <p style="line-height: 1.6; color: #334155;">Por ser 100% em nuvem, você pode testar e contratar diretamente pela internet, com a segurança de um suporte técnico formado por profissionais locais de Juiz de Fora.</p>
        <p style="line-height: 1.6; color: #334155;">Para ativar um teste online ou saber mais sobre o sistema, envie sua mensagem pela seção <strong>Fale Conosco</strong> em nosso site (torquerp com br).</p>
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0 16px 0;" />
        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 4px;"><em>(E-mail automático. Por favor, não responda esta mensagem; utilize o canal Fale Conosco do site).</em></p>
        <p style="font-size: 13px; color: #475569; margin: 0;"><strong>Equipe Torq ERP</strong><br/>Gestão Eficiente para Centros Automotivos</p>
      </div>
    `,
    corpoTexto: `Olá, equipe da Auto Ville Serviços, tudo bem?\n\nGerenciar o fluxo de atendimento aos clientes, peças em estoque e orçamentos aprovados pode ser muito mais simples do que planilhas ou sistemas antigos.\n\nO Torq ERP foi desenvolvido para colocar a gestão da sua oficina na palma da mão: emissão veloz de OS, controle automático de peças, orçamentos detalhados e notas fiscais sem complicação.\n\nPor ser 100% em nuvem, você pode testar e contratar diretamente pela internet, com a segurança de um suporte técnico formado por profissionais locais de Juiz de Fora.\n\nPara ativar um teste online ou saber mais sobre o sistema, envie sua mensagem pela seção Fale Conosco em nosso site (torquerp com br).\n\n(E-mail automático. Por favor, não responda esta mensagem; utilize o canal Fale Conosco do site).\n\nAtenciosamente,\nEquipe Torq ERP\nGestão Eficiente para Centros Automotivos`
  },
  {
    empresa: 'Auto Zero Centro Automotivo',
    email: 'vendas@autozerojf.com.br',
    assunto: 'Produtividade e gestão de OS no Auto Zero',
    corpoHtml: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h3 style="color: #0f172a; margin-top: 0;">Olá, time de vendas e gestão do Auto Zero, tudo bem?</h3>
        <p style="line-height: 1.6; color: #334155;">Acelerar a aprovação de orçamentos e manter o estoque alinhado às Ordens de Serviço abertas é o segredo para aumentar a capacidade de atendimento da oficina.</p>
        <p style="line-height: 1.6; color: #334155;">O <strong>Torq ERP</strong> reúne as ferramentas indispensáveis para centros automotivos em uma plataforma 100% em nuvem: emissão de OS, controle rigoroso de estoque, relatórios financeiros e módulo de notas fiscais.</p>
        <p style="line-height: 1.6; color: #334155;">A plataforma é pronta para uso online e você conta com a agilidade do nosso suporte técnico com equipe local aqui em Juiz de Fora.</p>
        <p style="line-height: 1.6; color: #334155;">Interessado em testar a plataforma na prática? Envie sua solicitação através do formulário <strong>Fale Conosco</strong> em nosso site oficial (torquerp com br).</p>
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0 16px 0;" />
        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 4px;"><em>(E-mail automático. Para atendimento direto, use o Fale Conosco em nosso site).</em></p>
        <p style="font-size: 13px; color: #475569; margin: 0;"><strong>Equipe Torq ERP</strong><br/>Software em Nuvem para Oficinas</p>
      </div>
    `,
    corpoTexto: `Olá, time de vendas e gestão do Auto Zero, tudo bem?\n\nAcelerar a aprovação de orçamentos e manter o estoque alinhado às Ordens de Serviço abertas é o segredo para aumentar a capacidade de atendimento da oficina.\n\nO Torq ERP reúne as ferramentas indispensáveis para centros automotivos em uma plataforma 100% em nuvem: emissão de OS, controle rigoroso de estoque, relatórios financeiros e módulo de notas fiscais.\n\nA plataforma é pronta para uso online e você conta com a agilidade do nosso suporte técnico com equipe local aqui em Juiz de Fora.\n\nInteressado em testar a plataforma na prática? Envie sua solicitação através do formulário Fale Conosco em nosso site oficial (torquerp com br).\n\n(E-mail automático. Para atendimento direto, use o Fale Conosco em nosso site).\n\nAtenciosamente,\nEquipe Torq ERP\nSoftware em Nuvem para Oficinas`
  },
  {
    empresa: 'Leandro Veículos e Oficina',
    email: 'adm.leandroveiculosjf@gmail.com',
    assunto: 'Integração de serviços e estoque - Leandro Veículos e Oficina',
    corpoHtml: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h3 style="color: #0f172a; margin-top: 0;">Olá, equipe administrativa do Leandro Veículos e Oficina, tudo bem?</h3>
        <p style="line-height: 1.6; color: #334155;">Coordenar os serviços mecânicos com o controle de peças e as finanças da empresa exige uma plataforma rápida, confiável e fácil de operar.</p>
        <p style="line-height: 1.6; color: #334155;">O <strong>Torq ERP</strong> é o sistema em nuvem ideal para organizar a rotina da sua oficina: controle de entrada e saída de veículos por Ordens de Serviço, baixa automática no estoque de peças, fluxo de caixa e emissão de notas fiscais.</p>
        <p style="line-height: 1.6; color: #334155;">Você testa e contrata 100% online, sem burocracia, e tem o suporte técnico com equipe local de Juiz de Fora para dar total tranquilidade à sua operação.</p>
        <p style="line-height: 1.6; color: #334155;">Para solicitar seu período de teste ou mais informações, acesse o menu <strong>Fale Conosco</strong> em nosso site oficial (torquerp com br).</p>
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0 16px 0;" />
        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 4px;"><em>(Este é um e-mail disparado automaticamente. Gentileza utilizar o Fale Conosco do site para contato).</em></p>
        <p style="font-size: 13px; color: #475569; margin: 0;"><strong>Equipe Torq ERP</strong><br/>Gestão Automotiva Inteligente</p>
      </div>
    `,
    corpoTexto: `Olá, equipe administrativa do Leandro Veículos e Oficina, tudo bem?\n\nCoordenar os serviços mecânicos com o controle de peças e as finanças da empresa exige uma plataforma rápida, confiável e fácil de operar.\n\nO Torq ERP é o sistema em nuvem ideal para organizar a rotina da sua oficina: controle de entrada e saída de veículos por Ordens de Serviço, baixa automática no estoque de peças, fluxo de caixa e emissão de notas fiscais.\n\nVocê testa e contrata 100% online, sem burocracia, e tem o suporte técnico com equipe local de Juiz de Fora para dar total tranquilidade à sua operação.\n\nPara solicitar seu período de teste ou mais informações, acesse o menu Fale Conosco em nosso site oficial (torquerp com br).\n\n(Este é um e-mail disparado automaticamente. Gentileza utilizar o Fale Conosco do site para contato).\n\nAtenciosamente,\nEquipe Torq ERP\nGestão Automotiva Inteligente`
  },
  {
    empresa: 'Minas Car Serviços',
    email: 'minascarjf2@gmail.com',
    assunto: 'Agilidade nas Ordens de Serviço da Minas Car',
    corpoHtml: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h3 style="color: #0f172a; margin-top: 0;">Olá, equipe da Minas Car Serviços, tudo bem?</h3>
        <p style="line-height: 1.6; color: #334155;">Economizar tempo no balcão e garantir que cada peça utilizada seja devidamente cobrada e baixada do estoque é o objetivo de toda oficina de alta performance.</p>
        <p style="line-height: 1.6; color: #334155;">O <strong>Torq ERP</strong> simplifica toda a rotina da sua oficina em nuvem: abertura rápida de OS, controle completo de estoque de peças e insumos, orçamentos claros para o cliente e emissão de notas fiscais.</p>
        <p style="line-height: 1.6; color: #334155;">Sem necessidade de instalações complexas, você contrata e testa 100% online, contando com um time de suporte técnico local em Juiz de Fora.</p>
        <p style="line-height: 1.6; color: #334155;">Para habilitar um teste da plataforma na sua oficina, entre em contato através do formulário <strong>Fale Conosco</strong> no site oficial (torquerp com br).</p>
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0 16px 0;" />
        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 4px;"><em>(Mensagem automática. Para falar conosco, acesse a aba Fale Conosco em nosso site).</em></p>
        <p style="font-size: 13px; color: #475569; margin: 0;"><strong>Equipe Torq ERP</strong><br/>Tecnologia em Nuvem para Oficinas</p>
      </div>
    `,
    corpoTexto: `Olá, equipe da Minas Car Serviços, tudo bem?\n\nEconomizar tempo no balcão e garantir que cada peça utilizada seja devidamente cobrada e baixada do estoque é o objetivo de toda oficina de alta performance.\n\nO Torq ERP simplifica toda a rotina da sua oficina em nuvem: abertura rápida de OS, controle completo de estoque de peças e insumos, orçamentos claros para o cliente e emissão de notas fiscais.\n\nSem necessidade de instalações complexas, você contrata e testa 100% online, contando com um time de suporte técnico local em Juiz de Fora.\n\nPara habilitar um teste da plataforma na sua oficina, entre em contato através do formulário Fale Conosco no site oficial (torquerp com br).\n\n(Mensagem automática. Para falar conosco, acesse a aba Fale Conosco em nosso site).\n\nAtenciosamente,\nEquipe Torq ERP\nTecnologia em Nuvem para Oficinas`
  },
  {
    empresa: 'Yellow Car Estética Automotiva',
    email: 'administrativo@yellowcarbrasil.com.br',
    assunto: 'Gestão de serviços e produtos para a Yellow Car',
    corpoHtml: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h3 style="color: #0f172a; margin-top: 0;">Olá, time da Yellow Car Estética Automotiva, tudo bem?</h3>
        <p style="line-height: 1.6; color: #334155;">A precisão no agendamento, controle do estoque de produtos de estética e emissão rápida de ordens de serviço são fundamentais para manter a excelência no atendimento.</p>
        <p style="line-height: 1.6; color: #334155;">O <strong>Torq ERP</strong> é uma plataforma em nuvem desenvolvida para centralizar a gestão de serviços automotivos: controle de OS, gestão de consumo de insumos/produtos, orçamentos ágeis, fluxo financeiro e emissão de notas fiscais.</p>
        <p style="line-height: 1.6; color: #334155;">A plataforma é moderna, 100% online e dispõe de suporte técnico com equipe local de Juiz de Fora para um atendimento rápido e próximo.</p>
        <p style="line-height: 1.6; color: #334155;">Para conhecer o sistema e solicitar seu acesso de teste, utilize o formulário <strong>Fale Conosco</strong> em nosso site oficial (torquerp com br).</p>
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0 16px 0;" />
        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 4px;"><em>(Disparo automático. Solicitamos utilizar o canal Fale Conosco do site para atendimento).</em></p>
        <p style="font-size: 13px; color: #475569; margin: 0;"><strong>Equipe Torq ERP</strong><br/>Gestão e Produtividade em Nuvem</p>
      </div>
    `,
    corpoTexto: `Olá, time da Yellow Car Estética Automotiva, tudo bem?\n\nA precisão no agendamento, controle do estoque de produtos de estética e emissão rápida de ordens de serviço são fundamentais para manter a excelência no atendimento.\n\nO Torq ERP é uma plataforma em nuvem desenvolvida para centralizar a gestão de serviços automotivos: controle de OS, gestão de consumo de insumos/produtos, orçamentos ágeis, fluxo financeiro e emissão de notas fiscais.\n\nA plataforma é moderna, 100% online e dispõe de suporte técnico com equipe local de Juiz de Fora para um atendimento rápido e próximo.\n\nPara conhecer o sistema e solicitar seu acesso de teste, utilize o formulário Fale Conosco em nosso site oficial (torquerp com br).\n\n(Disparo automático. Solicitamos utilizar o canal Fale Conosco do site para atendimento).\n\nAtenciosamente,\nEquipe Torq ERP\nGestão e Produtividade em Nuvem`
  },
  {
    empresa: 'Go Cars Centro Automotivo',
    email: 'atendimento@gocarsjf.com.br',
    assunto: 'Gestão integrada em nuvem no Go Cars Centro Automotivo',
    corpoHtml: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h3 style="color: #0f172a; margin-top: 0;">Olá, equipe de atendimento do Go Cars, tudo bem?</h3>
        <p style="line-height: 1.6; color: #334155;">A dinâmica de um centro automotivo exige agilidade para emitir ordens de serviço, atualizar o estoque de peças e enviar orçamentos sem perder tempo.</p>
        <p style="line-height: 1.6; color: #334155;">O <strong>Torq ERP</strong> é o sistema em nuvem ideal para centralizar essas operações: emissão de OS em segundos, rastreio de estoque em tempo real, controle de caixa e emissão de notas fiscais direto no navegador.</p>
        <p style="line-height: 1.6; color: #334155;">Tudo é contratado e testado 100% online, com o diferencial de suporte técnico com equipe própria e local de Juiz de Fora.</p>
        <p style="line-height: 1.6; color: #334155;">Para solicitar seu teste online ou tirar dúvidas sobre as funcionalidades, entre em contato pela aba <strong>Fale Conosco</strong> em nosso site oficial (torquerp com br).</p>
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0 16px 0;" />
        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 4px;"><em>(Este e-mail é gerado automaticamente. Por favor, direcione sua mensagem pelo Fale Conosco do site).</em></p>
        <p style="font-size: 13px; color: #475569; margin: 0;"><strong>Equipe Torq ERP</strong><br/>Sistemas em Nuvem para Centros Automotivos</p>
      </div>
    `,
    corpoTexto: `Olá, equipe de atendimento do Go Cars, tudo bem?\n\nA dinâmica de um centro automotivo exige agilidade para emitir ordens de serviço, atualizar o estoque de peças e enviar orçamentos sem perder tempo.\n\nO Torq ERP é o sistema em nuvem ideal para centralizar essas operações: emissão de OS em segundos, rastreio de estoque em tempo real, controle de caixa e emissão de notas fiscais direto no navegador.\n\nTudo é contratado e testado 100% online, com o diferencial de suporte técnico com equipe própria e local de Juiz de Fora.\n\nPara solicitar seu teste online ou tirar dúvidas sobre as funcionalidades, entre em contato pela aba Fale Conosco em nosso site oficial (torquerp com br).\n\n(Este e-mail é gerado automaticamente. Por favor, direcione sua mensagem pelo Fale Conosco do site).\n\nAtenciosamente,\nEquipe Torq ERP\nSistemas em Nuvem para Centros Automotivos`
  }
];

// 3. Função para Envio via Brevo REST API v3
function sendBrevoEmail({ toEmail, toName, subject, htmlContent, textContent }) {
  return new Promise((resolve, reject) => {
    if (isDryRun) {
      return resolve({ messageId: 'simulated-dry-run-id', status: 'SIMULATED' });
    }

    if (!BREVO_API_KEY) {
      return reject(new Error('BREVO_API_KEY não encontrada no arquivo .env'));
    }

    const payload = JSON.stringify({
      sender: {
        name: BREVO_SENDER_NAME,
        email: BREVO_SENDER_EMAIL
      },
      to: [
        {
          email: toEmail,
          name: toName
        }
      ],
      subject: subject,
      htmlContent: htmlContent,
      textContent: textContent
    });

    const options = {
      hostname: 'api.brevo.com',
      port: 443,
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'TorqERP-Outreach/1.0',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve({ raw: data, statusCode: res.statusCode });
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(payload);
    req.end();
  });
}

// 4. Execução Sequencial com Intervalo de Segurança
async function run() {
  console.log('\n======================================================');
  console.log('🚀 DISPARO DE E-MAILS DE PROSPECÇÃO - TORQ ERP (JUIZ DE FORA)');
  console.log('======================================================');
  console.log(`📡 Remetente: ${BREVO_SENDER_NAME} <${BREVO_SENDER_EMAIL}>`);
  console.log(`📋 Total de Contatos: ${leads.length}`);
  console.log(`⚙️ Modo: ${isDryRun ? '🔍 SIMULAÇÃO (--dry-run)' : '⚡ ENVIO REAL'}`);
  console.log('------------------------------------------------------\n');

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    const indexStr = `[${i + 1}/${leads.length}]`;

    process.stdout.write(`${indexStr} Enviando para ${lead.empresa} (${lead.email})... `);

    try {
      const response = await sendBrevoEmail({
        toEmail: lead.email,
        toName: lead.empresa,
        subject: lead.assunto,
        htmlContent: lead.corpoHtml,
        textContent: lead.corpoTexto
      });

      if (isDryRun) {
        console.log('🔍 SIMULADO COM SUCESSO');
      } else {
        console.log(`✅ ENVIADO! ID: ${response.messageId || 'OK'}`);
      }
      successCount++;
    } catch (err) {
      console.log(`❌ ERRO: ${err.message}`);
      failCount++;
    }

    // Intervalo de 1.5s entre envios para evitar filtros de spam e rate limits
    if (i < leads.length - 1) {
      await new Promise((res) => setTimeout(res, 1500));
    }
  }

  console.log('\n======================================================');
  console.log('📊 RELATÓRIO FINAL DO DISPARO:');
  console.log(`  - Total Processado: ${leads.length}`);
  console.log(`  - Sucessos: ${successCount}`);
  console.log(`  - Falhas: ${failCount}`);
  console.log('======================================================\n');
}

run().catch((err) => {
  console.error('❌ Falha crítica na execução do script:', err);
});
