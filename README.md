# SDP Compact

shorten WebRTC Session Description Protocol (SDP) based on Unified Plan SDP

## Why?

a WebRTC SDP can removing some of attributes can compress/compact and share config on both offer and answer sides.

## Features

- shorten WebRTC SDP
- options to fixed parameters for both offer and answer side

## Installation

`npm install sdp-compact`

## Examples

```TypeScript
import * as spdCompact from "sdp-compact";

const sessDesc: RTCSessionDescriptionInit = {
  type: "offer",
  sdp: `v=0\r\no=- 4109260023080860376 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=extmap-allow-mixed\r\na=msid-semantic: WMS\r\n`,
};

// compact the `RTCSessionDescriptionInit`
const compactedSessDesc = spdCompact.compact(sessDesc);
const decompactedSessDesc = spdCompact.decompact(compactedSPD);

// compact only the SDP string
const compactedSPD = spdCompact.compactSDP(sessDesc.sdp);
// for decompact need to specify if it's offer or answer because it's not include in SDP
const decompactedSPD = spdCompact.decompactSDP(compactedSPD, true);
```

## WebRTC SDP Anatomy

### Version (v=)

`v=0`

SDP version always set to 0 for now, not used.

### Origin (o=)

`o=- 4611731400430051336 2 IN IP4 127.0.0.1`
`o=<username> <sessID> <sessVersion> <netType> <addrType> <unicastAddress>`

The username can be "-".

The sessID MUST be ignored on a receive.

The sessVersion MUST be a numeric value but the value MUST be ignored on a receive.

The netType MUST be "IN" for Internet.

The addrtype MUST be either "IP4" or "IP6".

the unicastAddress MUST be in "IP4" or "IP6" formatted following addrtype.

### Session name (s=)

`s=-`

session name is not commonly used, not used.

### Timing (t=)

`t=0 0`

Timing field, indicates the session is unbounded (start and stop times are both set to 0).

### Attribute (a=)

#### BUNDLE attribute (a=group:BUNDLE)

`a=group:BUNDLE 0`

This attribute specifies that media lines are bundled together using a single transport (in this case, media line with the identifier '0').

`a=group:BUNDLE m1 m2`

This attribute specifies that media lines have 2 media line (identifiers as m1 and m2).

#### allows mixing attribute (a=extmap-allow-mixed)

`a=extmap-allow-mixed`

This attribute allows the use of both one-byte and two-byte RTP header extensions in the same RTP session.

#### the semantic for multiple media streams (a=msid-semantic:)

`a=msid-semantic: WMS`

This attribute specifies the semantic for multiple media streams (msid). WMS stands for WebRTC Media Stream.

### Media (m=)

`m=application 50782 UDP/DTLS/SCTP webrtc-datachannel`

Media (m) line describes the media type (application), port (50782), transport protocol (UDP/DTLS/SCTP), and media format (webrtc-datachannel).

#### Media Connection information (c=)

`c=IN IP4 115.87.239.220`

Connection (c) line specifies the network type (IN for Internet), address type (IP4), and the connection address (115.87.239.220).

#### Media Attribute (a=)

ice candidates, ice username, ice password, ice options, fingerprint, DTLS role can be equals and reuse on every medias.

For example, if you have more multiple medias the difference is midia id and specific media attributes such as `a=sctp-port:` and `a=max-message-size:` that only have for application media type.

##### ICE Candidate (a=candidate:)

`a=candidate:...`

These attribute lines represent ICE (Interactive Connectivity Establishment) candidates, which provide information about possible network paths for establishing a connection between peers.

##### ICE Username (a=ice-ufrag:)

`a=ice-ufrag:J8xg`

This attribute specifies the ICE username fragment for this session.

##### ICE Password (a=ice-pwd:)

`a=ice-pwd:brYDyKCXku2B1XTvqd2aJgg5`

This attribute specifies the ICE password for this session.

##### ICE Option (a=ice-options:)

`a=ice-options:trickle`

This attribute specifies the ICE options for this session.

##### DTLS Fingerprint (a=fingerprint:)

`a=fingerprint:sha-256 ...`

This line contains the fingerprint of the DTLS (Datagram Transport Layer Security) certificate. It is used to authenticate the DTLS connection, ensuring the integrity and security of the data channel.

##### DTLS role (a=setup:)

for offer will be

`a=setup:actpass`

for answer will be

`a=setup:active`

##### Media identification (a=mid:)

`a=mid:0`

The media identification that specific in `a=group:BUNDLE `

##### SCTPPort (a=sctp-port:)

`a=sctp-port:5000`

For the Data Channel, This line indicates the SCTP (Stream Control Transmission Protocol) port used for the data channel. SCTP is the transport protocol used by WebRTC data channels.

##### Maximum message size (a=max-message-size:)

`a=max-message-size:262144`

For the Data Channel, The maximum message size in bytes that the endpoint can receive on the data channel.

<!-- # Create WebRTC Offer/Answer

```js
const connection = new RTCPeerConnection({
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
});
connection.createOffer({
	offerToReceiveAudio: true,
	offerToReceiveVideo: true,
}).then((offer) => {
	console.log(offer);

	connection.setRemoteDescription(offer).then(() => {
		connection.createAnswer().then((answer) => {
			console.log(answer);
		});
	});
});
``` -->

## References

<https://webrtchacks.github.io/sdp-anatomy/>

<https://datatracker.ietf.org/doc/html/draft-roach-mmusic-unified-plan-00>

<https://datatracker.ietf.org/doc/html/draft-ietf-rtcweb-jsep-24>

<https://datatracker.ietf.org/doc/html/rfc3264>

<https://chromestatus.com/feature/5723303167655936>
