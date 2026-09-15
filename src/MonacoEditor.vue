<script setup lang="ts">
import * as monaco from 'monaco-editor'
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  watch,
} from 'vue'
import type {
  EditorBeforeMount,
  EditorMounted,
  MonacoDiffEditorOptions,
  MonacoEditorInstance,
  MonacoEditorOptions,
} from './types'

defineOptions({ name: 'MonacoEditor' })

const model = defineModel<string>()

const props = withDefaults(
  defineProps<{
    value?: string
    diffEditor?: boolean
    width?: string | number
    height?: string | number
    original?: string
    language?: string
    theme?: string
    options?: MonacoEditorOptions | MonacoDiffEditorOptions
    editorMounted?: EditorMounted
    editorBeforeMount?: EditorBeforeMount
  }>(),
  {
    diffEditor: false,
    width: '100%',
    height: '100%',
    original: '',
    language: 'javascript',
    theme: 'vs',
    options: () => ({}),
  },
)

const emit = defineEmits<{
  beforeMount: [monacoInstance: typeof monaco]
  mount: [editor: MonacoEditorInstance, monacoInstance: typeof monaco]
  unmount: [editor: MonacoEditorInstance, monacoInstance: typeof monaco]
  change: [value: string, event: monaco.editor.IModelContentChangedEvent]
  validate: [markers: monaco.editor.IMarker[]]
  cursorChange: [event: monaco.editor.ICursorPositionChangedEvent]
  selectionChange: [event: monaco.editor.ICursorSelectionChangedEvent]
  focus: []
  blur: []
  keydown: [event: monaco.IKeyboardEvent]
  keyup: [event: monaco.IKeyboardEvent]
  paste: [event: monaco.editor.IPasteEvent]
  scroll: [event: monaco.IScrollEvent]
  contextMenu: [event: monaco.editor.IEditorMouseEvent]
  updateDiff: []
}>()

const containerRef = shallowRef<HTMLDivElement | null>(null)
const editorRef = shallowRef<MonacoEditorInstance | null>(null)
let resizeObserver: ResizeObserver | undefined
let listeners: monaco.IDisposable[] = []
let suppressModelUpdate = false

const boundValue = computed(() => model.value ?? props.value ?? '')

const style = computed(() => ({
  width: toCssSize(props.width),
  height: toCssSize(props.height),
}))

function toCssSize(value: string | number) {
  return /^\d+$/.test(String(value)) ? `${value}px` : String(value)
}

function isDiffEditor(
  editor: MonacoEditorInstance,
): editor is monaco.editor.IStandaloneDiffEditor {
  return (
    typeof (editor as monaco.editor.IStandaloneDiffEditor)
      .getModifiedEditor === 'function'
  )
}

function getCodeEditor() {
  const editor = editorRef.value
  if (!editor) return null
  return isDiffEditor(editor) ? editor.getModifiedEditor() : editor
}

function getValue() {
  return getCodeEditor()?.getValue() ?? ''
}

function setValue(value: string) {
  const editor = getCodeEditor()
  if (!editor || editor.getValue() === value) return
  suppressModelUpdate = true
  editor.setValue(value)
  suppressModelUpdate = false
}

function getModel() {
  return getCodeEditor()?.getModel() ?? null
}

function layout(dimension?: monaco.editor.IDimension) {
  editorRef.value?.layout(dimension)
}

function focus() {
  getCodeEditor()?.focus()
}

function getPosition() {
  return getCodeEditor()?.getPosition() ?? null
}

function setPosition(position: monaco.IPosition) {
  getCodeEditor()?.setPosition(position)
}

function getSelection() {
  return getCodeEditor()?.getSelection() ?? null
}

function setSelection(selection: monaco.IRange) {
  getCodeEditor()?.setSelection(selection)
}

function updateOptions(
  options: monaco.editor.IEditorOptions | monaco.editor.IDiffEditorOptions,
) {
  editorRef.value?.updateOptions(options)
}

function setDiffModels(value: string, original: string) {
  const editor = editorRef.value
  if (!editor || !isDiffEditor(editor)) return

  const previous = editor.getModel()
  editor.setModel({
    original: monaco.editor.createModel(original, props.language),
    modified: monaco.editor.createModel(value, props.language),
  })
  previous?.original.dispose()
  previous?.modified.dispose()
}

function emitChange(event: monaco.editor.IModelContentChangedEvent) {
  if (suppressModelUpdate) return
  const value = getValue()
  model.value = value
  emit('change', value, event)
}

function emitValidate() {
  const resource = getModel()?.uri
  if (!resource) return
  emit('validate', monaco.editor.getModelMarkers({ resource }))
}

