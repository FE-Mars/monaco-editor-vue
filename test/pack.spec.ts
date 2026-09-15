import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

describe('npm package', () => {
  const pkg = JSON.parse(
    readFileSync(resolve(root, 'package.json'), 'utf8'),
  ) as {
    name: string
    version: string
    type: string
    files: string[]
    exports: Record<string, { types?: string; import?: string }>
    peerDependencies: Record<string, string>
  }

  it('is an ESM Vue 3 package with monaco-editor as a peer', () => {
    expect(pkg.name).toBe('monaco-editor-vue')
    expect(pkg.version).toMatch(/^2\./)
    expect(pkg.type).toBe('module')
    expect(pkg.files).toContain('dist')
    expect(pkg.peerDependencies.vue).toContain('3.')
    expect(pkg.peerDependencies['monaco-editor']).toContain('0.56')
  })

  it('exports the component and the Vite worker entry', () => {
    expect(pkg.exports['.'].import).toBe('./dist/index.js')
    expect(pkg.exports['.'].types).toBe('./dist/index.d.ts')
    expect(pkg.exports['./vite'].import).toBe('./dist/vite.js')
    expect(pkg.exports['./vite'].types).toBe('./dist/vite.d.ts')
  })
})
