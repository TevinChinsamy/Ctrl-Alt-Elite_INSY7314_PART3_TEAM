import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { securityHeaders } from './vite-plugin-security-headers.js';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    securityHeaders(), // Add security headers middleware
  ],
  server: {
    port: 3000,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'localhost-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'localhost.pem'))
    },
    host: 'localhost',
    strictPort: true,
    proxy: {
      '/api': {
        target: 'https://localhost:5001',
        changeOrigin: true,
        secure: false, // Allow self-signed certificates in development
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying:', req.method, req.url);
          });
        }
      },
    },
  },
  build: {
    // Security: Generate source maps only in development
    sourcemap: false,
    // Minify for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true, // Remove debugger statements
      },
    },
  },
});
