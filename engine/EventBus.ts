type Listener = (...args: unknown[]) => void;

class EventBus {
  private listeners: Map<string, Set<Listener>> = new Map();

  on(event: string, listener: Listener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => this.off(event, listener);
  }

  off(event: string, listener: Listener): void {
    this.listeners.get(event)?.delete(listener);
  }

  emit(event: string, ...args: unknown[]): void {
    this.listeners.get(event)?.forEach((listener) => {
      try {
        listener(...args);
      } catch (e) {
        console.error(`EventBus error on "${event}":`, e);
      }
    });
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const eventBus = new EventBus();
export default EventBus;