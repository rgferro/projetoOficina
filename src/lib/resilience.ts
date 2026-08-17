export interface CircuitBreakerOptions {
  failureThreshold?: number; // Qtd falhas para abrir o circuito (default: 3)
  cooldownMs?: number; // Tempo de cooldown antes de tentar meia-abertura (default: 10000ms)
  timeoutMs?: number; // Timeout da chamada (default: 5000ms)
  maxRetries?: number; // Qtd de retries com backoff (default: 2)
}

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export class CircuitBreaker {
  private name: string;
  private state: CircuitState = "CLOSED";
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private options: Required<CircuitBreakerOptions>;

  constructor(name: string, options?: CircuitBreakerOptions) {
    this.name = name;
    this.options = {
      failureThreshold: options?.failureThreshold ?? 3,
      cooldownMs: options?.cooldownMs ?? 10000,
      timeoutMs: options?.timeoutMs ?? 5000,
      maxRetries: options?.maxRetries ?? 2,
    };
  }

  public getState(): CircuitState {
    if (this.state === "OPEN") {
      const now = Date.now();
      if (now - this.lastFailureTime > this.options.cooldownMs) {
        this.state = "HALF_OPEN";
      }
    }
    return this.state;
  }

  public async execute<T>(fn: () => Promise<T>, fallback?: () => Promise<T> | T): Promise<T> {
    const currentState = this.getState();

    if (currentState === "OPEN") {
      if (fallback) {
        return await fallback();
      }
      throw new Error(`[CircuitBreaker:${this.name}] Circuito ABERTO. Chamada externa suspensa temporariamente para proteção do sistema.`);
    }

    let lastError: any = null;

    for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`[CircuitBreaker:${this.name}] Timeout após ${this.options.timeoutMs}ms`)), this.options.timeoutMs);
        });

        const result = await Promise.race([fn(), timeoutPromise]);

        // Sucesso: reseta o circuito
        this.onSuccess();
        return result;
      } catch (err: any) {
        lastError = err;
        this.onFailure();

        // Se ainda restarem tentativas e circuito não abriu
        if (attempt < this.options.maxRetries && this.state !== "OPEN") {
          const backoff = Math.pow(2, attempt) * 200; // 200ms, 400ms...
          await new Promise((r) => setTimeout(r, backoff));
        }
      }
    }

    if (fallback) {
      return await fallback();
    }

    throw lastError || new Error(`[CircuitBreaker:${this.name}] Falha na execução da requisição.`);
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = "CLOSED";
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.options.failureThreshold) {
      this.state = "OPEN";
      console.warn(`⚠️ [CircuitBreaker:${this.name}] Limiar de falhas atingido (${this.failureCount}). Circuito mudou para OPEN.`);
    }
  }

  public reset() {
    this.state = "CLOSED";
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }
}

// Instâncias globais reutilizáveis
export const mercadopagoCircuit = new CircuitBreaker("MercadoPagoAPI", {
  failureThreshold: 3,
  cooldownMs: 15000,
  timeoutMs: 8000,
  maxRetries: 2,
});

export const brevoEmailCircuit = new CircuitBreaker("BrevoEmailAPI", {
  failureThreshold: 3,
  cooldownMs: 15000,
  timeoutMs: 6000,
  maxRetries: 2,
});

export const whatsappDaemonCircuit = new CircuitBreaker("WhatsAppDaemonAPI", {
  failureThreshold: 4,
  cooldownMs: 10000,
  timeoutMs: 4000,
  maxRetries: 2,
});
