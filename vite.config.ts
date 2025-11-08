import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.VITE_APP_VERSION || Date.now().toString())
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@contexts': path.resolve(__dirname, './src/contexts')
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js']
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    // ✅ ON GARDE LES CONSOLE.LOG EN DEV
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    tsconfigRaw: {
      compilerOptions: {
        skipLibCheck: true,
        noEmit: true
      }
    }
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'chart-vendor': ['recharts'],
          'icons-vendor': ['lucide-react']
        },
        chunkFileNames: (chunkInfo) => {
          const version = process.env.VITE_APP_VERSION || Date.now().toString();
          return `assets/[name]-${version}-[hash].js`;
        },
        entryFileNames: (chunkInfo) => {
          const version = process.env.VITE_APP_VERSION || Date.now().toString();
          return `assets/[name]-${version}-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const version = process.env.VITE_APP_VERSION || Date.now().toString();
          return `assets/[name]-${version}-[hash].[ext]`;
        }
      },
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        if (warning.code === 'SOURCEMAP_ERROR') return;
        if (warning.code === 'INVALID_ANNOTATION') return;
        warn(warning);
      }
    },
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  server: {
    port: 5173,
    strictPort: false,
    host: true
  },
  preview: {
    port: 5173,
    strictPort: false,
    host: true,
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block'
    }
  }
});
