<script setup lang="ts">
import { ref } from 'vue'
import MonacoEditor from 'monaco-editor-vue'
import type { MonacoEditorInstance } from 'monaco-editor-vue'
import type { editor } from 'monaco-editor'

const languages = ['javascript', 'typescript', 'json', 'html', 'css', 'markdown']
const themes = ['vs', 'vs-dark', 'hc-black']

const language = ref('javascript')
const theme = ref('vs-dark')
const diffEditor = ref(false)
const focused = ref(false)
const problemCount = ref(0)
const cursor = ref({ lineNumber: 1, column: 1 })
const editorRef = ref<{
  focus: () => void
} | null>(null)
const code = ref(`function hello(name) {
  return \`Hello, \${name}\`
}

console.log(hello('monaco-editor-vue'))
`)
const original = ref(`function hello(name) {
  return 'Hello, ' + name
}

console.log(hello('world'))
`)

function onMount(editor: MonacoEditorInstance) {
  editor.focus()
}

function onCursorChange(event: editor.ICursorPositionChangedEvent) {
  cursor.value = event.position
}

function onValidate(markers: editor.IMarker[]) {
  problemCount.value = markers.length
}
</script>

<template>
  <div class="playground">
    <header class="toolbar">
      <strong>monaco-editor-vue</strong>
      <label>
        Language
        <select v-model="language">
          <option v-for="item in languages" :key="item" :value="item">
            {{ item }}
          </option>
        </select>
      </label>
      <label>
        Theme
        <select v-model="theme">
          <option v-for="item in themes" :key="item" :value="item">
            {{ item }}
          </option>
        </select>
      </label>
      <label class="toggle">
        <input v-model="diffEditor" type="checkbox" />
        Diff
      </label>
    </header>
    <div class="editor-pane">
      <MonacoEditor
        ref="editorRef"
        v-model="code"
        :original="original"
        :language="language"
        :theme="theme"
        :diff-editor="diffEditor"
        height="100%"
        :options="{ minimap: { enabled: false }, fontSize: 14 }"
        @mount="onMount"
        @focus="focused = true"
        @blur="focused = false"
        @cursor-change="onCursorChange"
        @validate="onValidate"
      />
    </div>
    <footer class="status">
      <span>Ln {{ cursor.lineNumber }}, Col {{ cursor.column }}</span>
      <span>{{ problemCount }} problems</span>
      <span>{{ focused ? 'focused' : 'idle' }}</span>
    </footer>
  </div>
</template>

<style scoped>
.playground {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #3a342c;
  background: #221e19;
}

.toolbar strong {
  margin-right: auto;
  color: #f0d2a8;
  letter-spacing: 0.02em;
}

label {
  display: flex;
  gap: 8px;
  align-items: center;
  color: #c9c2b6;
  font-size: 13px;
}

select {
  color: #f4efe6;
  border: 1px solid #5a5044;
  border-radius: 4px;
  background: #161513;
  padding: 4px 8px;
}

.toggle {
  user-select: none;
}

.editor-pane {
  flex: 1;
  min-height: 0;
}

.status {
  display: flex;
  gap: 16px;
  padding: 6px 16px;
  border-top: 1px solid #3a342c;
  background: #1b1814;
  color: #b9b1a6;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
</style>
