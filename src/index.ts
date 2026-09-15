import * as monaco from 'monaco-editor'
import MonacoEditor from './MonacoEditor.vue'

export { monaco }
export { MonacoEditor }
export default MonacoEditor
export type {
  EditorBeforeMount,
  EditorMounted,
  Monaco,
  MonacoDiffEditorOptions,
  MonacoEditorEmits,
  MonacoEditorInstance,
  MonacoEditorOptions,
} from './types'
