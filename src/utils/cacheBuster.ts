declare const __APP_VERSION__: string;

export class CacheBuster {
  private static readonly STORAGE_KEY = 'app_version';
  private static readonly VERSION = __APP_VERSION__;
  private static readonly CHECK_INTERVAL = 60000;
  private static checkInterval: number | null = null;
  private static onNewVersionCallback: (() => void) | null = null;

  static async checkAndClearCache(): Promise<boolean> {
    const storedVersion = localStorage.getItem(this.STORAGE_KEY);

    if (storedVersion !== this.VERSION) {
      console.log(`🔄 New version detected: ${this.VERSION} (was: ${storedVersion})`);
      return true;
    } else {
      console.log(`✓ Version up to date: ${this.VERSION}`);
      return false;
    }
  }

  static async checkServerVersion(): Promise<boolean> {
    try {
      const response = await fetch('/version.txt?t=' + Date.now(), {
        cache: 'no-cache',
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (!response.ok) {
        console.warn('Could not fetch server version');
        return false;
      }

      const serverVersion = (await response.text()).trim();
      const currentVersion = this.VERSION;

      console.log('Server version:', serverVersion, 'Current version:', currentVersion);

      if (serverVersion !== currentVersion) {
        console.log('🆕 New server version available!');
        return true;
      }

      return false;
    } catch (error) {
      console.warn('Error checking server version:', error);
      return false;
    }
  }

  static startVersionCheck(onNewVersion: () => void): void {
    this.onNewVersionCallback = onNewVersion;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = window.setInterval(async () => {
      const hasNewVersion = await this.checkServerVersion();
      if (hasNewVersion && this.onNewVersionCallback) {
        this.onNewVersionCallback();
      }
    }, this.CHECK_INTERVAL);

    console.log('✓ Version check started (every 60s)');
  }

  static stopVersionCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
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
    localStorage.setItem(this.STORAGE_KEY, this.VERSION);
    window.location.reload();
  }

  static async updateVersion(): Promise<void> {
    localStorage.setItem(this.STORAGE_KEY, this.VERSION);
  }
}

export async function initCacheBuster(): Promise<boolean> {
  const hasNewVersion = await CacheBuster.checkAndClearCache();
  return hasNewVersion;
}
