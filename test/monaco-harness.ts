import { vi } from 'vitest'

function disposable() {
  return { dispose: vi.fn() }
}

function createUri(path: string) {
  return { toString: () => path }
}

function createModel(initial: string, uriPath: string) {
  let value = initial
  return {
    uri: createUri(uriPath),
    dispose: vi.fn(),
    getValue: () => value,
    setValue: (next: string) => {
      value = next
    },
  }
}

function createEmitter() {
  const handlers = new Map<string, Array<(...args: unknown[]) => void>>()
  return {
    on(name: string, cb: (...args: unknown[]) => void) {
      const list = handlers.get(name) ?? []
      list.push(cb)
      handlers.set(name, list)
      return disposable()
    },
    emit(name: string, ...args: unknown[]) {
      for (const cb of handlers.get(name) ?? []) cb(...args)
    },
  }
}

function createHarness() {
  const emitter = createEmitter()
  const models: Array<ReturnType<typeof createModel>> = []
  let lastCodeEditor: ReturnType<typeof createCodeEditor> | null = null
  let lastDiffEditor: ReturnType<typeof createDiffEditor> | null = null
  let markers: unknown[] = []

  function createCodeEditor(initialValue: string) {
    let value = initialValue
    const model = createModel(value, 'inmemory://model/1')
    models.push(model)
    const editor = {
      getValue: () => value,
      setValue: vi.fn((next: string) => {
        value = next
        model.setValue(next)
      }),
      getModel: () => model,
      dispose: vi.fn(),
      layout: vi.fn(),
      focus: vi.fn(),
      getPosition: vi.fn(() => ({ lineNumber: 1, column: 1 })),
      setPosition: vi.fn(),
      getSelection: vi.fn(() => null),
      setSelection: vi.fn(),
      updateOptions: vi.fn(),
      onDidChangeModelContent: (cb: (...args: unknown[]) => void) =>
        emitter.on('content', cb),
      onDidChangeCursorPosition: (cb: (...args: unknown[]) => void) =>
        emitter.on('cursor', cb),
      onDidChangeCursorSelection: (cb: (...args: unknown[]) => void) =>
        emitter.on('selection', cb),
      onDidFocusEditorText: (cb: (...args: unknown[]) => void) =>
        emitter.on('focus', cb),
      onDidBlurEditorText: (cb: (...args: unknown[]) => void) =>
        emitter.on('blur', cb),
      onKeyDown: (cb: (...args: unknown[]) => void) => emitter.on('keydown', cb),
      onKeyUp: (cb: (...args: unknown[]) => void) => emitter.on('keyup', cb),
      onDidPaste: (cb: (...args: unknown[]) => void) => emitter.on('paste', cb),
      onDidScrollChange: (cb: (...args: unknown[]) => void) =>
        emitter.on('scroll', cb),
      onContextMenu: (cb: (...args: unknown[]) => void) =>
        emitter.on('contextMenu', cb),
    }
    lastCodeEditor = editor
    return editor
  }

  function createDiffEditor() {
    const original = createModel('', 'inmemory://model/original')
    const modified = createModel('', 'inmemory://model/modified')
    let current = { original, modified }
    const modifiedEditor = createCodeEditor('')
    const editor = {
      getModifiedEditor: () => modifiedEditor,
      getOriginalEditor: () => modifiedEditor,
      getModel: () => current,
      setModel: vi.fn((next: { original: typeof original; modified: typeof modified }) => {
        current = next
      }),
      dispose: vi.fn(),
      layout: vi.fn(),
      updateOptions: vi.fn(),
      onDidUpdateDiff: (cb: (...args: unknown[]) => void) =>
        emitter.on('updateDiff', cb),
    }
    lastDiffEditor = editor
    return editor
  }

  const monaco = {
    editor: {
      create: vi.fn((_el: HTMLElement, options?: { value?: string }) =>
        createCodeEditor(options?.value ?? ''),
      ),
      createDiffEditor: vi.fn(() => createDiffEditor()),
      createModel: vi.fn((value: string, _language?: string) => {
        const model = createModel(value, `inmemory://model/${models.length + 1}`)
        models.push(model)
        return model
      }),
      setTheme: vi.fn(),
      setModelLanguage: vi.fn(),
      onDidChangeMarkers: vi.fn((cb: (...args: unknown[]) => void) =>
        emitter.on('markers', cb),
      ),
      getModelMarkers: vi.fn(() => markers),
    },
  }

  return {
    monaco,
    emitter,
    getLastCodeEditor: () => lastCodeEditor,
    getLastDiffEditor: () => lastDiffEditor,
    setMarkers(next: unknown[]) {
      markers = next
    },
  }
}

export const harness = createHarness()
