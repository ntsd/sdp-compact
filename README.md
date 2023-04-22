# SDP Compact

[![npm version](https://badge.fury.io/js/sdp-compact.svg)](https://www.npmjs.com/package/sdp-compact)

Shorten WebRTC Session Description Protocol (SDP) based on Unified Plan SDP

## Why?

a WebRTC SDP can removing some of attributes can compress/compact and share config on both offer and answer sides.

## Features

- Shorten WebRTC SDP.
- Options to fixed parameters for both offer and answer side.
- Compress with zlib deflate then base64.

## Installation

`npm install sdp-compact`

## Examples

```TypeScript
import * as spdCompact from "sdp-compact";

const sessDesc: RTCSessionDescriptionInit = {
  type: "offer",
  sdp: `v=0\r\no=- 4109260023080860376 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=extmap-allow-mixed\r\na=msid-semantic: WMS\r\n`,
};


const options: spdCompact.Options = {};

// compact the `RTCSessionDescriptionInit`
const compactedSessDesc = spdCompact.compact(sessDesc, options);
const decompactedSessDesc = spdCompact.decompact(compactedSPD, options);

// compact only the SDP string
const compactedSPD = spdCompact.compactSDP(sessDesc.sdp, options);
// for decompact need to specify if it's offer or answer because it's not include in SDP
const decompactedSPD = spdCompact.decompactSDP(compactedSPD, true, options);
```

## Options

You can override the default options to suit your application's requirements, while still keeping the default values for any unspecified properties.

### Default Options

```Typescript
const DefaultOptions: Options = {
  compress: true,
  replaceFieldNames: true,
  sdpVersion: 0,
  sessionName: "-",
  origin: {
    username: "-",
    sessionId: "4109260023080860376",
    netType: "IN",
    addrtype: "IP4",
    unicastAddress: "127.0.0.1",
  },
  timing: "0 0",
  extmapAllowMixed: true,
  msidSemantic: "WMS",
  mediaOptions: {
    removeMediaID: true,
    removeSetup: true,
    replaceCandidateString: true,
    replaceMediaString: true,
    forceTrickle: true,
    compressFingerprint: true,
  },
};
```

Here is an explanation of each option and its default value:

### compress (default: true)

Enables compression using zlib deflate, followed by base64 encoding.

### replaceFieldNames (default: true)

Replaces field names using FieldReplaceMap and FieldReplaceMapReverse.

### sdpVersion (default: 0)

The fixed SDP version (v=), which is usually 0 for now.

### sessionName (default: "-")

The fixed session name (s=), which is usually "-".

### origin (default: see below)

Fixed origin options (o=). This includes the following properties:

- `username`: Fixed username, can be "-" for an undefined user. (default: "-")
- `sessionId`: Fixed session ID, can be the same value on all peers. (default: "4109260023080860376")
- `netType`: Fixed network type, must be "IN" for the internet. (default: "IN")
- `addrtype`: Fixed address type, must be either "IP4" or "IP6". Usually, it will be "IP4". (default: "IP4")
- `unicastAddress`: Fixed unicast address, usually "127.0.0.1". (default: "127.0.0.1")

### timing (default: "0 0")

The fixed timing (t=). It can be "0 0" for unbounded.

### extmapAllowMixed (default: true)

Allows mixing attributes (a=extmap-allow-mixed), usually allowed by default.

### msidSemantic (default: "WMS")

The fixed msid semantic (a=msid-semantic:). It should be "WMS" for WebRTC Media Stream.

### mediaOptions (default: see below)

Customize media options. This includes the following properties:

- `removeMediaID`: Remove media ID (a=mid:) and group (a=group:<type>) (a=group:BUNDLE) to use sequence medias instead. (default: true)
- `removeSetup`: Remove DTLS role (a=setup:). It will set to actpass for offer and active for answer. (default: true)
- `replaceCandidateString`: replaced string in ice candidate (a=candidate:) following `CandidateReplaceList`. (default: true)
- `replaceMediaString`: replace string in media (m=) following `MediaReplaceList`. (default: true)
- `forceTrickle`: force ice-options to trickle (a=ice-options:trickle). (default: true)
- `compressFingerprint`: compress fingerprint (a=fingerprint:). (default: true)

## WebRTC SDP Anatomy

You can read the WebRTC SDP Anatomy [Here](./sdp.md) for how it's works.