function clearListeners() {
  for (const listener of listeners) listener.dispose()
  listeners = []
}

function bindEditorEvents() {
  const codeEditor = getCodeEditor()
  const editor = editorRef.value
  if (!codeEditor || !editor) return

  listeners.push(
    codeEditor.onDidChangeModelContent((event) => emitChange(event)),
    codeEditor.onDidChangeCursorPosition((event) => {
      emit('cursorChange', event)
    }),
    codeEditor.onDidChangeCursorSelection((event) => {
      emit('selectionChange', event)
    }),
    codeEditor.onDidFocusEditorText(() => emit('focus')),
    codeEditor.onDidBlurEditorText(() => emit('blur')),
    codeEditor.onKeyDown((event) => emit('keydown', event)),
    codeEditor.onKeyUp((event) => emit('keyup', event)),
    codeEditor.onDidPaste((event) => emit('paste', event)),
    codeEditor.onDidScrollChange((event) => emit('scroll', event)),
    codeEditor.onContextMenu((event) => emit('contextMenu', event)),
    monaco.editor.onDidChangeMarkers((uris) => {
      const modelUri = getModel()?.uri
      if (!modelUri) return
      if (!uris.some((uri) => uri.toString() === modelUri.toString())) return
      emitValidate()
    }),
  )

  if (isDiffEditor(editor)) {
    listeners.push(editor.onDidUpdateDiff(() => emit('updateDiff')))
  }
}

function initMonaco() {
  if (!containerRef.value) return

  emit('beforeMount', monaco)
  const extraOptions = props.editorBeforeMount?.(monaco) || {}
  const options = { ...props.options, ...extraOptions }

  if (props.diffEditor) {
    const editor = monaco.editor.createDiffEditor(containerRef.value, {
      theme: props.theme,
      ...options,
    })
    editorRef.value = editor
    setDiffModels(boundValue.value, props.original)
  } else {
    const editor = monaco.editor.create(containerRef.value, {
      value: boundValue.value,
      language: props.language,
      theme: props.theme,
      ...options,
    })
    editorRef.value = editor
  }

  bindEditorEvents()
  emitValidate()
  props.editorMounted?.(editorRef.value, monaco)
  emit('mount', editorRef.value, monaco)
}

function disposeEditor() {
  const editor = editorRef.value
  if (!editor) return

  emit('unmount', editor, monaco)
  clearListeners()

  if (isDiffEditor(editor)) {
    const models = editor.getModel()
    editor.dispose()
    models?.original.dispose()
    models?.modified.dispose()
  } else {
    const modelInstance = editor.getModel()
    editor.dispose()
    modelInstance?.dispose()
  }

  editorRef.value = null
}

watch(
  () => props.options,
  (options) => {
    updateOptions(options)
  },
  { deep: true },
)

watch(boundValue, (value) => {
  if (value !== getValue()) setValue(value)
})

watch(
  () => props.original,
  (original) => {
    const editor = editorRef.value
    if (!editor || !isDiffEditor(editor)) return
    const models = editor.getModel()
    if (models && models.original.getValue() !== original) {
      models.original.setValue(original)
    }
  },
)

watch(
  () => props.language,
  (language) => {
    const editor = editorRef.value
    if (!editor) return
    if (isDiffEditor(editor)) {
      const models = editor.getModel()
      if (!models) return
      monaco.editor.setModelLanguage(models.original, language)
      monaco.editor.setModelLanguage(models.modified, language)
      emitValidate()
      return
    }
    const modelInstance = editor.getModel()
    if (modelInstance) monaco.editor.setModelLanguage(modelInstance, language)
    emitValidate()
  },
)

watch(
  () => props.theme,
  (theme) => {
    monaco.editor.setTheme(theme)
  },
)

watch(
  () => props.diffEditor,
  () => {
    disposeEditor()
    nextTick(() => {
      initMonaco()
    })
  },
)

watch(style, () => {
  nextTick(() => layout())
})

onMounted(() => {
  initMonaco()
  if (!containerRef.value) return
  resizeObserver = new ResizeObserver(() => layout())
  resizeObserver.observe(containerRef.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  disposeEditor()
})

defineExpose({
  editor: editorRef,
  monaco,
  getEditor: getCodeEditor,
  getValue,
  setValue,
  getModel,
  layout,
  focus,
  getPosition,
  setPosition,
  getSelection,
  setSelection,
  updateOptions,
})
</script>

<template>
  <div
    ref="containerRef"
    class="monaco-editor-vue monaco_editor_container"
    :style="style"
  />
</template>
