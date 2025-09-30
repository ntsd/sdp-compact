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
  Object.fromEntries(Object.entries(FieldReplaceMap).map((a) => a.reverse()));

// replace media attributes
export const AttributeRepalceMap: { [key: string]: string } = {
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
export const AttributeRepalceMapReverse: { [key: string]: string } =
  Object.fromEntries(
    Object.entries(AttributeRepalceMap).map((a) => a.reverse())
  );

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
export const HashFuncMapReverse: { [key: string]: string } = Object.fromEntries(
  Object.entries(HashFuncMap).map((a) => a.reverse())
);

// Candidate encode
const candidateEncodeMap: { [key: string]: string } = {
  "typ host generation 0 network-cost 999": "H",
  "typ srflx": "S",
  "rport 0 generation 0 network-cost 999": "R",
  udp: "U",
  raddr: "A",
};
const candidateEncodeRegex = new RegExp(
  Object.keys(candidateEncodeMap).join("|"),
  "g"
);
export function candidateEncode(line: string) {
  return line.replace(
    candidateEncodeRegex,
    (match) => candidateEncodeMap[match]
  );
}

// Candidate decode
const candidateDecodeMap: { [key: string]: string } = Object.fromEntries(
  Object.entries(candidateEncodeMap).map((a) => a.reverse())
);
const candidateDecodeRegex = new RegExp(
  Object.keys(candidateDecodeMap).join("|"),
  "g"
);
export function candidateDecode(line: string) {
  return line.replace(
    candidateDecodeRegex,
    (match) => candidateDecodeMap[match]
  );
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
const mediaEncodeRegex = new RegExp(Object.keys(mediaEncodeMap).join("|"), "g");
export function mediaEncode(line: string) {
  return line.replace(mediaEncodeRegex, (match) => mediaEncodeMap[match]);
}

// Media decode
const mediaDecodeMap: { [key: string]: string } = Object.fromEntries(
  Object.entries(mediaEncodeMap).map((a) => a.reverse())
);
const mediaDecodeRegex = new RegExp(Object.keys(mediaDecodeMap).join("|"), "g");
export function mediaDecode(line: string) {
  return line.replace(mediaDecodeRegex, (match) => mediaDecodeMap[match]);
}

// Media Connection
export const MediaConnectionAddressTypeMap: { [key: string]: string } = {
  IP4: "4",
  IP6: "6",
};
export const MediaConnectionAddressTypeMapReverse: { [key: string]: string } =
  Object.fromEntries(
    Object.entries(MediaConnectionAddressTypeMap).map((a) => a.reverse())
  );
export const MediaConnectionIPMap: { [key: string]: string } = {
  "0.0.0.0": "0",
};
export const MediaConnectionIPMapReverse: { [key: string]: string } =
  Object.fromEntries(
    Object.entries(MediaConnectionIPMap).map((a) => a.reverse())
  );

// Extmap URI compression - Map common WebRTC extension URNs to short identifiers
export const ExtmapURIMap: { [key: string]: string } = {
  "urn:ietf:params:rtp-hdrext:ssrc-audio-level": "A",
  "http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time": "B",
  "http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01": "C",
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
  Object.fromEntries(Object.entries(ExtmapURIMap).map((a) => a.reverse()));
