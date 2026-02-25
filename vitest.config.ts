import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './'),
      components: path.resolve(import.meta.dirname, './components'),
      hooks: path.resolve(import.meta.dirname, './hooks'),
      lib: path.resolve(import.meta.dirname, './lib'),
      types: path.resolve(import.meta.dirname, './types'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    css: true,
    globals: true,
    include: ['tests/**/*.test.{ts,tsx}'],
  },
})
