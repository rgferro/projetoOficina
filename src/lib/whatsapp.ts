export function cleanPhoneForWhatsapp(phone: string): string {
  let clean = phone.replace(/\D/g, "");
  // Se não tiver o DDI 55 do Brasil, adiciona
  if (clean.length === 10 || clean.length === 11) {
    clean = `55${clean}`;
  }
  return clean;
}

export function generateWhatsappLink(phone: string, message: string): string {
  const cleanPhone = cleanPhoneForWhatsapp(phone);
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

export function buildWashReadyMessage(params: {
  customerName: string;
  vehicleName: string;
  plate: string;
  price: number;
  workshopName?: string;
  customTemplate?: string;
}): string {
  const template =
    params.customTemplate ||
    "Olá {nome}! Seu {veiculo} ({placa}) já está pronto e brilhando aqui no {oficina}! 🚗✨\n\n💰 Valor do serviço: {valor}\n\nPode vir retirar quando quiser!";

  return template
    .replace(/{nome}/g, params.customerName.split(" ")[0])
    .replace(/{veiculo}/g, params.vehicleName)
    .replace(/{placa}/g, params.plate.toUpperCase())
    .replace(/{valor}/g, `R$ ${params.price.toFixed(2).replace(".", ",")}`)
    .replace(/{oficina}/g, params.workshopName || "AutoGestão");
}

export function buildOilReminderMessage(params: {
  customerName: string;
  vehicleName: string;
  plate: string;
  lastServiceDate?: string;
  workshopName?: string;
  customTemplate?: string;
}): string {
  const template =
    params.customTemplate ||
    "Olá {nome}, tudo bem? 🛠️\n\nNotamos aqui no sistema que já faz um tempo desde a última troca de óleo/revisão do seu {veiculo} ({placa}).\n\nManter a manutenção em dia protege o motor e evita surpresas. Gostaria de agendar uma revisão rápida conosco essa semana?\n\nEquipe {oficina}";

  return template
    .replace(/{nome}/g, params.customerName.split(" ")[0])
    .replace(/{veiculo}/g, params.vehicleName)
    .replace(/{placa}/g, params.plate.toUpperCase())
    .replace(/{oficina}/g, params.workshopName || "AutoGestão");
}

export function buildWashReminderMessage(params: {
  customerName: string;
  vehicleName: string;
  plate: string;
  daysSinceLastWash: number;
  workshopName?: string;
  customTemplate?: string;
}): string {
  const template =
    params.customTemplate ||
    "Olá {nome}! Tudo bem? 🧼✨\n\nFaz {dias} dias que seu {veiculo} ({placa}) não recebe aquele cuidado especial aqui na {oficina}.\n\nQue tal dar aquele talento hoje ou amanhã? Responda aqui para reservar seu horário!";

  return template
    .replace(/{nome}/g, params.customerName.split(" ")[0])
    .replace(/{veiculo}/g, params.vehicleName)
    .replace(/{placa}/g, params.plate.toUpperCase())
    .replace(/{dias}/g, String(params.daysSinceLastWash))
    .replace(/{oficina}/g, params.workshopName || "AutoGestão");
}

export function buildOsReadyMessage(params: {
  name: string;
  osNumber: number | string;
  vehiclePlate: string;
  vehicleModel: string;
  total: number;
  pending: number;
  workshopName?: string;
}): string {
  const firstName = params.name.split(" ")[0];
  const totalFormatted = `R$ ${params.total.toFixed(2).replace(".", ",")}`;
  return `Olá ${firstName}! A Ordem de Serviço #${params.osNumber} do seu veículo ${params.vehicleModel} (${params.vehiclePlate}) foi finalizada com sucesso na ${params.workshopName || "Oficina"}! Valor total: ${totalFormatted}. Seu veículo já está pronto para retirada.`;
}
