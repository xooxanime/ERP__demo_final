class CircuitBreaker {
  constructor(serviceName, failureThreshold = 5, cooldownPeriod = 30000) {
    this.serviceName = serviceName;
    this.failureThreshold = failureThreshold;
    this.cooldownPeriod = cooldownPeriod; // 30 seconds
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
  }

  async execute(actionFn) {
    this.checkCooldown();

    if (this.state === 'OPEN') {
      console.warn(`[CIRCUIT BREAKER] Aborting execution for ${this.serviceName} - State: OPEN`);
      throw new Error(`Circuit breaker for ${this.serviceName} is currently OPEN. Aborting Meta request.`);
    }

    try {
      const result = await actionFn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure(err);
      throw err;
    }
  }

  checkCooldown() {
    if (this.state === 'OPEN' && this.lastFailureTime) {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed >= this.cooldownPeriod) {
        console.log(`[CIRCUIT BREAKER] Cooldown period expired for ${this.serviceName}. Transitioning to HALF_OPEN.`);
        this.state = 'HALF_OPEN';
      }
    }
  }

  onSuccess() {
    if (this.state === 'HALF_OPEN') {
      console.log(`[CIRCUIT BREAKER] Meta request succeeded in HALF_OPEN. Transitioning ${this.serviceName} to CLOSED.`);
      this.state = 'CLOSED';
      this.failureCount = 0;
    }
  }

  onFailure(err) {
    this.failureCount++;
    console.error(`[CIRCUIT BREAKER] Execution failed for ${this.serviceName} (Count: ${this.failureCount}/${this.failureThreshold}). Error: ${err.message}`);
    
    if (this.state === 'HALF_OPEN' || this.failureCount >= this.failureThreshold) {
      console.warn(`[CIRCUIT BREAKER] Failure threshold reached for ${this.serviceName}. Transitioning to OPEN.`);
      this.state = 'OPEN';
      this.lastFailureTime = Date.now();
    }
  }

  getStatus() {
    return {
      state: this.state,
      failures: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      cooldownRemaining: this.state === 'OPEN' ? Math.max(0, this.cooldownPeriod - (Date.now() - this.lastFailureTime)) : 0
    };
  }
}

export default new CircuitBreaker('MetaWhatsAppAPI');
