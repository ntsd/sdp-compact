<script lang="ts">
  import { onMount } from 'svelte';
  import Prism from 'prismjs';
  import 'prismjs/components/prism-typescript';
  import 'prismjs/themes/prism.css';

  interface Props {
    code: string;
    language?: string;
    class?: string;
  }

  let { code, language = 'typescript', class: className = '' }: Props = $props();
  let codeElement = $state<HTMLElement>();

  onMount(() => {
    if (codeElement) {
      Prism.highlightElement(codeElement);
    }
  });

  $effect(() => {
    if (codeElement && code) {
      Prism.highlightElement(codeElement);
    }
  });
</script>

<pre class={className}><code bind:this={codeElement} class={`language-${language}`}>{code}</code></pre>