import path from 'node:path'
import { fileURLToPath } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apifoxMockBase = (env.VITE_API_BASE_URL ?? '').trim().replace(/\/$/, '')
  const proxyTarget =
    mode === 'apifox' && apifoxMockBase
      ? apifoxMockBase
      : env.VITE_PROXY_TARGET || 'http://localhost:8080'

  if (mode === 'apifox') {
    if (apifoxMockBase) {
      console.info(`[gsad] apifox mode: /api proxy -> ${proxyTarget}`)
    } else {
      console.warn(
        '[gsad] apifox mode: VITE_API_BASE_URL is empty — /api will proxy to',
        proxyTarget,
        '(set .env.apifox to avoid ECONNREFUSED when backend is down)',
      )
    }
  }

  return {
    plugins: [vue(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
