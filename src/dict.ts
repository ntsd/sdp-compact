// Helpers
function reverseMap(m: { [key: string]: string }): { [key: string]: string } {
  return Object.fromEntries(
    Object.entries(m).map(([k, v]) => [v, k] as const)
  );
}
function makeRegexSubstitution(
  map: { [key: string]: string },
  options: { longestFirst?: boolean } = {}
): (line: string) => string {
  const keys = options.longestFirst
    ? Object.keys(map).sort((a, b) => b.length - a.length)
    : Object.keys(map);
  const regex = new RegExp(keys.join("|"), "g");
  return (line: string) => line.replace(regex, (match) => map[match]);
}

// replace sdp fields key
export const FieldReplaceMap: { [key: string]: string } = {
  "v=": "V",
  "o=": "O",
  "s=": "S",
  "c=": "C",
  "a=": "A",
  "m=": "M",
  "t=": "T",
};
export const FieldReplaceMapReverse: { [key: string]: string } =
  reverseMap(FieldReplaceMap);

// replace media attributes
export const AttributeReplaceMap: { [key: string]: string } = {
  "rtcp:": "R",
  "ice-ufrag:": "U",
  "ice-pwd:": "P",
  "ice-options:": "O",
  "fingerprint:": "F",
  // data channel
  "candidate:": "C",
  "sctp-port:": "S",
  "max-message-size:": "M",
  // audio/video channels
  "extmap:": "E",
  "rtpmap:": "T",
  "rtcp-fb:": "B",
  "fmtp:": "Z",
};
export const AttributeReplaceMapReverse: { [key: string]: string } =
  reverseMap(AttributeReplaceMap);

// Replace fingerprint hash function, RFC 8122 section-5
export const HashFuncMap: { [key: string]: string } = {
  "sha-1": "1",
  "sha-224": "2",
  "sha-256": "3",
  "sha-384": "4",
  "sha-512": "5",
  md5: "6",
  md2: "7",
  token: "8",
};
export const HashFuncMapReverse: { [key: string]: string } =
  reverseMap(HashFuncMap);

// Candidate encode/decode.
//
// `a=candidate:<foundation> <component> <protocol> <priority> <ip> <port> [attributes]`
//
// Only exact tokens at known positions are substituted:
//   protocol token (index 2):   `udp` <-> `U`
//   ip token (index 4):         `0.0.0.0` <-> `Z`
//   `raddr <ip>`:               the attribute <-> `A`, ip `0.0.0.0` <-> `Z`
//   `typ srflx`:                <-> `S`
//   `typ host generation 0 network-cost 999`:   <-> `H`
//   `rport 0 generation 0 network-cost 999`:    <-> `R`
//
// The single-character codes are never matched inside a longer token, so
// hostnames or other attribute values that contain them (e.g.
// `S.example.com`) survive the round-trip untouched.
const CANDIDATE_PREFIX = "a=candidate:";

function candidateEncodeTokens(tokens: string[]): string[] {
  // [foundation, component, protocol, priority, ip, port, ...attributes]
  if (tokens[2] === "udp") {
    tokens[2] = "U";
  }
  if (tokens[4] === "0.0.0.0") {
    tokens[4] = "Z";
  }
  for (let i = 6; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === "raddr" && tokens[i + 1] === "0.0.0.0") {
      tokens[i] = "A";
      tokens[i + 1] = "Z";
    } else if (
      t === "typ" &&
      tokens[i + 1] === "host" &&
      tokens[i + 2] === "generation" &&
      tokens[i + 3] === "0" &&
      tokens[i + 4] === "network-cost" &&
      tokens[i + 5] === "999"
    ) {
      tokens.splice(i, 6, "H");
    } else if (t === "typ" && tokens[i + 1] === "srflx") {
      tokens.splice(i, 2, "S");
    } else if (
      t === "rport" &&
      tokens[i + 1] === "0" &&
      tokens[i + 2] === "generation" &&
      tokens[i + 3] === "0" &&
      tokens[i + 4] === "network-cost" &&
      tokens[i + 5] === "999"
    ) {
      tokens.splice(i, 6, "R");
    }
  }
  return tokens;
}

function candidateDecodeTokens(tokens: string[]): string[] {
  if (tokens[2] === "U") {
    tokens[2] = "udp";
  }
  if (tokens[4] === "Z") {
    tokens[4] = "0.0.0.0";
  }
  for (let i = 6; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === "A" && tokens[i + 1] === "Z") {
      tokens[i] = "raddr";
      tokens[i + 1] = "0.0.0.0";
    } else if (t === "S") {
      tokens.splice(i, 1, "typ", "srflx");
    } else if (t === "H") {
      tokens.splice(i, 1, "typ", "host", "generation", "0", "network-cost", "999");
    } else if (t === "R") {
      tokens.splice(i, 1, "rport", "0", "generation", "0", "network-cost", "999");
    }
  }
  return tokens;
}

export function candidateEncode(line: string) {
  if (!line.startsWith(CANDIDATE_PREFIX)) {
    return line;
  }
  const value = line.slice(CANDIDATE_PREFIX.length);
  return CANDIDATE_PREFIX + candidateEncodeTokens(value.split(" ")).join(" ");
}

