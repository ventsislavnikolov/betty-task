import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      components: fileURLToPath(new URL('./src/components', import.meta.url)),
      hooks: fileURLToPath(new URL('./src/hooks', import.meta.url)),
      lib: fileURLToPath(new URL('./src/lib', import.meta.url)),
      types: fileURLToPath(new URL('./src/types', import.meta.url)),
    },
  },
})
