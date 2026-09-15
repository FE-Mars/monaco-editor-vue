# monaco-editor-vue

> [Monaco Editor](https://github.com/Microsoft/monaco-editor) for Vue 3.

[![NPM version][npm-image]][npm-url]
[![Downloads][downloads-image]][npm-url]

[![monaco-editor-vue](https://nodei.co/npm/monaco-editor-vue.png)](https://npmjs.org/package/monaco-editor-vue)

[npm-url]: https://www.npmjs.com/package/monaco-editor-vue
[downloads-image]: http://img.shields.io/npm/dm/monaco-editor-vue.svg
[npm-image]: http://img.shields.io/npm/v/monaco-editor-vue.svg

Requires **Vue 3.4+**, **monaco-editor 0.56+**, and an ESM bundler (Vite or Webpack 5). This package is ESM-only.

Vue 2 projects should stay on **`monaco-editor-vue@1.0.10`**.

## Installation

```bash
npm install monaco-editor-vue monaco-editor
```

`monaco-editor` is a peer dependency. The host app must install it and configure its web workers.

## Using with Vite

Call `setupMonacoEnvironment` once before creating the editor. Vite's `?worker` imports only work in the app that Vite bundles, which is why this helper lives in a separate entry.

```ts
// main.ts
import { createApp } from 'vue'
import { setupMonacoEnvironment } from 'monaco-editor-vue/vite'
import App from './App.vue'
import 'monaco-editor/min/vs/editor/editor.main.css'

setupMonacoEnvironment()
createApp(App).mount('#app')
```

```vue
<template>
  <MonacoEditor
    v-model="code"
    language="javascript"
    theme="vs-dark"
    :options="options"
    @mount="onMount"
    @change="onChange"
    @validate="onValidate"
  />
</template>

<script setup>
import { ref } from 'vue'
import MonacoEditor from 'monaco-editor-vue'

const code = ref('console.log("hello")')
const options = {
  minimap: { enabled: false },
}

function onMount(editor) {
  editor.focus()
}

function onChange(value) {
  console.log(value)
}

function onValidate(markers) {
  console.log(markers)
}
</script>
```

Vite needs ES module workers:

```ts
// vite.config.ts
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  optimizeDeps: {
    exclude: ['monaco-editor'],
  },
  resolve: {
    alias: {
      // monaco-editor 0.56 package exports do not include this CSS path
      'monaco-editor/min/vs/editor/editor.main.css': fileURLToPath(
        new URL(
          './node_modules/monaco-editor/min/vs/editor/editor.main.css',
          import.meta.url,
        ),
      ),
    },
  },
  worker: {
    format: 'es',
  },
})
```

If you prefer to wire workers yourself, copy this instead of importing `monaco-editor-vue/vite`:

```ts
import EditorWorker from 'monaco-editor/editor/editor.worker?worker'
import JsonWorker from 'monaco-editor/language/json/json.worker?worker'
import CssWorker from 'monaco-editor/language/css/css.worker?worker'
import HtmlWorker from 'monaco-editor/language/html/html.worker?worker'
import TsWorker from 'monaco-editor/language/typescript/ts.worker?worker'

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') return new JsonWorker()
    if (label === 'css' || label === 'scss' || label === 'less') return new CssWorker()
    if (label === 'html' || label === 'handlebars' || label === 'razor') return new HtmlWorker()
    if (label === 'typescript' || label === 'javascript') return new TsWorker()
    return new EditorWorker()
  },
}
```

Use `monaco-editor/editor/...` and `monaco-editor/language/...`. The old `monaco-editor/esm/vs/...` paths do not resolve under monaco-editor 0.56.

## Using with Webpack

```js
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin')

module.exports = {
  plugins: [
    new MonacoWebpackPlugin({
      languages: ['javascript', 'json', 'html', 'css', 'typescript'],
    }),
  ],
}
```

Use `monaco-editor-webpack-plugin@7` with monaco-editor 0.56. Do not import `monaco-editor-vue/vite` in a Webpack app.

Vue CLI:

```js
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin')

module.exports = {
  chainWebpack: (config) => {
    config.plugin('monaco-editor').use(MonacoWebpackPlugin, [
      {
        languages: ['json', 'javascript', 'html', 'xml'],
      },
    ])
  },
}
```

## Properties

`v-model` is the preferred way to bind editor text. `:value` still works for one-way updates.

- `width` width of editor. Defaults to `100%`.
- `height` height of editor. Defaults to `100%`.
- `value` / `v-model` value of the auto created model in the editor.
- `original` value of the auto created original model in the editor. Diff mode only.
- `language` the initial language of the auto created model. Defaults to `javascript`.
- `theme` the theme of the editor. Defaults to `vs`.
- `options` refer to [IStandaloneEditorConstructionOptions](https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor.IStandaloneEditorConstructionOptions.html).
- `editorBeforeMount(monaco)` called before the editor is created. Prefer `@before-mount` in new code.
- `editorMounted(editor, monaco)` called after the editor is created. Prefer `@mount` in new code.

## Events

Use Vue 3 event listeners. Names are camelCase in `emit`, kebab-case in templates.

| Event | Payload | When |
| --- | --- | --- |
| `beforeMount` | `monaco` | Before `create` / `createDiffEditor` |
| `mount` | `editor, monaco` | After the editor is ready |
| `unmount` | `editor, monaco` | Before dispose |
| `change` | `value, event` | Model content changes |
| `validate` | `markers` | Marker set for the current model changes |
| `cursorChange` | `event` | Cursor position changes |
| `selectionChange` | `event` | Selection changes |
| `focus` / `blur` | — | Text area focus |
| `keydown` / `keyup` | `event` | Editor key events |
| `paste` | `event` | Paste into the editor |
| `scroll` | `event` | Scroll position changes |
| `contextMenu` | `event` | Editor context menu |
| `updateDiff` | — | Diff computation updates |

```vue
<MonacoEditor
  v-model="code"
  @mount="onMount"
  @change="onChange"
  @validate="onValidate"
  @cursor-change="onCursorChange"
/>
```

`v-model` still emits `update:modelValue`. Vue 2 `@input` is gone.

## Exposed instance

Access via template ref:

```ts
editorRef.value?.focus()
editorRef.value?.getPosition()
editorRef.value?.layout()
```

- `editor` current Monaco instance
- `monaco`
- `getEditor()` code editor; Diff mode returns the modified side
- `getValue()` / `setValue(value)`
- `getModel()`
- `layout(dimension?)`
- `focus()`
- `getPosition()` / `setPosition(position)`
- `getSelection()` / `setSelection(selection)`
- `updateOptions(options)`

## Diff editor

```vue
<MonacoEditor
  v-model="code"
  :diff-editor="true"
  original="const a = 1"
  language="javascript"
/>
```

Monaco only supports one theme globally.

## Local playground

```bash
npm install
npm run dev
```

## Migrating from 1.x

1.x (`monaco-editor-vue@1.0.10`) is Vue 2 only. 2.x is Vue 3 only.

- Stay on `1.0.10` if the app is still Vue 2.
- Install `monaco-editor@^0.56.0` yourself. It is no longer bundled.
- Replace Vue 2 `v-model` / `@input` with Vue 3 `v-model` (`modelValue`).
- For Vite, call `setupMonacoEnvironment()` from `monaco-editor-vue/vite`.
- For Webpack, upgrade `monaco-editor-webpack-plugin` to 7.x.
- `options` now maps to `IStandaloneEditorConstructionOptions`.
