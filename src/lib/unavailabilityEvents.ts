type UnavailabilityEventCallback = (data?: any) => void;

class UnavailabilityEventEmitter {
  private events: Map<string, Set<UnavailabilityEventCallback>> = new Map();

  on(event: string, callback: UnavailabilityEventCallback) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback);
  }

  off(event: string, callback: UnavailabilityEventCallback) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  emit(event: string, data?: any) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
}

export const unavailabilityEvents = new UnavailabilityEventEmitter();
