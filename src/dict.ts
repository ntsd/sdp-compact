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

// Candidate encode
const candidateEncodeMap: { [key: string]: string } = {
  "typ host generation 0 network-cost 999": "H",
  "typ srflx": "S",
  "rport 0 generation 0 network-cost 999": "R",
  udp: "U",
  raddr: "A",
  "0.0.0.0": "Z",
};
const candidateEncodeFn = makeRegexSubstitution(candidateEncodeMap);
export function candidateEncode(line: string) {
  return candidateEncodeFn(line);
}

// Candidate decode
const candidateDecodeMap: { [key: string]: string } =
  reverseMap(candidateEncodeMap);
const candidateDecodeFn = makeRegexSubstitution(candidateDecodeMap);
export function candidateDecode(line: string) {
  return candidateDecodeFn(line);
}

// Media encode
const mediaEncodeMap: { [key: string]: string } = {
  application: "P",
  "UDP/DTLS/SCTP": "U",
  "UDP/TLS/RTP/SAVPF": "T",
  "webrtc-datachannel": "D",
  audio: "A",
  video: "V",
};
const mediaEncodeFn = makeRegexSubstitution(mediaEncodeMap);
export function mediaEncode(line: string) {
  return mediaEncodeFn(line);
}

// Media decode
const mediaDecodeMap: { [key: string]: string } =
  reverseMap(mediaEncodeMap);
const mediaDecodeFn = makeRegexSubstitution(mediaDecodeMap);
export function mediaDecode(line: string) {
  return mediaDecodeFn(line);
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
