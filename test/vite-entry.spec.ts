import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('monaco-editor/editor/editor.worker?worker', () => ({
  default: class EditorWorker {},
}))
vi.mock('monaco-editor/language/json/json.worker?worker', () => ({
  default: class JsonWorker {},
}))
vi.mock('monaco-editor/language/css/css.worker?worker', () => ({
  default: class CssWorker {},
}))
vi.mock('monaco-editor/language/html/html.worker?worker', () => ({
  default: class HtmlWorker {},
}))
vi.mock('monaco-editor/language/typescript/ts.worker?worker', () => ({
  default: class TsWorker {},
}))

describe('setupMonacoEnvironment', () => {
  beforeEach(() => {
    delete (globalThis as { MonacoEnvironment?: unknown }).MonacoEnvironment
  })

  it('registers getWorker for json, css, html, typescript and the editor', async () => {
    const { setupMonacoEnvironment } = await import('../src/vite')
    setupMonacoEnvironment()

    const env = (globalThis as { MonacoEnvironment?: { getWorker: Function } })
      .MonacoEnvironment
    expect(env?.getWorker).toBeTypeOf('function')
    expect(env?.getWorker('', 'json')).toBeInstanceOf(Object)
    expect(env?.getWorker('', 'scss')).toBeInstanceOf(Object)
    expect(env?.getWorker('', 'html')).toBeInstanceOf(Object)
    expect(env?.getWorker('', 'javascript')).toBeInstanceOf(Object)
    expect(env?.getWorker('', 'plaintext')).toBeInstanceOf(Object)
  })
})
