import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Optional: override the proxy target with AI_PROXY_TARGET env var.
// Usage: AI_PROXY_TARGET=https://api.openai.com npm run dev
const proxyTarget = process.env.AI_PROXY_TARGET ?? 'https://api.deepseek.com'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/ai-proxy': {
        target: proxyTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ai-proxy/, ''),
      },
    },
  },
})
