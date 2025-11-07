import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { securityHeaders } from './vite-plugin-security-headers.js';
import fs from 'fs';
import path from 'path';

const isCI = process.env.CI || process.env.GITHUB_ACTIONS;

export default defineConfig(({ command }) => {
  const useHttps = !isCI && command === 'serve'; 

  let httpsConfig = undefined;
  if (useHttps) {
    const keyPath = path.resolve(__dirname, 'localhost-key.pem');
    const certPath = path.resolve(__dirname, 'localhost.pem');

    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      httpsConfig = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      };
    } else {
      console.warn(
        ' HTTPS certificates not found, running dev server over HTTP.'
      );
    }
  }

  return {
    plugins: [
      react(),
      securityHeaders(),
    ],
    server: {
      port: 3000,
      https: httpsConfig,
      host: 'localhost',
      strictPort: true,
      proxy: {
        '/api': {
          target: 'https://localhost:5001',
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on('error', (err, req, res) => {
              console.log('Proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('Proxying:', req.method, req.url);
            });
          },
        },
      },
    },
    build: {
      sourcemap: false,

      minify: true,
      esbuild: {
        drop: ['console', 'debugger'],
      },
    },
  };
});
