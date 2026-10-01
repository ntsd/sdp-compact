---
type: "Reference"
title: "Public api"
description: "The six exported sdp-compact functions with their signatures, the RTCSdpType single-character prefix convention (offer/answer/pranswer/rollback), the Options/OriginOptions/MediaOptions model with its pin-vs-preserve semantics, DefaultOptions, and mergeOptions normalization."
tags: [public-api, compact, decompact, options, defaults, isOffer, rtcsdptype]
verified:
  - by: openwiki/0.6.0
    at: 2026-10-01T21:00:49.610Z
sources:
  - id: openwiki-source-f29b153e49a0c9bf22b53533
    resource: repo://src/compact.ts
  - id: openwiki-source-c2ac723625317a537aa3263f
    resource: repo://src/decompact.ts
  - id: openwiki-source-d1fbef09192ffbab6eff0bc2
    resource: repo://src/index.ts
  - id: openwiki-source-dc906771f5d059f4b0fb2926
    resource: repo://src/options.ts
generated: { by: "hermes", at: "2026-10-01T20:15:14.022Z" }
---

## The six public functions

`sdp-compact` exports exactly six functions (re-exported from `src/index.ts`).
They come in two flavors: `RTCSessionDescriptionInit`-level (which also carry
the SDP **type**) and raw-SDP-string-level (which take an explicit `isOffer`).

| Function            | Signature                                                                         | Returns                                   |
| ------------------- | --------------------------------------------------------------------------------- | ----------------------------------------- |
| `compact`           | `(rtcSessionDesc: RTCSessionDescriptionInit, options?: Options) => string`        | type-prefixed compacted string            |
| `decompact`         | `(compacted: string, options?: Options) => RTCSessionDescriptionInit`             | the reconstructed description             |
| `compactSDP`        | `(sdpStr: string, newOptions?: Options) => string`                                | compacted string (encoded if compress on) |
| `decompactSDP`      | `(compactSDPStr: string, isOffer: boolean, newOptions?: Options) => string`       | decompacted SDP string                    |
| `compactSDPBytes`   | `(sdpStr: string, newOptions?: Options) => Uint8Array`                            | compacted bytes                           |
| `decompactSDPBytes` | `(compactSDPBytes: Uint8Array, isOffer: boolean, newOptions?: Options) => string` | decompacted SDP string                    |

`compact`/`decompact` are the highest-level and are what most callers use:
`compact` needs no `isOffer` because the type travels in the prefix; the
`*SDP*` raw variants require the caller to pass `isOffer` because a bare SDP
string does not carry its type.

## The RTCSdpType prefix convention

`compact` maps the input `RTCSdpType` to a single leading character via
`SDPTypePrefixMap`: `offer→"O"`, `answer→"A"`, `pranswer→"P"`,
`rollback→"R"`. `decompact` reverses it via `SDPTypePrefixMapReverse`.

This means:

- All four `RTCSdpType` values round-trip — `decompact(compact({type:
"pranswer", sdp})).type` is `"pranswer"`.
- **Validation, not silent default:** `compact` throws `"SDP not found"` when
  `sdp` is missing and `"Unsupported SDP type: …"` when `type` is not one of
  the four. `decompact` throws `"Invalid compacted SDP string: …"` for a
  non-string or a string shorter than 2 chars, and `"Invalid compacted SDP type
prefix: …"` for an unknown first character. There is no silent fallback to
  `answer`.

## The Options model

Options are three nested interfaces in `src/options.ts`:

- **`Options`** (top level): `compress` (`boolean | "base64" | "base92"`),
  `replaceFieldNames`, `sdpVersion`, `sessionName`, `origin`
  (`OriginOptions`), `timing`, `extmapAllowMixed`, `msidSemantic`, `mediaOptions`
  (`MediaOptions`). Every field is optional.
- **`OriginOptions`**: `username`, `sessionId`, `netType`, `addrtype`,
  `unicastAddress` — the fixed fields of the `o=` line. A defined value
  overrides the SDP's; an `undefined` value keeps the SDP's original field.
- **`MediaOptions`**: `removeMediaID`, `removeSetup`, `replaceCandidateString`,
  `replaceMediaString`, `forceTrickle`, `compressFingerprint`,
  `compressConnection`, `compressExtmap`, `compressRtcpFb` — the per-media-line
  behaviors.

The key semantic: a **defined** option value means "pin this to a fixed value
(and drop the SDP's), re-insert it on decompact"; an **undefined** option
value means "preserve whatever the SDP already has." This is what makes
round-tripping lossless for both the default and customized configurations.

## DefaultOptions

`DefaultOptions` is a `Required<Options>` with every knob on and the conventional
fixed values: `compress: "base64"`, `replaceFieldNames: true`, `sdpVersion: 0`,
`sessionName: "-"`, a standard `origin` (`4109260023080860376`, `IN`, `IP4`,
`127.0.0.1`), `timing: "0 0"`, `extmapAllowMixed: true`, `msidSemantic: "WMS"`,
and all nine `mediaOptions` flags `true`.

## mergeOptions

`mergeOptions(overwriteOptions)` returns a `MergedOptions` (a `Required<Options>`
with `compress: false | "base64" | "base92"`):

- Deep-merges top-level, `origin`, and `mediaOptions` over `DefaultOptions`, so
  unspecified fields keep their defaults.
- **Backward-compatibility normalization:** if the caller passed
  `compress: true`, it is rewritten to `compress: "base64"` before merging.
  After `mergeOptions`, `compress` is only ever `false`, `"base64"`, or
  `"base92"` — the codebase branches on the two string modes, never on a bare
  `true`.

## Conventions

- Callers typically use the `RTCSessionDescriptionInit` variants for the
  normal offer/answer exchange and the raw `*SDP*` variants when they need to
  compact only the SDP string (e.g. to choose base92, or to hand off just the
  string).
- The decompact side of the raw variants needs the **same** `Options` and the
  correct `isOffer` the peer will treat the payload as (see Architecture →
  Offer/answer asymmetry).
