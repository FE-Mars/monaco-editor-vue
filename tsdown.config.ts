import { defineConfig } from 'tsdown'
import Vue from 'unplugin-vue/rolldown'

export default defineConfig([
  {
    entry: './src/index.ts',
    platform: 'neutral',
    plugins: [Vue({ isProduction: true })],
    dts: { vue: true },
    external: ['vue', 'monaco-editor', /^monaco-editor\//],
  },
  {
    entry: './src/vite.ts',
    platform: 'neutral',
    dts: true,
    unbundle: true,
    external: ['monaco-editor', /^monaco-editor\//],
  },
])
