import { setTimeout, clearTimeout } from "timers";

class SimpleCache {
  private cache: Map<string, any>;
  private timeouts: Map<string, ReturnType<typeof setTimeout>>;

  constructor() {
    this.cache = new Map();
    this.timeouts = new Map();
  }

  set(key: string, value: any, ttlSeconds: number = 300): void {
    this.cache.set(key, value);

    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key)!);
    }

    const timeout = setTimeout(() => {
      this.cache.delete(key);
      this.timeouts.delete(key);
    }, ttlSeconds * 1000);

    this.timeouts.set(key, timeout);
  }

  get(key: string): any {
    return this.cache.get(key);
  }

  delete(key: string): void {
    this.cache.delete(key);
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
      this.timeouts.delete(key);
    }
  }

  clear(): void {
    this.cache.clear();
    this.timeouts.forEach((timeout) => clearTimeout(timeout));
    this.timeouts.clear();
  }
}

// Exporta uma única instância do cache
export const cache = new SimpleCache();
