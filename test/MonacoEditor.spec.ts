import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { harness } from './monaco-harness'
import MonacoEditor from '../src/MonacoEditor.vue'

vi.mock('monaco-editor', async () => {
  const { harness: mocked } = await import('./monaco-harness')
  return mocked.monaco
})

describe('MonacoEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('emits beforeMount and mount, then creates the editor', async () => {
    const wrapper = mount(MonacoEditor, {
      props: { modelValue: 'hello' },
    })
    await nextTick()

    expect(wrapper.emitted('beforeMount')).toBeTruthy()
    expect(harness.monaco.editor.create).toHaveBeenCalled()
    expect(wrapper.emitted('mount')).toBeTruthy()
    expect(wrapper.emitted('validate')).toBeTruthy()
    wrapper.unmount()
  })

  it('does not mutate the options object passed in as a prop', async () => {
    const options = { readOnly: true }
    const wrapper = mount(MonacoEditor, {
      props: { options, editorBeforeMount: () => ({ minimap: { enabled: false } }) },
    })
    await nextTick()

    expect(options).toEqual({ readOnly: true })
    expect(harness.monaco.editor.create).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        readOnly: true,
        minimap: { enabled: false },
      }),
    )
    wrapper.unmount()
  })

  it('emits change and update:modelValue when the model content changes', async () => {
    const wrapper = mount(MonacoEditor, {
      props: { modelValue: 'hello' },
    })
    await nextTick()

    const editor = harness.getLastCodeEditor()
    editor?.setValue('hello world')
    harness.emitter.emit('content', { changes: [] })
    await nextTick()

    expect(wrapper.emitted('change')?.[0]?.[0]).toBe('hello world')
    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toBe('hello world')
    wrapper.unmount()
  })

  it('updates the editor when v-model changes from the parent', async () => {
    const wrapper = mount(MonacoEditor, {
      props: { modelValue: 'hello' },
    })
    await nextTick()

    await wrapper.setProps({ modelValue: 'from parent' })
    await nextTick()

    expect(harness.getLastCodeEditor()?.setValue).toHaveBeenCalledWith(
      'from parent',
    )
    wrapper.unmount()
  })

  it('creates a diff editor and disposes its models on unmount', async () => {
    const wrapper = mount(MonacoEditor, {
      props: {
        diffEditor: true,
        modelValue: 'modified',
        original: 'original',
      },
    })
    await nextTick()

    expect(harness.monaco.editor.createDiffEditor).toHaveBeenCalled()
    expect(harness.monaco.editor.create).not.toHaveBeenCalled()
    expect(harness.monaco.editor.createModel).toHaveBeenCalled()

    const diff = harness.getLastDiffEditor()
    const models = diff?.getModel()
    wrapper.unmount()

    expect(wrapper.emitted('unmount')).toBeTruthy()
    expect(diff?.dispose).toHaveBeenCalled()
    expect(models?.original.dispose).toHaveBeenCalled()
    expect(models?.modified.dispose).toHaveBeenCalled()
  })

  it('switches to a diff editor when diffEditor becomes true', async () => {
    const wrapper = mount(MonacoEditor, {
      props: { modelValue: 'hello' },
    })
    await nextTick()
    expect(harness.monaco.editor.create).toHaveBeenCalledTimes(1)

    await wrapper.setProps({ diffEditor: true })
    await flushPromises()
    await nextTick()

    expect(harness.monaco.editor.createDiffEditor).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('updates language and theme through monaco APIs', async () => {
    const wrapper = mount(MonacoEditor, {
      props: { modelValue: 'hello', language: 'javascript', theme: 'vs' },
    })
    await nextTick()

    await wrapper.setProps({ language: 'json' })
    await nextTick()
    expect(harness.monaco.editor.setModelLanguage).toHaveBeenCalled()

    await wrapper.setProps({ theme: 'vs-dark' })
    await nextTick()
    expect(harness.monaco.editor.setTheme).toHaveBeenCalledWith('vs-dark')
    wrapper.unmount()
  })

  it('exposes editor helpers on the component instance', async () => {
    const wrapper = mount(MonacoEditor, {
      props: { modelValue: 'hello' },
    })
    await nextTick()

    const vm = wrapper.vm as unknown as {
      getValue: () => string
      focus: () => void
      getPosition: () => { lineNumber: number; column: number } | null
    }

    expect(vm.getValue()).toBe('hello')
    vm.focus()
    expect(harness.getLastCodeEditor()?.focus).toHaveBeenCalled()
    expect(vm.getPosition()).toEqual({ lineNumber: 1, column: 1 })
    wrapper.unmount()
  })

  it('emits cursorChange and focus from monaco listeners', async () => {
    const wrapper = mount(MonacoEditor)
    await nextTick()

    harness.emitter.emit('cursor', { position: { lineNumber: 2, column: 4 } })
    harness.emitter.emit('focus')
    await nextTick()

    expect(wrapper.emitted('cursorChange')?.[0]?.[0]).toEqual({
      position: { lineNumber: 2, column: 4 },
    })
    expect(wrapper.emitted('focus')).toBeTruthy()
    wrapper.unmount()
  })

  it('disposes the editor on unmount', async () => {
    const wrapper = mount(MonacoEditor, {
      props: { modelValue: 'hello' },
    })
    await nextTick()
    const editor = harness.getLastCodeEditor()
    wrapper.unmount()
    expect(editor?.dispose).toHaveBeenCalled()
  })
})
