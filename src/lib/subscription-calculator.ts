import { SAAS_PLANS, PlanConfig } from "./mercadopago";

export interface UpgradeCalculation {
  isEligible: boolean;
  currentPlan: string;
  targetPlan: string;
  currentPlanPrice: number;
  targetPlanPrice: number;
  daysRemaining: number;
  totalDaysInCycle: number;
  unusedCredit: number;
  targetCostForRemaining: number;
  proRataAmount: number;
  currentExpiry: Date | null;
  reason?: string;
}

/**
 * Calcula o valor proporcional (pro-rata) para upgrade entre planos SaaS.
 * 
 * Regra de Negócio:
 * - Se o usuário está em um plano pago (ex: PRO) e deseja ir para um superior (ex: ELITE)
 *   durante a vigência do plano:
 *   1. Identifica quantos dias faltam para o vencimento (`subscriptionExpiresAt`).
 *   2. Calcula o crédito diário não utilizado do plano atual.
 *   3. Calcula o custo diário do novo plano para os dias restantes.
 *   4. O valor a pagar é a diferença (`targetCostForRemaining - unusedCredit`).
 *   5. A data de vencimento do plano (`subscriptionExpiresAt`) é rigorosamente MANTIDA.
 */
export function calculateProRataUpgrade(
  currentPlanId: string,
  targetPlanId: string,
  subscriptionExpiresAt?: Date | string | null
): UpgradeCalculation {
  const currentPlan = SAAS_PLANS[currentPlanId] || SAAS_PLANS.STARTER;
  const targetPlan = SAAS_PLANS[targetPlanId];

  if (!targetPlan) {
    return {
      isEligible: false,
      currentPlan: currentPlanId,
      targetPlan: targetPlanId,
      currentPlanPrice: currentPlan.price,
      targetPlanPrice: 0,
      daysRemaining: 0,
      totalDaysInCycle: 30,
      unusedCredit: 0,
      targetCostForRemaining: 0,
      proRataAmount: 0,
      currentExpiry: null,
      reason: "Plano de destino inválido.",
    };
  }

  // Se o plano atual for igual ou o preço do novo plano não for superior, não é upgrade proporcional
  if (targetPlan.price <= currentPlan.price || currentPlan.price <= 0) {
    return {
      isEligible: false,
      currentPlan: currentPlanId,
      targetPlan: targetPlanId,
      currentPlanPrice: currentPlan.price,
      targetPlanPrice: targetPlan.price,
      daysRemaining: 0,
      totalDaysInCycle: 30,
      unusedCredit: 0,
      targetCostForRemaining: targetPlan.price,
      proRataAmount: targetPlan.price,
      currentExpiry: subscriptionExpiresAt ? new Date(subscriptionExpiresAt) : null,
      reason: currentPlan.price <= 0 
        ? "Plano atual é gratuito (Starter). O valor é o preço integral do novo plano."
        : "Plano de destino não é um upgrade de valor superior.",
    };
  }

  if (!subscriptionExpiresAt) {
    return {
      isEligible: false,
      currentPlan: currentPlanId,
      targetPlan: targetPlanId,
      currentPlanPrice: currentPlan.price,
      targetPlanPrice: targetPlan.price,
      daysRemaining: 0,
      totalDaysInCycle: 30,
      unusedCredit: 0,
      targetCostForRemaining: targetPlan.price,
      proRataAmount: targetPlan.price,
      currentExpiry: null,
      reason: "Sem data de expiração ativa. Cobrança de ciclo integral de 30 dias.",
    };
  }

  const now = new Date();
  const expiryDate = new Date(subscriptionExpiresAt);

  if (now >= expiryDate) {
    return {
      isEligible: false,
      currentPlan: currentPlanId,
      targetPlan: targetPlanId,
      currentPlanPrice: currentPlan.price,
      targetPlanPrice: targetPlan.price,
      daysRemaining: 0,
      totalDaysInCycle: 30,
      unusedCredit: 0,
      targetCostForRemaining: targetPlan.price,
      proRataAmount: targetPlan.price,
      currentExpiry: expiryDate,
      reason: "O plano atual já está vencido. Cobrança de novo ciclo integral de 30 dias.",
    };
  }

  const diffTime = expiryDate.getTime() - now.getTime();
  // Arredonda para cima para garantir cobertura dos dias restantes (mínimo de 1 dia)
  const daysRemaining = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const totalDaysInCycle = 30;

  // Se faltam mais de 30 dias, limita a 30 para cálculo de base
  const clampedDaysRemaining = Math.min(daysRemaining, totalDaysInCycle);

  const currentDailyRate = currentPlan.price / totalDaysInCycle;
  const targetDailyRate = targetPlan.price / totalDaysInCycle;

  const unusedCredit = Number((currentDailyRate * clampedDaysRemaining).toFixed(2));
  const targetCostForRemaining = Number((targetDailyRate * clampedDaysRemaining).toFixed(2));

  // Diferença a pagar
  const diffAmount = targetCostForRemaining - unusedCredit;
  
  // Valor mínimo de R$ 5,00 para transações PIX/Cartão
  const proRataAmount = Math.max(5.0, Number(diffAmount.toFixed(2)));

  return {
    isEligible: true,
    currentPlan: currentPlanId,
    targetPlan: targetPlanId,
    currentPlanPrice: currentPlan.price,
    targetPlanPrice: targetPlan.price,
    daysRemaining: clampedDaysRemaining,
    totalDaysInCycle,
    unusedCredit,
    targetCostForRemaining,
    proRataAmount,
    currentExpiry: expiryDate,
  };
}
