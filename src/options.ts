// compact origin options `o=<username> <sessID> <sessVersion> <netType> <addrType> <unicastAddress>`
export interface OriginOptions {
  // fixed username, can be '-" for undefined user, 1st parameter
  username?: string;
  // fixed sessionId, can be the same value on all peers, 2nd parameter
  sessionId?: string;
  // fixed netType, must be "IN" for internet
  netType?: string;
  // fixed addressType, must be either "IP4" or "IP6", usually will be "IP4"
  addrtype?: string;
  // fixed unicastAddress, usually will be "127.0.0.1"
  unicastAddress?: string;
}

export interface MediaOptions {
  // remove media id (a=mid:) and group (a=group:<type>) (a=group:BUNDLE), to use sequence medias instead
  removeMediaID?: boolean;
  // remove DTLS role (a=setup:), will set to `actpass` for offer and `active` for answer
  removeSetup?: boolean;
  // "a=candidate:" replaced string following `CandidateReplaceList`
  replaceCandidateString?: boolean;
}

export interface Options {
  // compress compress with zlib deflate, then base64
  compress?: boolean;
  // replace field name using `FieldReplaceMap` and `FieldReplaceMapReverse`
  replaceFieldNames?: boolean;
  // fixed sdp version (v=), usually will always be "0" for now
  sdpVersion?: number;
  // fixed session name (s=), usually will be "-"
  sessionName?: string;
  // fixed origin (o=)
  origin?: OriginOptions;
  // fixed timing (t=), it can be "0 0" for unbounded
  timing?: string;
  // fixed allows mixing attribute (a=extmap-allow-mixed), usually will be allow by default
  extmapAllowMixed?: boolean;
  // fixed msid senabtic (a=msid-semantic:), should be WMS for WebRTC Media Stream
  msidSemantic?: string;
  // media options
  mediaOptions?: MediaOptions;
}

export const DefaultOptions: Options = {
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
  },
};