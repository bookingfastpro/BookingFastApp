import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Singleton instance
let supabaseInstance: SupabaseClient | null = null;

function createSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: 'bookingfast-auth'
    },
    global: {
      headers: {
        'x-client-info': 'bookingfast-web'
      }
    },
    db: {
      schema: 'public'
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  });
}

// Export singleton instance
export const supabase = supabaseInstance || (supabaseInstance = createSupabaseClient());

// 🔥 FIX: Export as FUNCTION, not constant
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}

// Network error detection utility
export function isNetworkError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code?.toLowerCase() || '';
  
  return (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout') ||
    errorCode === 'network_error' ||
    errorCode === 'fetch_error' ||
    error.name === 'NetworkError' ||
    (error.name === 'TypeError' && errorMessage.includes('failed to fetch'))
  );
}

// Retry request utility with exponential backoff
export async function retryRequest<T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      if (!isNetworkError(error) || attempt === maxRetries - 1) {
        throw error;
      }
      
      const delay = initialDelayMs * Math.pow(2, attempt);
      console.warn(`🔄 Retry ${attempt + 1}/${maxRetries} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Query cache utility
const queryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function getCachedQuery<T>(key: string): T | null {
  const cached = queryCache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    queryCache.delete(key);
    return null;
  }
  
  return cached.data as T;
}

export function setCachedQuery(key: string, data: any): void {
  queryCache.set(key, { data, timestamp: Date.now() });
}

export function clearQueryCache(pattern?: string): void {
  if (!pattern) {
    queryCache.clear();
    return;
  }
  
  for (const key of queryCache.keys()) {
    if (key.includes(pattern)) {
      queryCache.delete(key);
    }
  }
}
