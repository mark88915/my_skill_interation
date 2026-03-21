<script setup>
import { computed } from 'vue'
import hljs from 'highlight.js/lib/core'
import csharp from 'highlight.js/lib/languages/csharp'
import sql from 'highlight.js/lib/languages/sql'
import xml from 'highlight.js/lib/languages/xml'
import json from 'highlight.js/lib/languages/json'
import bash from 'highlight.js/lib/languages/bash'
import yaml from 'highlight.js/lib/languages/yaml'
import dockerfile from 'highlight.js/lib/languages/dockerfile'

hljs.registerLanguage('csharp', csharp)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('json', json)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('dockerfile', dockerfile)

const props = defineProps({
  lang: { type: String, default: 'csharp' },
  filename: { type: String, default: '' },
  code: { type: String, required: true }
})

const highlighted = computed(() => {
  const trimmed = props.code.replace(/^\n+|\n+$/g, '')
  try {
    return hljs.highlight(trimmed, { language: props.lang }).value
  } catch {
    return trimmed
  }
})
</script>

<template>
  <div class="code-block">
    <div class="code-header">
      <span class="filename">{{ filename }}</span>
      <span class="lang-tag">{{ lang === 'csharp' ? 'C#' : lang.toUpperCase() }}</span>
    </div>
    <pre><code v-html="highlighted"></code></pre>
  </div>
</template>
