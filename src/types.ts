import type * as monaco from 'monaco-editor'

export type Monaco = typeof monaco

export type MonacoEditorInstance =
  | monaco.editor.IStandaloneCodeEditor
  | monaco.editor.IStandaloneDiffEditor

export type MonacoEditorOptions =
  monaco.editor.IStandaloneEditorConstructionOptions

export type MonacoDiffEditorOptions =
  monaco.editor.IStandaloneDiffEditorConstructionOptions

export type EditorBeforeMount = (
  monacoInstance: Monaco,
) => MonacoEditorOptions | MonacoDiffEditorOptions | void

export type EditorMounted = (
  editor: MonacoEditorInstance,
  monacoInstance: Monaco,
) => void

export type MonacoEditorEmits = {
  beforeMount: [monacoInstance: Monaco]
  mount: [editor: MonacoEditorInstance, monacoInstance: Monaco]
  unmount: [editor: MonacoEditorInstance, monacoInstance: Monaco]
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
}
