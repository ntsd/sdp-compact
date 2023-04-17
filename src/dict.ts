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

export const CandidateReplaceList = [
  ["typ host generation 0 network-cost 999", "H"],
  ["typ srflx", "S"],
  ["rport 0 generation 0 network-cost 999", "R"],
  ["udp", "U"],
  ["raddr", "A"],
];
