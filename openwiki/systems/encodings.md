---
type: "Reference"
title: "Encodings"
description: "The outer encoding layer of the sdp-compact pipeline: zlib deflate via fflate, environment-aware base64 with chunked encoding, the base92 codec and its invalid-character guard, and FingerprintToBase64 hex/bit-packing, with the fail-fast failure model for each primitive."
tags: [encodings, base64, base92, zlib, fflate, fingerprint, failure-model]
verified:
  - by: openwiki/0.6.0
    at: 2026-10-01T21:00:49.610Z
sources:
  - id: openwiki-source-673e322ac47e5c97c4f0898b
    resource: repo://src/base64.ts
  - id: openwiki-source-c856735c7cc3d41643f9ab65
    resource: repo://src/base92.ts
  - id: openwiki-source-957fa5e3e38745d1f0aa2cf6
    resource: repo://src/compress.ts
generated: { by: "hermes", at: "2026-10-01T20:15:14.022Z" }
---

## Responsibilities

The encoding stack sits at the outer edge of the compaction pipeline and turns
the already-transformed SDP string into its final compact form. Three modules
own it:

- **`src/compress.ts`** — dispatches between compression modes and codecs.
- **`src/base64.ts`** — base64 string/array helpers and `FingerprintToBase64`.
- **`src/base92.ts`** — the base92 alphabet encoder/decoder.

## Compression (zlib deflate via fflate)

`src/compress.ts` wraps `fflate`'s `deflateSync`/`inflateSync` at maximum
compression:

- `compressToBytes(text)` returns `deflateSync(strToU8(text), { level: 9 })`
  — the raw compressed `Uint8Array`.
- `decompressBytes(bytes)` inflates the same and returns a string.
- `compressText(text, encoding)` and `decompressText(compressedText, encoding)`
  are the string-facing variants: they deflate/inflate and then encode/decode
  through the matching codec in the `encoder`/`decoder` lookup tables
  (`base64` → `uint8ArrayToBase64`/`base64ToUint8Array`, `base92` →
  `uint8ArrayToBase92`/`base92ToUint8Array`).

**Error behavior:** the text/bytes decompress wrappers catch any `inflateSync`
failure and rethrow it as a descriptive
`"Failed to decompress compacted SDP payload (encoding: …)"` /
`"… SDP bytes payload"` error rather than leaking the raw fflate exception.

## base64

`src/base64.ts` provides environment-aware base64:

- `base64encode`/`base64decode` use the browser `btoa`/`atob` when available,
  falling back to `Buffer` in Node.
- `uint8ArrayToBase64` builds the binary string in **bounded 0x8000 (32k)
  chunks** before encoding. Spreading the whole array into
  `String.fromCharCode` would throw a `RangeError` once the byte count exceeds
  the engine's call-argument limit (~126k on Node v26); chunking sidesteps
  that for arbitrarily large payloads.
- `base64ToUint8Array` decodes a base64 string back into a `Uint8Array`.

## base92

`src/base92.ts` is a stripped-down `base-x` codec (base 92) that produces a
smaller encoded form than base64. It defines a 92-character `ALPHABET` and a
256-entry `BASE_MAP` whose out-of-alphabet slots hold the `INVALID` (255)
sentinel.

- `uint8ArrayToBase92(source)` performs big-endian base-256 → base-92 division,
  preserves leading zero bytes via the `LEADER` character, and throws
  `"Non-zero carry"` if the division is inconsistent.
- `base92ToUint8Array(source)` performs the inverse. It **rejects any character
  not present in the alphabet** (`carry === undefined || carry === INVALID`)
  with `"Invalid base92 character"`. The guard exists because an out-of-bounds
  `charCode` (e.g. a mangled URL-encoding artifact) reads as `undefined` rather
  than the sentinel, and an unmapped ASCII char would otherwise flow through as
  digit 255 and silently corrupt the output.

## FingerprintToBase64 (hex ↔ base64 bit-packing)

`FingerprintToBase64` in `src/base64.ts` converts an RFC 8122 fingerprint
(colon-separated uppercase hex) to a compact base64 form by re-packing the
bytes at the bit level, and back. It is used on `a=fingerprint:` lines.

- **`encode(hexString)`** splits on `:` and requires every token to match
  `/^[0-9A-Fa-f]{1,2}$/` (one hex byte). Malformed tokens are rejected with an
  indexed error rather than being coerced by `parseInt` (which would turn
  `NaN` into 0 or truncate out-of-range values and silently corrupt the
  fingerprint). It then bit-packs the bytes into base64, padding with `=` to a
  multiple of 4. An empty/missing input throws.
- **`decode(base64String)`** walks the base64 string, treats `=` as valid only
  as the final one-or-two padding characters (a mid-string `=` or a third `=`
  is malformed and throws), rejects any character outside the base64 charset
  (an unknown char would otherwise be OR'd into the bit buffer as `-1`), and
  emits colon-separated uppercase hex. An empty/missing input throws.

## Failure-model summary

| Primitive                            | Throws when                                                                  |
| ------------------------------------ | ---------------------------------------------------------------------------- |
| `decompressText` / `decompressBytes` | inflate fails (rethrown with a descriptive message)                          |
| `uint8ArrayToBase92`                 | division yields a non-zero carry                                             |
| `base92ToUint8Array`                 | a character is not in the 92-char alphabet                                   |
| `FingerprintToBase64.encode`         | input empty, or a hex token is not 1–2 hex digits                            |
| `FingerprintToBase64.decode`         | input empty, invalid padding placement, or a char outside the base64 charset |

The design is intentionally fail-fast at the boundary: corrupt or malformed
input throws with a specific message instead of producing a silently-wrong
payload.
