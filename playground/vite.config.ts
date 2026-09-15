import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [vue()],
  resolve: {
    alias: {
      'monaco-editor-vue/vite': fileURLToPath(
        new URL('../src/vite.ts', import.meta.url),
      ),
      'monaco-editor-vue': fileURLToPath(
        new URL('../src/index.ts', import.meta.url),
      ),
      'monaco-editor/min/vs/editor/editor.main.css': fileURLToPath(
        new URL(
          '../node_modules/monaco-editor/min/vs/editor/editor.main.css',
          import.meta.url,
        ),
      ),
    },
  },
  optimizeDeps: {
    exclude: ['monaco-editor'],
  },
  worker: {
    format: 'es',
  },
  server: {
    port: 5173,
  },
})
