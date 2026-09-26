import { Options, mergeOptions } from "./options";
import { compressText, compressToBytes } from "./compress";
import {
  AttributeReplaceMap,
  FieldReplaceMap,
  HashFuncMap,
  MediaConnectionAddressTypeMap,
  MediaConnectionIPMap,
  ExtmapURIMap,
  candidateEncode,
  mediaEncode,
  rtcpFbEncode,
} from "./dict";
import { FingerprintToBase64 } from "./base64";

/**
 * Map `RTCSdpType` to the single-character prefix stored at the start of a
 * compacted `RTCSessionDescriptionInit` string.
 */
const SDPTypePrefixMap: Record<RTCSdpType, string> = {
  offer: "O",
  answer: "A",
  pranswer: "P",
  rollback: "R",
};

/**
 * Compact a RTCSessionDescription
 *
 * @param rtcSessionDesc The `RTCSessionDescriptionInit` to compact.
 * @returns The compacted `RTCSessionDescriptionInit` string.
 * @throws Error if `sdp` is missing or `type` is not a supported `RTCSdpType`.
 */
export const compact = (
  rtcSessionDesc: RTCSessionDescriptionInit,
  options?: Options
): string => {
  const sdp = rtcSessionDesc.sdp;
  if (!sdp) {
    throw new Error("SDP not found");
  }
  const prefix: string | undefined = SDPTypePrefixMap[rtcSessionDesc.type];
  if (!prefix) {
    throw new Error(`Unsupported SDP type: ${String(rtcSessionDesc.type)}`);
  }
  const comp = compactSDP(sdp, options, rtcSessionDesc.type === "offer");

  return prefix + comp;
};

/**
 * Compact a Session Description Protocol (SDP) string
 *
 * @param sdpStr The SDP string to compact.
 * @param newOptions The options.
 * @param isOffer Whether the SDP is an offer (affects which `a=setup:` value
 * is treated as the default that decompact synthesizes; `actpass` for
 * offers, `active` for answers). Defaults to `true`.
 * @returns The compacted SDP string.
 */
export const compactSDP = (
  sdpStr: string,
  newOptions?: Options,
  isOffer: boolean = true
): string => {
  const options = mergeOptions(newOptions);

  sdpStr = compactSDPStr(sdpStr, options, isOffer);

  if (options.compress) {
    sdpStr = compressText(sdpStr, options.compress);
  }

  return sdpStr;
};

/**
 * Compact a Session Description Protocol (SDP) to Uint8Array
 *
 * @param sdpStr The SDP string to compact.
 * @param newOptions The options.
 * @param isOffer Whether the SDP is an offer (affects which `a=setup:` value
 * is treated as the default; `actpass` for offers, `active` for answers).
 * Defaults to `true`.
 * @returns The compacted SDP Uint8Array.
 */
export const compactSDPBytes = (
  sdpStr: string,
  newOptions?: Options,
  isOffer: boolean = true
): Uint8Array => {
  const options = mergeOptions(newOptions);

  sdpStr = compactSDPStr(sdpStr, options, isOffer);

  let sdpBytes: Uint8Array;
  if (options.compress) {
    sdpBytes = compressToBytes(sdpStr);
  } else {
    sdpBytes = new TextEncoder().encode(sdpStr);
  }

  return sdpBytes;
};

