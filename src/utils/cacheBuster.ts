declare const __APP_VERSION__: string;

export class CacheBuster {
  private static readonly STORAGE_KEY = 'app_version';
  private static readonly VERSION = __APP_VERSION__;

  static async checkAndClearCache(): Promise<void> {
    const storedVersion = localStorage.getItem(this.STORAGE_KEY);

    if (storedVersion !== this.VERSION) {
      console.log(`🔄 New version detected: ${this.VERSION} (was: ${storedVersion})`);
      await this.clearAllCaches();
      localStorage.setItem(this.STORAGE_KEY, this.VERSION);
      console.log('✅ Cache cleared and version updated');
    } else {
      console.log(`✓ Version up to date: ${this.VERSION}`);
    }
  }

  static async clearAllCaches(): Promise<void> {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => {
            console.log(`🗑️ Deleting cache: ${cacheName}`);
            return caches.delete(cacheName);
          })
        );
      }

      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(registration => {
            console.log('🗑️ Unregistering service worker');
            return registration.unregister();
          })
        );
      }

      console.log('🧹 localStorage cache cleared');
    } catch (error) {
      console.error('❌ Error clearing caches:', error);
    }
  }

  static getVersion(): string {
    return this.VERSION;
  }

  static async forceReload(): Promise<void> {
    await this.clearAllCaches();
    window.location.reload();
  }
}

export async function initCacheBuster(): Promise<void> {
  await CacheBuster.checkAndClearCache();
}
