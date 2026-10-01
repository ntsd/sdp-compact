---
type: "Reference"
title: "Architecture"
openwiki_generated: true
verified:
  - by: openwiki/0.6.0
    at: 2026-10-01T20:15:14.022Z
sources:
  - id: openwiki-source-d42319ddef0ecb928498ecb5
    resource: repo://__test__/test.ts
  - id: openwiki-source-87a55af411f380073c43254e
    resource: repo://.npmignore
  - id: openwiki-source-9ab161c6e9774cf771b19ced
    resource: repo://.zerofactory/precommit.sh
  - id: openwiki-source-9b453fe340921a939782671c
    resource: repo://jest.config.cts
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-4d2594f84561bd733f0a8353
    resource: repo://page/package.json
  - id: openwiki-source-f29b153e49a0c9bf22b53533
    resource: repo://src/compact.ts
  - id: openwiki-source-957fa5e3e38745d1f0aa2cf6
    resource: repo://src/compress.ts
  - id: openwiki-source-c2ac723625317a537aa3263f
    resource: repo://src/decompact.ts
  - id: openwiki-source-d1fbef09192ffbab6eff0bc2
    resource: repo://src/index.ts
  - id: openwiki-source-98d5ddb014a0fd4d678f6f2a
    resource: repo://tsconfig.json
generated: { by: "hermes", at: "2026-10-01T20:15:14.022Z" }
---

## Overview

`sdp-compact` is a small TypeScript (ESM) library that shortens WebRTC Session
Description Protocol (SDP) strings so an offer/answer can be transmitted
compactly between peers. It works on **Unified Plan** SDP: fixed, predictable
fields are stripped and only the variable payload (media, candidates, codecs,
fingerprint) is kept, optionally zlib-deflated and base64/base92 encoded.

The whole library is `src/`. The public surface is re-exported through
`src/index.ts`, which fans out to the three top-level modules:

| Module             | Responsibility                                                                                                                |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `src/compact.ts`   | Public compact entrypoints (`compact`, `compactSDP`, `compactSDPBytes`) and the line-level compaction pipeline.               |
| `src/decompact.ts` | Public decompact entrypoints (`decompact`, `decompactSDP`, `decompactSDPBytes`) and the line-level decompaction pipeline.     |
| `src/options.ts`   | `Options`/`OriginOptions`/`MediaOptions` types, `DefaultOptions`, and `mergeOptions`.                                         |
| `src/dict.ts`      | Token-dictionary substitution layer: field/attribute reverse-maps and position-based candidate/media/extmap/rtcp-fb encoders. |
| `src/compress.ts`  | zlib deflate/inflate (via `fflate`) and base64/base92 codec dispatch.                                                         |
| `src/base64.ts`    | base64 helpers and `FingerprintToBase64` hex↔base64 bit-packing.                                                              |
| `src/base92.ts`    | base92 alphabet encoder/decoder.                                                                                              |

Runtime dependencies are exactly two: `sdp-transform` (parse/write
normalization) and `fflate` (zlib deflate/inflate). Everything else is
self-contained.

## End-to-end data flow

A `compact`/`compactSDP` call runs the SDP string through three stages, in
order:

1. **Line-level transform** (`compactSDPStr` in `src/compact.ts`): splits the
   SDP on `\r\n`, then for each line either drops it (fixed fields), rewrites
   it (origin, media, candidate, fingerprint, connection, extmap, rtcp-fb), or
   keeps it verbatim. Surviving lines are joined with `~`.
2. **Field-name substitution**: if `options.replaceFieldNames` is set, the
   two-character field prefixes (`v=`, `o=`, `s=`, `c=`, `a=`, `m=`, `t=`) and
   the `a=` attribute names are replaced with single-character codes via the
   maps in `src/dict.ts`.
3. **Optional compression + encoding** (`src/compress.ts`): when
   `options.compress` is truthy, the string is zlib-deflated (`level: 9`) and
   then encoded as base64 or base92. `compactSDP` returns the encoded string;
   `compactSDPBytes` returns the raw `Uint8Array`.

`decompact`/`decompactSDP`/`decompactSDPBytes` run the exact inverse:
decompress/decode first, then re-expand field names, then re-insert the fixed
fields (v=/s=/t=, extmap-allow-mixed, msid-semantic) and the per-media
attributes (setup, mid, group:BUNDLE, trickle) that compact dropped, then
re-expand the token-dictionary substitutions.

`compact` and `decompact` (the `RTCSessionDescriptionInit`-level functions)
add a **type-prefix** stage: `compact` prepends a single character encoding the
`RTCSdpType` (`O`=offer, `A`=answer, `P`=pranswer, `R`=rollback); `decompact`
strips and decodes it. That prefix is what lets the round-trip recover the
original `type` even though the SDP body itself never carries it.

## Offer/answer asymmetry

Compaction drops information that a _well-behaved_ peer can regenerate, but
several of those fields differ between offer and answer. `decompact` takes an
`isOffer` flag and reconstructs them accordingly:

- **DTLS setup** — compact drops `a=setup:`; decompact writes
  `actpass` for an offer and `active` for an answer.
- **Media IDs / BUNDLE** — compact drops `a=mid:` and `a=group:BUNDLE`;
  decompact reassigns sequential `mid:0,1,…` and re-derives the
  `a=group:BUNDLE` line from the count of media lines.

Callers that use the raw `*SDP*` functions must pass the same `isOffer` value
that the peer side will treat the payload as; the `RTCSessionDescriptionInit`
versions avoid this by carrying the type in the prefix.

## Round-trip invariants

The contract the test suite enforces is **round-trip fidelity**, not byte
identity:

- A compact→decompact cycle must reproduce the _same logical SDP_. Tests
  normalize both sides with `sdpTransform.write(sdpTransform.parse(…))` before
  comparing, because line ordering and field spacing are not part of the
  semantic contract.
- `decompact` finishes by running its rebuilt SDP through
  `sdpTransform.parse`/`write` (`src/decompact.ts`), so the output is always a
  canonical, re-serialized SDP.
- The token-dictionary substitutions (see Token Dictionary & Substitution)
  are designed so that short codes never collide with longer tokens, keeping
  every substitution reversible.

## Build, test, and tooling

- **Build / typecheck**: `npm run build` → `tsc` (config `tsconfig.json`),
  emitting `dist/` with declarations. Only `src/*.ts` is included; tests and
  the `page/` demo app are excluded.
- **Tests**: `npm test` → Jest (`jest.config.cts`, `ts-jest` preset, node
  environment). The suite lives in `__test__/` (`test.ts` for the end-to-end
  and validation tests, `encoding.test.ts` for the base64/base92 primitives).
- **Precommit gate**: `.zerofactory/precommit.sh` runs format (Prettier),
  build, and test in sequence; it auto-runs `npm install` when `node_modules`
  is absent (fresh worktrees/clone). The `page/` SvelteKit demo app is a
  separate toolchain excluded via `.prettierignore` and out of the library
  build/test cycle.
- **Demo app**: `page/` is a standalone SvelteKit site (published at
  `ntsd.github.io/sdp-compact`) that demos the API; it is not shipped as part
  of the npm package (`.npmignore` excludes it).
