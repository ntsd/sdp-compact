<script lang="ts">
  import Highlight from "svelte-highlight";
  import typescript from "svelte-highlight/languages/typescript";
  import "svelte-highlight/styles/github.css";
  import { npmLink } from "../const";

  let copied = false;
  let copiedTimeout: NodeJS.Timeout;

  const installCode = "npm install sdp-compact";
  const exmapleCode = String.raw`import * as spdCompact from "sdp-compact";

const sessDesc: RTCSessionDescriptionInit = {
  type: "offer",
  sdp: "v=0\r\no=- 4109260023080860376 2 IN IP4 127.0.0.1\r\n",
};

const options: spdCompact.Options = { compress: true };

// compact the 'RTCSessionDescriptionInit'
const compactedSessDesc = spdCompact.compact(sessDesc, options);
const decompactedSessDesc = spdCompact.decompact(compactedSPD, options);

// compact only the SDP string, will return base64 encoded if compress is enabled.
const compactedSPD = spdCompact.compactSDP(sessDesc.sdp, options);
// for decompact need to specify if it's offer or answer because it's not include in SDP
const decompactedSPD = spdCompact.decompactSDP(compactedSPD, true, options);

// compact only the SDP string to bytes
const compactedSPDBytes = spdCompact.compactSDPBytes(sessDesc.sdp, options);
// decompact the compacted SDP bytes to decompacted string
const decompactedSPD = spdCompact.decompactSDPBytes(compactedSPDBytes, true, options);`;
</script>

<h1 class="text-4xl font-bold">SDP Compact</h1>

<a href={npmLink} class="mt-4"
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
  A WebRTC SDP can remove some of the attributes to compress/compact and share
  config on both the offer and answer sides.
</p>

<h2 class="text-2xl font-bold mt-8 mb-4">Features</h2>

<ul class="list-disc pl-6">
  <li>Shorten WebRTC SDP.</li>
  <li>Options to fixed parameters for both the offer and answer side.</li>
  <li>Compress with zlib deflate then base64.</li>
  <li>Bytes based allow choosing any encoding.</li>
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

<p class="mb-2">
*For options reference can see <a href="https://github.com/ntsd/sdp-compact#options" class="underline">GitHub README</a>
</p>

<Highlight
  class="select-all rounded ring-2"
  language={typescript}
  code={exmapleCode}
/>