function compactSDPStr(
  sdpStr: string,
  options: Options,
  isOffer: boolean
): string {
  const sdp = sdpStr.split("\r\n");
  let compactSDP: string[] = [];

  // Number of media sections (m= lines). A `a=group:BUNDLE` line whose
  // members list all media ids in order is the default and is omitted when
  // removeMediaID is set; anything else is retained as a `GP=` token.
  const mediaCount = sdp.filter((l) => l.trim().startsWith("m=")).length;
  // True when any a=group: line was present in the original.
  let sawGroupLine = false;
  // Index of the current `a=mid:` line. A mid value equal to the number of
  // previous mids (i.e. sequential 0,1,2,...) is the default and is omitted;
  // anything else is retained as an `NM=` token.
  let midIndex = 0;

  sdp.forEach((line) => {
    line = line.trim();
    // remove empty line
    if (line.length === 0) {
      return;
    }

    if (line.startsWith("v=") && options.sdpVersion !== undefined) {
      return;
    }

    if (line.startsWith("s=") && options.sessionName !== undefined) {
      return;
    }

    if (line.startsWith("t=") && options.timing !== undefined) {
      return;
    }

    if (line.startsWith("a=extmap-allow-mixed") && options.extmapAllowMixed) {
      return;
    }

    if (
      line.startsWith("a=msid-semantic:") &&
      options.msidSemantic !== undefined
    ) {
      return;
    }

    if (line.startsWith("o=") && options.origin !== undefined) {
      // `o=<username> <sessID> <sessVersion> <netType> <addrType> <unicastAddress>`
      let origin = line.slice(2).split(" ");
      let newOrigin: string[] = [];

      // username
      if (options.origin.username === undefined) {
        newOrigin.push(origin[0]);
      }

      // sessID
      if (options.origin.sessionId === undefined) {
        newOrigin.push(origin[1]);
      }

      // sessVersion
      newOrigin.push(origin[2]);

      // netType
      if (options.origin.netType === undefined) {
        newOrigin.push(origin[3]);
      }

      // addrType
      if (options.origin.addrtype === undefined) {
        newOrigin.push(origin[4]);
      }

      // unicastAddress
      if (options.origin.unicastAddress === undefined) {
        newOrigin.push(origin[5]);
      }

      compactSDP.push(`o=${newOrigin.join(" ")}`);
      return;
    }

    if (line.startsWith("a=group:") && options.mediaOptions?.removeMediaID) {
      sawGroupLine = true;
      // A BUNDLE (or any group) line listing all media ids in order is the
      // default that decompact synthesizes — omit it. Anything else
      // (subset BUNDLE, custom ids/order, non-BUNDLE group) is preserved
      // verbatim as a `GP=` token so the round-trip stays lossless.
      if (line.startsWith("a=group:BUNDLE ")) {
        const members = line.slice("a=group:BUNDLE ".length).split(" ");
        const isDefault =
          members.length === mediaCount &&
          members.every((m, i) => m === String(i));
        if (isDefault) {
          return;
        }
      }
      compactSDP.push(`GP=${line}`);
      return;
    }

    if (line.startsWith("a=mid:") && options.mediaOptions?.removeMediaID) {
      const mid = line.slice(6);
      if (mid === String(midIndex)) {
        // Sequential 0,1,2,... matches what decompact synthesizes — omit.
      } else {
        compactSDP.push(`NM=${mid}`);
      }
      midIndex++;
      return;
    }

    if (line.startsWith("a=setup:") && options.mediaOptions?.removeSetup) {
      // decompact synthesizes `actpass` for offers and `active` for answers —
      // a matching value is omitted; anything else (e.g. `passive`, or
      // `actpass`/`active` on the "wrong" side) is retained as a `PS=` token
      // so the round-trip stays lossless.
      const role = line.slice(8);
      if (role !== (isOffer ? "actpass" : "active")) {
        compactSDP.push(`PS=${role}`);
      }
      return;
    }

    if (
      line.startsWith("a=ice-options:trickle") &&
      options.mediaOptions?.forceTrickle
    ) {
      return;
    }

    if (line.startsWith("m=") && options.mediaOptions?.replaceMediaString) {
      line = mediaEncode(line);
      compactSDP.push(line);
      return;
    }

    if (
      line.startsWith("a=candidate:") &&
      options.mediaOptions?.replaceCandidateString
    ) {
      line = candidateEncode(line);
      compactSDP.push(line);
      return;
    }

    if (
      line.startsWith("a=fingerprint:") &&
      options.mediaOptions?.compressFingerprint
    ) {
      let [hashMethod, fingerprint] = line.slice(14).split(" ");
      if (hashMethod in HashFuncMap) {
        hashMethod = HashFuncMap[hashMethod];
      }
      fingerprint = FingerprintToBase64.encode(fingerprint);
      compactSDP.push(`a=fingerprint:${hashMethod} ${fingerprint}`);
      return;
    }

    if (line.startsWith("c=") && options.mediaOptions?.compressConnection) {
      // network type (IN for Internet), address type (IP4), and the connection address (115.87.239.220)
      let [networkType, addressType, ip] = line.slice(2).split(" ");
      if (addressType in MediaConnectionAddressTypeMap) {
        addressType = MediaConnectionAddressTypeMap[addressType];
      }
      if (ip in MediaConnectionIPMap) {
        ip = MediaConnectionIPMap[ip];
      }
      compactSDP.push(`c=${addressType} ${ip}`);
      return;
    }

    if (line.startsWith("a=extmap:") && options.mediaOptions?.compressExtmap) {
      // Parse extmap line: a=extmap:<id> <uri> [<attributes>]
      let [id, compressedURI, ...attributes] = line.slice(9).split(" ");
      if (compressedURI) {
        if (compressedURI in ExtmapURIMap) {
          compressedURI = ExtmapURIMap[compressedURI];
        }
        line = `a=extmap:${id} ${compressedURI}`;
        if (attributes.length > 0) {
          line += ` ${attributes.join(" ")}`;
        }
      }
      compactSDP.push(line);
      return;
    }

    if (line.startsWith("a=rtcp-fb:") && options.mediaOptions?.compressRtcpFb) {
      line = rtcpFbEncode(line);
      compactSDP.push(line);
      return;
    }

    compactSDP.push(line);
  });

  // If the original had media sections but no a=group: line at all, emit an
  // empty GP= marker so decompact does not synthesize a default
  // a=group:BUNDLE that wasn't there originally.
  if (
    options.mediaOptions?.removeMediaID &&
    mediaCount > 0 &&
    !sawGroupLine
  ) {
    compactSDP.push("GP=");
  }

  if (options.replaceFieldNames) {
    compactSDP = compactSDP.map((line) => {
      let field = line.slice(0, 2);
      let value = line.slice(2);

      // replace attributes
      if (field === "a=") {
        let [attr, ...subValue] = value.split(":");
        attr = attr + ":";

        if (attr in AttributeReplaceMap) {
          attr = AttributeReplaceMap[attr];
          value = attr + subValue.join(":");
        }
      }

      if (field in FieldReplaceMap) {
        field = FieldReplaceMap[field];
      }

      return field + value;
    });
  }

  return compactSDP.join("~");
}
