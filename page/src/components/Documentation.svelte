<script lang="ts">
  import Highlight from "svelte-highlight";
  import typescript from "svelte-highlight/languages/typescript";
  import "svelte-highlight/styles/github.css";

  let copied = false;
  let copiedTimeout: NodeJS.Timeout;

  const installCode = "npm install sdp-compact";
  const exmapleCode = String.raw`import * as spdCompact from "sdp-compact";

const sessDesc: RTCSessionDescriptionInit = {
  type: "offer",
  sdp: "v=0\r\no=- 4109260023080860376 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=extmap-allow-mixed\r\na=msid-semantic: WMS\r\n",
};
const options: spdCompact.Options = {}; // options need to be the same for compact and decompact

// compact the RTCSessionDescriptionInit
const compactedSessDesc = spdCompact.compact(sessDesc, options);
const decompactedSessDesc = spdCompact.decompact(compactedSPD, options);

// compact only the SDP string
const compactedSPD = spdCompact.compactSDP(sessDesc.sdp, options);
// decompact sdp, need to specify if it's offer or answer on the 2nd parameter
const decompactedSPD = spdCompact.decompactSDP(compactedSPD, true, options);`;
</script>

<h1 class="text-4xl font-bold">SDP Compact</h1>

<a href="https://www.npmjs.com/package/sdp-compact" class="mt-4"
  ><img
    src="https://badge.fury.io/js/sdp-compact.svg"
    alt="npm version"
    height="18"
  /></a
>

<p class="mt-4">
  Shorten WebRTC Session Description Protocol (SDP) based on Unified Plan SDP.
</p>

<h2 class="text-2xl font-bold mt-8 mb-4">Why?</h2>

<p>
  A WebRTC SDP can remove some attributes to compress/compact and share
  configuration on both offer and answer sides.
</p>

<h2 class="text-2xl font-bold mt-8 mb-4">Features</h2>

<ul class="list-disc pl-6">
  <li>Shorten WebRTC SDP.</li>
  <li>Options to fixed parameters for both offer and answer side.</li>
  <li>Compress with zlib deflate then base64.</li>
</ul>

<h2 class="text-2xl font-bold mt-8 mb-4">Installation</h2>

<code
  class="cursor-pointer select-all rounded px-4 py-2 ring-2"
  on:mousedown={(e) => {
    navigator.clipboard.writeText(e.currentTarget.innerText);
    copied = true;
    if (copiedTimeout !== undefined) clearTimeout(copiedTimeout);
    copiedTimeout = setTimeout(() => (copied = false), 2000);
  }}
>
  {installCode}
</code>

<p class="opacity-0 transition" class:opacity-100={copied}>
  copied to clipboard
</p>

<h2 class="text-2xl font-bold mb-4">Examples</h2>

<Highlight
  class="select-all rounded ring-2"
  language={typescript}
  code={exmapleCode}
/>
