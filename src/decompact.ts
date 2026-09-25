import { FingerprintToBase64 } from "./base64";
import { decompressBytes, decompressText } from "./compress";
import {
  AttributeReplaceMapReverse,
  FieldReplaceMapReverse,
  HashFuncMapReverse,
  MediaConnectionAddressTypeMapReverse,
  MediaConnectionIPMapReverse,
  ExtmapURIMapReverse,
  candidateDecode,
  mediaDecode,
  rtcpFbDecode,
} from "./dict";
import { Options, mergeOptions } from "./options";
import * as sdpTransform from "sdp-transform";

/**
 * Map the single-character prefix at the start of a compacted
 * `RTCSessionDescriptionInit` string to `RTCSdpType` (reverse of `SDPTypePrefixMap`).
 */
const SDPTypePrefixMapReverse: Record<string, RTCSdpType> = {
  O: "offer",
  A: "answer",
  P: "pranswer",
  R: "rollback",
};

/**
 * Decompact a compacted `RTCSessionDescriptionInit` string to the `RTCSessionDescriptionInit`
 *
 * @param compacted The compacted `RTCSessionDescriptionInit` string to decompact.
 * @param options The options.
 * @returns The `RTCSessionDescriptionInit`.
 * @throws Error if `compacted` is empty or does not start with a known type prefix.
 */
export const decompact = (
  compacted: string,
  options?: Options
): RTCSessionDescriptionInit => {
  if (typeof compacted !== "string" || compacted.length < 2) {
    throw new Error(
      `Invalid compacted SDP string: expected a non-empty string starting with a type prefix ("O", "A", "P", or "R")`
    );
  }
  const type: RTCSdpType | undefined = SDPTypePrefixMapReverse[compacted[0]];
  if (!type) {
    throw new Error(
      `Invalid compacted SDP type prefix: ${String(compacted[0])}`
    );
  }
  const isOffer = type === "offer";
  const sdpMinStr = compacted.slice(1);

  return {
    type,
    sdp: decompactSDP(sdpMinStr, isOffer, options),
  };
};

/**
 * Decompact a compacted spd string to spd string
 *
 * @param compactSDPStr The compacted spd string to decompact.
 * @param options The options.
 * @returns The decompacted spd string.
 */
export const decompactSDP = (
  compactSDPStr: string,
  isOffer: boolean,
  newOptions?: Options
): string => {
  const options = mergeOptions(newOptions);

  if (options.compress) {
    compactSDPStr = decompressText(compactSDPStr, options.compress);
  }

  return decompactSDPStr(compactSDPStr, isOffer, options);
};

/**
 * Decompact a compacted spd Uint8Array to spd string
 *
 * @param compactSDPBytes The compacted spd Uint8Array to decompact.
 * @param options The options.
 * @returns The decompacted spd string.
 */
export const decompactSDPBytes = (
  compactSDPBytes: Uint8Array,
  isOffer: boolean,
  newOptions?: Options
): string => {
  const options = mergeOptions(newOptions);

  let compactSDPStr: string;
  if (options.compress) {
    compactSDPStr = decompressBytes(compactSDPBytes);
  } else {
    compactSDPStr = new TextDecoder().decode(compactSDPBytes);
  }

  return decompactSDPStr(compactSDPStr, isOffer, options);
};

