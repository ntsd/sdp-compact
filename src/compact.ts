import { Options, mergeOptions } from "./options";
import { compressText, compressToBytes } from "./compress";
import {
  AttributeRepalceMap,
  FieldReplaceMap,
  HashFuncMap,
  MediaConnectionAddressTypeMap,
  MediaConnectionIPMap,
  candidateEncode,
  mediaEncode,
} from "./dict";
import { FingerprintToBase64 } from "./base64";

/**
 * Compact a RTCSessionDescription
 *
 * @param rtcSessionDesc The `RTCSessionDescriptionInit` to compact.
 * @returns The compacted `RTCSessionDescriptionInit` string.
 */
export const compact = (
  rtcSessionDesc: RTCSessionDescriptionInit,
  options?: Options
): string => {
  const sdp = rtcSessionDesc.sdp;
  if (!sdp) {
    throw new Error("SDP not found");
  }
  const comp = compactSDP(sdp, options);

  return (rtcSessionDesc.type === "offer" ? "O" : "A") + comp;
};

/**
 * Compact a Session Description Protocol (SDP) string
 *
 * @param sdpStr The SDP string to compact.
 * @param newOptions The options.
 * @returns The compacted SDP string.
 */
export const compactSDP = (sdpStr: string, newOptions?: Options): string => {
  const options = mergeOptions(newOptions);

  sdpStr = compactSDPStr(sdpStr, options);

  if (options.compress) {
    sdpStr = compressText(sdpStr);
  }

  return sdpStr;
};

/**
 * Compact a Session Description Protocol (SDP) to Uint8Array
 *
 * @param sdpStr The SDP string to compact.
 * @param newOptions The options.
 * @returns The compacted SDP Uint8Array.
 */
export const compactSDPBytes = (
  sdpStr: string,
  newOptions?: Options
): Uint8Array => {
  const options = mergeOptions(newOptions);

  sdpStr = compactSDPStr(sdpStr, options);

  let sdpBytes: Uint8Array;
  if (options.compress) {
    sdpBytes = compressToBytes(sdpStr);
  } else {
    sdpBytes = new TextEncoder().encode(sdpStr);
  }

  return sdpBytes;
};

function compactSDPStr(sdpStr: string, options: Options): string {
  const sdp = sdpStr.split("\r\n");
  let compactSDP: string[] = [];

  sdp.forEach((line) => {
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
      let newOrgin: string[] = [];

      // username
      if (options.origin.username === undefined) {
        newOrgin.push(origin[0]);
      }

      // sessID
      if (options.origin.sessionId === undefined) {
        newOrgin.push(origin[1]);
      }

      // sessVersion
      newOrgin.push(origin[2]);

      // netType
      if (options.origin.netType === undefined) {
        newOrgin.push(origin[3]);
      }

      // addrType
      if (options.origin.addrtype === undefined) {
        newOrgin.push(origin[4]);
      }

      // unicastAddress
      if (options.origin.unicastAddress === undefined) {
        newOrgin.push(origin[5]);
      }

      compactSDP.push(`o=${newOrgin.join(" ")}`);
      return;
    }

    if (line.startsWith("a=group:") && options.mediaOptions?.removeMediaID) {
      return;
    }

    if (line.startsWith("a=mid:") && options.mediaOptions?.removeMediaID) {
      return;
    }

    if (line.startsWith("a=setup:") && options.mediaOptions?.removeSetup) {
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

    compactSDP.push(line);
  });

  if (options.replaceFieldNames) {
    compactSDP = compactSDP.map((line) => {
      let field = line.slice(0, 2);
      let value = line.slice(2);

      // replace attributes
      if (field === "a=") {
        let [attr, ...subValue] = value.split(":");
        attr = attr + ":";

        if (attr in AttributeRepalceMap) {
          attr = AttributeRepalceMap[attr];
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