export function candidateDecode(line: string) {
  if (!line.startsWith(CANDIDATE_PREFIX)) {
    return line;
  }
  const value = line.slice(CANDIDATE_PREFIX.length);
  return CANDIDATE_PREFIX + candidateDecodeTokens(value.split(" ")).join(" ");
}

// Media encode/decode.
//
// `m=<media> <port> <protocol> <formats...>`
//
// Only the media-type token (index 0) and the protocol token (index 2) are
// substituted; everything after the protocol (payload types / formats) is
// never touched, so codec names and data-channel formats survive intact.
const mediaEncodeMap: { [key: string]: string } = {
  application: "P",
  "UDP/DTLS/SCTP": "U",
  "UDP/TLS/RTP/SAVPF": "T",
  audio: "A",
  video: "V",
};
const mediaDecodeMap: { [key: string]: string } = reverseMap(mediaEncodeMap);
const MEDIA_PREFIX = "m=";

function mediaEncodeTokens(tokens: string[]): string[] {
  // [media, port, protocol, ...formats]
  if (tokens[0] in mediaEncodeMap) {
    tokens[0] = mediaEncodeMap[tokens[0]];
  }
  if (tokens[2] in mediaEncodeMap) {
    tokens[2] = mediaEncodeMap[tokens[2]];
  }
  return tokens;
}

function mediaDecodeTokens(tokens: string[]): string[] {
  if (tokens[0] in mediaDecodeMap) {
    tokens[0] = mediaDecodeMap[tokens[0]];
  }
  if (tokens[2] in mediaDecodeMap) {
    tokens[2] = mediaDecodeMap[tokens[2]];
  }
  return tokens;
}

export function mediaEncode(line: string) {
  if (!line.startsWith(MEDIA_PREFIX)) {
    return line;
  }
  const value = line.slice(MEDIA_PREFIX.length);
  return MEDIA_PREFIX + mediaEncodeTokens(value.split(" ")).join(" ");
}

export function mediaDecode(line: string) {
  if (!line.startsWith(MEDIA_PREFIX)) {
    return line;
  }
  const value = line.slice(MEDIA_PREFIX.length);
  return MEDIA_PREFIX + mediaDecodeTokens(value.split(" ")).join(" ");
}

// Media Connection
export const MediaConnectionAddressTypeMap: { [key: string]: string } = {
  IP4: "4",
  IP6: "6",
};
export const MediaConnectionAddressTypeMapReverse: {
  [key: string]: string;
} = reverseMap(MediaConnectionAddressTypeMap);
export const MediaConnectionIPMap: { [key: string]: string } = {
  "0.0.0.0": "0",
};
export const MediaConnectionIPMapReverse: { [key: string]: string } =
  reverseMap(MediaConnectionIPMap);

// Extmap URI compression - Map common WebRTC extension URNs to short identifiers
export const ExtmapURIMap: { [key: string]: string } = {
  "urn:ietf:params:rtp-hdrext:ssrc-audio-level": "A",
  "http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time": "B",
  "http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01":
    "C",
  "urn:ietf:params:rtp-hdrext:sdes:mid": "D",
  "urn:ietf:params:rtp-hdrext:toffset": "E",
  "urn:3gpp:video-orientation": "F",
  "http://www.webrtc.org/experiments/rtp-hdrext/playout-delay": "G",
  "http://www.webrtc.org/experiments/rtp-hdrext/video-content-type": "H",
  "http://www.webrtc.org/experiments/rtp-hdrext/video-timing": "I",
  "http://www.webrtc.org/experiments/rtp-hdrext/color-space": "J",
  "urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id": "K",
  "urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id": "L",
  "urn:ietf:params:rtp-hdrext:encrypt": "M",
  "urn:ietf:params:rtp-hdrext:framemarking": "N",
  "http://www.webrtc.org/experiments/rtp-hdrext/video-frame-tracking-id": "O",
  "urn:ietf:params:rtp-hdrext:splicing-interval": "P",
};
export const ExtmapURIMapReverse: { [key: string]: string } =
  reverseMap(ExtmapURIMap);

// RTCP feedback type compression - Map common feedback types to short identifiers
export const RtcpFbMap: { [key: string]: string } = {
  "nack pli": "P", // Must come before "nack" for proper matching
  "goog-remb": "G",
  "transport-cc": "T",
  "ccm fir": "C",
  "nack": "N",
};
export const RtcpFbMapReverse: { [key: string]: string } =
  reverseMap(RtcpFbMap);

// RTCP feedback encode - Sort keys by length desc to match longer patterns first
const rtcpFbEncodeFn = makeRegexSubstitution(RtcpFbMap, { longestFirst: true });
export function rtcpFbEncode(line: string) {
  return rtcpFbEncodeFn(line);
}

// RTCP feedback decode - Sort keys by length desc to match longer patterns first
const rtcpFbDecodeFn = makeRegexSubstitution(RtcpFbMapReverse, {
  longestFirst: true,
});
export function rtcpFbDecode(line: string) {
  return rtcpFbDecodeFn(line);
}
