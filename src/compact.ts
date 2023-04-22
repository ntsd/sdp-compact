import { Options, mergeOptions } from "./options";
import { compressText } from "./compress";
import {
  AttributeRepalceMap,
  FieldReplaceMap,
  HashFuncMap,
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

  sdpStr = compactSDP.join("~");

  if (options.compress) {
    sdpStr = compressText(sdpStr);
  }

  return sdpStr;
};
