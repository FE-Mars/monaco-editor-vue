import { createApp } from 'vue'
import { setupMonacoEnvironment } from 'monaco-editor-vue/vite'
import App from './App.vue'
import 'monaco-editor/min/vs/editor/editor.main.css'
import './style.css'

setupMonacoEnvironment()

createApp(App).mount('#app')