function decompactSDPStr(
  compactSDPStr: string,
  isOffer: boolean,
  options: Options
): string {
  let compactSDP = compactSDPStr.split("~");
  let decompactSDP: string[] = [];

  if (options.replaceFieldNames) {
    compactSDP = compactSDP.map((line) => {
      let field = line.slice(0, 1);
      let value = line.slice(1);

      if (field in FieldReplaceMapReverse) {
        field = FieldReplaceMapReverse[field];
      }

      // replace attributes
      if (field === "a=") {
        // value is like "E1 A" where first char is the attribute code
        const attr = value[0];
        const subValue = value.slice(1);

        if (attr in AttributeReplaceMapReverse) {
          const mapped = AttributeReplaceMapReverse[attr];
          value = mapped + subValue;
        }
      }

      return field + value;
    });
  }

  if (options.sdpVersion !== undefined) {
    decompactSDP.push(`v=${options.sdpVersion}`);
  }

  if (options.sessionName !== undefined) {
    decompactSDP.push(`s=${options.sessionName}`);
  }

  if (options.timing !== undefined) {
    decompactSDP.push(`t=${options.timing}`);
  }

  if (options.extmapAllowMixed) {
    decompactSDP.push(`a=extmap-allow-mixed`);
  }

  if (options.msidSemantic !== undefined) {
    decompactSDP.push(`a=msid-semantic: ${options.msidSemantic}`);
  }

  let mediaID = 0;
  compactSDP.forEach((line) => {
    // origin
    if (line.startsWith("o=") && options.origin !== undefined) {
      // `o=<username> <sessID> <sessVersion> <netType> <addrType> <unicastAddress>`
      let origin = line.slice(2).split(" ");
      let newOrigin: string[] = [];

      // username
      if (options.origin.username !== undefined) {
        newOrigin.push(options.origin.username);
      } else {
        const f = origin.shift();
        if (f) newOrigin.push(f);
      }

      // sessionId
      if (options.origin.sessionId !== undefined) {
        newOrigin.push(options.origin.sessionId);
      } else {
        const f = origin.shift();
        if (f) newOrigin.push(f);
      }

      // sessVersion
      const f = origin.shift();
      if (f) newOrigin.push(f);

      // netType
      if (options.origin.netType !== undefined) {
        newOrigin.push(options.origin.netType);
      } else {
        const f = origin.shift();
        if (f) newOrigin.push(f);
      }

      // addrtype
      if (options.origin.addrtype !== undefined) {
        newOrigin.push(options.origin.addrtype);
      } else {
        const f = origin.shift();
        if (f) newOrigin.push(f);
      }

      // unicastAddress
      if (options.origin.unicastAddress !== undefined) {
        newOrigin.push(options.origin.unicastAddress);
      } else {
        const f = origin.shift();
        if (f) newOrigin.push(f);
      }

      decompactSDP.push(`o=${newOrigin.join(" ")}`);
      return;
    }

    // media
    if (line.startsWith("m=") && options.mediaOptions !== undefined) {
      // replace media string
      if (options.mediaOptions?.replaceMediaString) {
        line = mediaDecode(line);
      }

      decompactSDP.push(line);

      if (options.mediaOptions.removeSetup) {
        decompactSDP.push(`a=setup:${isOffer ? "actpass" : "active"}`);
      }

      if (options.mediaOptions.removeMediaID) {
        decompactSDP.push(`a=mid:${mediaID}`);
        mediaID++;
      }

      if (options.mediaOptions.forceTrickle) {
        decompactSDP.push("a=ice-options:trickle");
      }

      return;
    }

    if (
      line.startsWith("a=candidate:") &&
      options.mediaOptions?.replaceCandidateString
    ) {
      line = candidateDecode(line);
      decompactSDP.push(line);
      return;
    }

    if (
      line.startsWith("a=fingerprint:") &&
      options.mediaOptions?.compressFingerprint
    ) {
      let [hashMethod, fingerprint] = line.slice(14).split(" ");
      if (
        hashMethod === undefined ||
        hashMethod === "" ||
        fingerprint === undefined ||
        fingerprint === ""
      ) {
        throw new Error(
          `Malformed a=fingerprint line (missing hash method or fingerprint value): "${line}"`
        );
      }
      if (hashMethod in HashFuncMapReverse) {
        hashMethod = HashFuncMapReverse[hashMethod];
      }
      fingerprint = FingerprintToBase64.decode(fingerprint);
      decompactSDP.push(`a=fingerprint:${hashMethod} ${fingerprint}`);
      return;
    }

    if (line.startsWith("c=") && options.mediaOptions?.compressConnection) {
      let [addressType, ip] = line.slice(2).split(" ");
      if (
        addressType === undefined ||
        addressType === "" ||
        ip === undefined ||
        ip === ""
      ) {
        throw new Error(
          `Malformed c= line (missing address type or IP address): "${line}"`
        );
      }
      if (addressType in MediaConnectionAddressTypeMapReverse) {
        addressType = MediaConnectionAddressTypeMapReverse[addressType];
      }
      if (ip in MediaConnectionIPMapReverse) {
        ip = MediaConnectionIPMapReverse[ip];
      }
      // network type (IN for Internet), address type (IP4), and the connection address (115.87.239.220)
      decompactSDP.push(`c=IN ${addressType} ${ip}`);
      return;
    }

    if (line.startsWith("a=extmap:") && options.mediaOptions?.compressExtmap) {
      // Parse extmap line: a=extmap:<id> <compressedURI> [<attributes>]
      let [id, compressedURI, ...attributes] = line.slice(9).split(" ");
      if (
        id === undefined ||
        id === "" ||
        compressedURI === undefined ||
        compressedURI === ""
      ) {
        throw new Error(
          `Malformed a=extmap line (missing extmap id or URI): "${line}"`
        );
      }
      if (compressedURI in ExtmapURIMapReverse) {
        compressedURI = ExtmapURIMapReverse[compressedURI];
      }
      decompactSDP.push(
        `a=extmap:${id} ${compressedURI}${
          attributes.length > 0 ? ` ${attributes.join(" ")}` : ""
        }`
      );
      return;
    }

    if (line.startsWith("a=rtcp-fb:") && options.mediaOptions?.compressRtcpFb) {
      line = rtcpFbDecode(line);
      decompactSDP.push(line);
      return;
    }

    decompactSDP.push(line);
  });

  if (options.mediaOptions?.removeMediaID) {
    decompactSDP.unshift(
      `a=group:BUNDLE ${Array.from(Array(mediaID).keys()).join(" ")}`
    );
  }

  let sdpStr = decompactSDP.join("\r\n");

  // do this to sort to the right order
  sdpStr = sdpTransform.write(sdpTransform.parse(sdpStr));

  return sdpStr;
}
