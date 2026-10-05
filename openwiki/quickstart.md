---
type: "Reference"
title: "Quickstart"
description: "What sdp-compact does, how to install it, minimal compact/decompact round-trip usage at both the RTCSessionDescription and raw-SDP-string levels, the task-routing map to the other wiki pages, and how to run the format/build/test precommit gate."
tags: [quickstart, usage, compact, decompact, round-trip, precommit]
verified:
  - by: openwiki/0.6.0
    at: 2026-10-01T21:00:49.610Z
sources:
  - id: openwiki-source-87a55af411f380073c43254e
    resource: repo://.npmignore
  - id: openwiki-source-9ab161c6e9774cf771b19ced
    resource: repo://.zerofactory/precommit.sh
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-4d2594f84561bd733f0a8353
    resource: repo://page/package.json
  - id: openwiki-source-23775c3de52f3ab95a13cb8b
    resource: repo://README.md
  - id: openwiki-source-f29b153e49a0c9bf22b53533
    resource: repo://src/compact.ts
  - id: openwiki-source-c2ac723625317a537aa3263f
    resource: repo://src/decompact.ts
  - id: openwiki-source-d1fbef09192ffbab6eff0bc2
    resource: repo://src/index.ts
generated: { by: "hermes", at: "2026-10-01T20:15:14.022Z" }
---

## What is sdp-compact

`sdp-compact` is a small TypeScript (ESM) library that **shortens WebRTC
Session Description Protocol (SDP)** strings so an offer/answer can be sent
compactly between peers. It works on **Unified Plan** SDP: fixed, predictable
fields (version, session name, origin, timing, BUNDLE, mid, setup, trickle)
are stripped, the variable payload (media, candidates, codecs, fingerprint) is
kept and token-shrunk, and the result is optionally zlib-deflated and base64
or base92 encoded. The decompact side reconstructs a faithful, canonical SDP.

It is a pure library with no I/O and no network calls — the only runtime
dependencies are `sdp-transform` (parse/write normalization) and `fflate`
(zlib). A standalone SvelteKit demo app lives in `page/` and is published at
`https://ntsd.github.io/sdp-compact`.

## Install

```bash
npm install sdp-compact
```

## Minimal usage

```typescript
import * as spdCompact from "sdp-compact";

const sessDesc: RTCSessionDescriptionInit = {
  type: "offer",
  sdp: `v=0\r\no=- 4109260023080860376 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=extmap-allow-mixed\r\na=msid-semantic: WMS\r\n`,
};

const options: spdCompact.Options = { compress: true }; // 'base64' (or 'base92' for smaller output)

// Round-trip at the RTCSessionDescription level:
const compacted = spdCompact.compact(sessDesc, options);
const decompacted = spdCompact.decompact(compacted, options);

// Compact only the SDP string (returns base64 when compress is on):
const compactedSDP = spdCompact.compactSDP(sessDesc.sdp, options);
// decompact needs the type, which the raw string does not carry:
const decompactedSDP = spdCompact.decompactSDP(
  compactedSDP,
  /* isOffer */ true,
  options,
);

// Compact the SDP string to a Uint8Array:
const compactedBytes = spdCompact.compactSDPBytes(sessDesc.sdp, options);
const decompactedFromBytes = spdCompact.decompactSDPBytes(
  compactedBytes,
  true,
  options,
);
```

All four `RTCSdpType` values (offer/answer/pranswer/rollback) round-trip via
`compact`/`decompact`; invalid or missing input throws a descriptive error
rather than silently defaulting to `answer`.

## Task routing map

Read the page that matches your task; each page is self-contained and
repository-grounded.

| You need to understand…                                                                                                               | Read this page                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| The overall system, module map, data flow, and build/test layout                                                                      | [Architecture](architecture.md)                                  |
| The exact public functions, their signatures, `Options`, defaults, and validation errors                                              | [Public API and Options](systems/public-api.md)                  |
| Which SDP lines/fields are dropped, kept, rewritten, or restored, and the offer/answer asymmetry                                      | [SDP Transform Pipeline](systems/sdp-transform.md)               |
| The token dictionary: field/attribute reverse-maps, candidate/media/extmap/rtcp-fb substitution, and the round-trip-safety invariants | [Token Dictionary and Substitution](systems/token-dictionary.md) |
| zlib deflate, base64/base92 codecs, and the `FingerprintToBase64` bit-packing (and its error behavior)                                | [Encodings and Compression](systems/encodings.md)                |

## Working in this repo

- **Run checks**: `./.zerofactory/precommit.sh` (runs Prettier format,
  `npm run build` → `tsc`, and `npm test` → jest; auto-`npm install`s when
  `node_modules` is absent). Subcommands: `format` | `build` | `test` |
  `install-hook`.
- **Tests** live in `__test__/` (`test.ts` for end-to-end round-trip + input
  validation; `encoding.test.ts` for the base64/base92 primitives). Compare
  parsed SDPs with `sdpTransform.parse` (round-trip is logical-equality, not
  byte-identity).
- **Build** is `npm run build` (tsc, `src/*.ts` → `dist/`). The `page/` demo
  app is a separate toolchain, excluded from the library build/test cycle and
  from the npm package.
