// Event emitter pour les événements de booking
type BookingEventType = 'bookingCreated' | 'bookingUpdated' | 'bookingDeleted';
type BookingEventListener = (data: any) => void;

class BookingEventEmitter {
  private listeners: Map<BookingEventType, Set<BookingEventListener>> = new Map();

  on(event: BookingEventType, listener: BookingEventListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: BookingEventType, listener: BookingEventListener) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
    }
  }

  emit(event: BookingEventType, data?: any) {
    console.log(`🔔 BookingEvent émis: ${event}`, data);
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`❌ Erreur dans listener ${event}:`, error);
        }
      });
    }
  }

  clear() {
    this.listeners.clear();
  }
}

export const bookingEvents = new BookingEventEmitter();
