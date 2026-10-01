---
type: "Reference"
title: "Token dictionary"
openwiki_generated: true
verified:
  - by: openwiki/0.6.0
    at: 2026-10-01T20:15:14.022Z
sources:
  - id: openwiki-source-cbc4444388af9dc7474b60ef
    resource: repo://src/dict.ts
generated: { by: "hermes", at: "2026-10-01T20:15:14.022Z" }
---

## Responsibilities

`src/dict.ts` is the **token-dictionary substitution layer** of sdp-compact. It
owns every string-level shrink/restore that does not involve the encoding stack.
It is pure data plus a few small functions: most of it is reverse-map pairs
(encode map → `reverseMap` → decode map), and a handful of token-position
encoders for the lines where a naive find/replace would corrupt values.

The module exposes:

- `FieldReplaceMap` / `FieldReplaceMapReverse`
- `AttributeReplaceMap` / `AttributeReplaceMapReverse`
- `HashFuncMap` / `HashFuncMapReverse`
- `MediaConnectionAddressTypeMap(Reverse)` / `MediaConnectionIPMap(Reverse)`
- `ExtmapURIMap` / `ExtmapURIMapReverse`
- `RtcpFbMap` / `RtcpFbMapReverse`
- `candidateEncode`/`candidateDecode`, `mediaEncode`/`mediaDecode`,
  `rtcpFbEncode`/`rtcpFbDecode`

All `*Reverse` maps are derived with `reverseMap`, which swaps keys and values,
so the encode and decode tables can never drift apart.

## Field and attribute reverse-maps

- **`FieldReplaceMap`** shrinks the two-character field prefixes to one
  character: `v=→V`, `o=→O`, `s=→S`, `c=→C`, `a=→A`, `m=→M`, `t=→T`.
- **`AttributeReplaceMap`** shrinks `a=` attribute names to one letter:
  `rtcp:→R`, `ice-ufrag:→U`, `ice-pwd:→P`, `ice-options:→O`,
  `fingerprint:→F`, `candidate:→C`, `sctp-port:→S`, `max-message-size:→M`,
  `extmap:→E`, `rtpmap:→T`, `rtcp-fb:→B`, `fmtp:→Z`.

These are the maps the `replaceFieldNames` pass in `src/compact.ts`/
`src/decompact.ts` consults. They are exact-key lookups, not regexes, so they
only ever match a complete field/attribute prefix.

## Position-based candidate and media substitution

Candidate and media lines are **not** safe for a global find/replace, so
`candidateEncode`/`mediaEncode` (and their decoders) only substitute exact
tokens at known array indices.

- **`m=`** — only the media-type token (index 0) and protocol token (index 2)
  are substituted: `audio→A`, `video→V`, `application→P`,
  `UDP/TLS/RTP/SAVPF→T`, `UDP/DTLS/SCTP→U`. Everything after the protocol
  (payload types / formats) is never touched, so codec names and data-channel
  formats survive intact.
- **`a=candidate:`** — only exact tokens at fixed positions: protocol
  (`udp↔U`), IP (`0.0.0.0↔Z`), `raddr 0.0.0.0 ↔ A Z`, `typ srflx ↔ S`,
  `typ host generation 0 network-cost 999 ↔ H`,
  `rport 0 generation 0 network-cost 999 ↔ R`.

The critical invariant: **the single-character codes never match inside a
longer token.** Because substitution is position- and whole-token-based rather
than substring-based, a hostname or attribute value that merely contains a code
letter (e.g. `S.example.com`) is left untouched and survives the round-trip.

## Fingerprint, connection, extmap, and rtcp-fb maps

- **`HashFuncMap`** (RFC 8122 §5) maps fingerprint hash functions to digits:
  `sha-1→1`, `sha-224→2`, `sha-256→3`, `sha-384→4`, `sha-512→5`, `md5→6`,
  `md2→7`, `token→8`.
- **`MediaConnectionAddressTypeMap`** maps `IP4→4`, `IP6→6`;
  **`MediaConnectionIPMap`** maps `0.0.0.0→0`.
- **`ExtmapURIMap`** maps 16 common WebRTC extension URNs to short letters
  `A`–`P` (e.g. `ssrc-audio-level→A`, `abs-send-time→B`,
  `transport-wide-cc→C`, `sdes:mid→D`, `toffset→E`, …).
- **`RtcpFbMap`** maps common RTCP feedback types: `nack pli→P`,
  `goog-remb→G`, `transport-cc→T`, `ccm fir→C`, `nack→N`.

## Longest-first matching for rtcp-fb

`rtcpFbEncode`/`rtcpFbDecode` use `makeRegexSubstitution(map, { longestFirst:
true })`, which sorts keys by length (longest first) and builds one regex with
alternation. This ordering matters: `nack pli` must be tried before `nack`, or
the shorter key would consume the prefix and leave `pli` behind. Longest-first
keeps multi-word feedback types intact on both the encode and decode paths.

## Why this guarantees round-trip fidelity

Two design choices keep every substitution reversible:

1. **Reverse maps are derived, not hand-written** (`reverseMap`), so encode and
   decode are always exact inverses.
2. **Positional / whole-token matching** for the risky lines means short codes
   can never be mistaken for (or corrupt) the longer tokens they coexist with.

Together with the canonical `sdpTransform.parse`/`write` normalization applied
at the end of decompact, this is what lets the test suite treat
"same logical SDP" (parsed equality) as the round-trip contract.
