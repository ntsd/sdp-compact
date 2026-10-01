---
type: "Reference"
title: "Sdp transform"
description: "The line-level SDP transformation that is the heart of sdp-compact: which lines compact drops and decompact restores, the dictionary rewrites for o=/m=/candidate/fingerprint/c=/extmap/rtcp-fb, the field-name substitution pass, offer/answer asymmetry, and the sdp-transform parse/write normalization that makes round-trip fidelity a logical (not byte) contract."
tags:
  [
    sdp-transform,
    line-transform,
    field-substitution,
    normalization,
    isOffer,
    round-trip,
  ]
verified:
  - by: openwiki/0.6.0
    at: 2026-10-01T21:00:49.610Z
sources:
  - id: openwiki-source-f29b153e49a0c9bf22b53533
    resource: repo://src/compact.ts
  - id: openwiki-source-c2ac723625317a537aa3263f
    resource: repo://src/decompact.ts
  - id: openwiki-source-cbc4444388af9dc7474b60ef
    resource: repo://src/dict.ts
generated: { by: "hermes", at: "2026-10-01T20:15:14.022Z" }
---

## How the transform works

`compactSDPStr` (`src/compact.ts`) and `decompactSDPStr` (`src/decompact.ts`)
are the heart of the library. Compact works line by line: it splits the SDP on
`\r\n`, trims each line, and for each line **decides exactly one of four
actions** — drop it, rewrite it, keep it verbatim, or (for the media/candidate/
fingerprint/connection/extmap/rtcp-fb lines) run a dictionary substitution.
The surviving lines are joined with `~`. Decompact is the inverse and also
re-inserts the fixed lines that compact dropped.

The decision is driven by the `Options`: a **defined** option means "this field
is fixed, so drop it (compact) / restore it (decompact)"; an **undefined**
option means "leave the SDP's own value in place."

## Lines dropped by compact (and restored by decompact)

| SDP line                | Dropped when                   | Restored by decompact                                    |
| ----------------------- | ------------------------------ | -------------------------------------------------------- |
| `v=<version>`           | `options.sdpVersion` defined   | `v=${sdpVersion}`                                        |
| `s=<name>`              | `options.sessionName` defined  | `s=${sessionName}`                                       |
| `t=<timing>`            | `options.timing` defined       | `t=${timing}`                                            |
| `a=extmap-allow-mixed`  | `options.extmapAllowMixed`     | `a=extmap-allow-mixed`                                   |
| `a=msid-semantic: WMS`  | `options.msidSemantic` defined | `a=msid-semantic: ${msidSemantic}`                       |
| `a=group:BUNDLE …`      | `mediaOptions.removeMediaID`   | re-derived `a=group:BUNDLE 0 1 …` (count of media lines) |
| `a=mid:<n>`             | `mediaOptions.removeMediaID`   | sequential `a=mid:0,1,2,…`                               |
| `a=setup:<role>`        | `mediaOptions.removeSetup`     | `a=setup:actpass` (offer) / `a=setup:active` (answer)    |
| `a=ice-options:trickle` | `mediaOptions.forceTrickle`    | `a=ice-options:trickle`                                  |

The session-scoped lines (v/s/t, extmap-allow-mixed, msid-semantic) are pushed
to the decompact output **before** the per-line loop runs, and the
`a=group:BUNDLE` line is **unshifted** to the front after the loop. Their
intermediate position is not semantically meaningful — the final
`sdpTransform.parse`/`write` normalization reorders everything canonically
(see below).

## Lines rewritten by the dictionary layer

These lines are kept (not dropped) but their tokens are shrunk via `src/dict.ts`
substitutions; see Token Dictionary & Substitution for the exact code maps:

- **`o=`** — the origin line. Compact keeps only the fields whose `origin.*`
  option is `undefined` (plus always the session version, index 2); decompact
  re-pins the defined fields and shifts the undefined ones from the compacted
  value. So the `o=` line survives but with a variable number of fields.
- **`m=`** — media-type and protocol tokens (`audio→A`, `video→V`,
  `application→P`, `UDP/TLS/RTP/SAVPF→T`, `UDP/DTLS/SCTP→U`) when
  `replaceMediaString`. Payload types/formats after the protocol are never
  touched.
- **`a=candidate:`** — position-based token codes (`udp→U`, `0.0.0.0→Z`,
  `typ srflx→S`, `typ host …→H`, `rport 0 …→R`, `raddr 0.0.0.0→A Z`) when
  `replaceCandidateString`.
- **`a=fingerprint:`** — hash function mapped via `HashFuncMap`
  (`sha-256→3`, …) and the hex fingerprint bit-packed via
  `FingerprintToBase64.encode` when `compressFingerprint`.
- **`c=`** — address type mapped (`IP4→4`, `IP6→6`) and `0.0.0.0→0` when
  `compressConnection`. Compact discards the network-type token and decompact
  re-assumes it as `IN` (`c=IN ${addressType} ${ip}`).
- **`a=extmap:`** — the URI mapped via `ExtmapURIMap` (common WebRTC URNs →
  short letters) when `compressExtmap`.
- **`a=rtcp-fb:`** — common feedback types mapped via `RtcpFbMap`
  (`nack pli→P`, `goog-remb→G`, `transport-cc→T`, `ccm fir→C`, `nack→N`) when
  `compressRtcpFb`.

## Field-name substitution pass

After per-line processing, if `options.replaceFieldNames` is set, compact maps
the two-character field prefixes (`v= o= s= c= a= m= t=`) to single characters
(`V O S C A M T`) via `FieldReplaceMap`, and maps `a=` attribute names to
single letters via `AttributeReplaceMap` (e.g. `rtcp:→R`, `ice-ufrag:→U`,
`fingerprint:→F`, `extmap:→E`, `rtcp-fb:→B`, `fmtp:→Z`). Decompatch reverses
both maps. This is what turns the `~`-joined intermediate into the dense
final form.

## Offer/answer asymmetry

Two restored fields depend on the `isOffer` flag:

- **DTLS setup** — compact drops `a=setup:`; decompact writes `actpass` when
  `isOffer` and `active` otherwise.
- **Mid/BUNDLE** — compact drops `a=mid:` and `a=group:BUNDLE`; decompact
  reassigns sequential mids and rebuilds the BUNDLE line from the media count.

Both are unambiguous for a correct WebRTC peer, which is why they are safe to
omit from the wire payload.

## Normalization and failure behavior

`decompactSDPStr` ends with `sdpTransform.write(sdpTransform.parse(sdpStr))`,
so the rebuilt SDP is re-serialized in canonical order regardless of the order
in which lines were re-inserted. This is what makes the round-trip contract
"same logical SDP" (tests normalize both sides the same way) rather than byte
identity.

Decompact also **validates** the compacted lines it reconstructs, throwing on
malformed input rather than emitting a broken SDP:

- `a=fingerprint:` → `"Malformed a=fingerprint line (missing hash method or
fingerprint value): …"`
- `c=` → `"Malformed c= line (missing address type or IP address): …"`
- `a=extmap:` → `"Malformed a=extmap line (missing extmap id or URI): …"`
