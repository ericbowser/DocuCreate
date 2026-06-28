import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { DEFAULT_API_PORT } from './src/config/apiPort.js'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiPort = Number(env.API_PORT) || DEFAULT_API_PORT

  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('@react-pdf')) return 'react-pdf'
            if (id.includes('react-icons')) return 'react-icons'
            if (id.includes('node_modules/react-hook-form')) return 'vendor-forms'
            if (id.includes('node_modules/react-router') || id.includes('node_modules/@remix-run')) {
              return 'vendor-router'
            }
            if (
              id.includes('node_modules/react-dom')
              || id.includes('node_modules/react/jsx-runtime')
              || id.includes('node_modules/react/index')
            ) {
              return 'vendor-react'
            }
          },
        },
      },
    },
    server: {
      port: 24333,
      proxy: {
        '/api': {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
      },
    },
  }
})
