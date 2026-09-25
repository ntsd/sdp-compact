import { FingerprintToBase64 } from "./base64";
import { decompresBytes, decompressText } from "./compress";
import {
  AttributeRepalceMapReverse,
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
 * Decompact a compacted `RTCSessionDescriptionInit` string to the `RTCSessionDescriptionInit`
 *
 * @param compacted The compacted `RTCSessionDescriptionInit` string to decompact.
 * @param options The options.
 * @returns The `RTCSessionDescriptionInit`.
 */
export const decompact = (
  compacted: string,
  options?: Options
): RTCSessionDescriptionInit => {
  if (typeof compacted !== "string" || compacted.trim().length === 0) {
    throw new Error(
      "Invalid compacted input: empty or non-string value (expected a compacted SDP string)"
    );
  }
  const isOffer = compacted[0] === "O";
  const sdpMinStr = compacted.slice(1);

  return {
    type: isOffer ? "offer" : "answer",
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
    compactSDPStr = decompresBytes(compactSDPBytes);
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
        let attr = value.slice(0, 1);
        const subValue = value.slice(1);

        if (attr in AttributeRepalceMapReverse) {
          attr = AttributeRepalceMapReverse[attr];
          value = attr + subValue;
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
  // Index of the last synthesized a=setup: / a=mid: line — replaced when a
  // retained (PS= / NM=) token with the original value arrives.
  let lastSetupIdx = -1;
  let lastMidIdx = -1;
  // True when a GP= token was seen (retained group line or empty marker
  // meaning the original had no a=group:BUNDLE line) — suppresses the
  // synthesized default BUNDLE.
  let sawGroupToken = false;
  compactSDP.forEach((line) => {
    // retained non-default DTLS setup role — replace the synthesized one
    if (line.startsWith("PS=") && options.mediaOptions?.removeSetup) {
      if (lastSetupIdx >= 0) {
        decompactSDP[lastSetupIdx] = `a=setup:${line.slice(3)}`;
      }
      return;
    }

    // retained non-sequential media id — replace the synthesized one
    if (line.startsWith("NM=") && options.mediaOptions?.removeMediaID) {
      if (lastMidIdx >= 0) {
        decompactSDP[lastMidIdx] = `a=mid:${line.slice(3)}`;
      }
      return;
    }

    // retained group line (GP=<line>), or an empty GP= marker meaning the
    // original had no a=group:BUNDLE line (suppress default synthesis)
    if (line.startsWith("GP=") && options.mediaOptions?.removeMediaID) {
      sawGroupToken = true;
      const groupLine = line.slice(3);
      if (groupLine.length > 0) {
        decompactSDP.push(groupLine);
      }
      return;
    }

    // origin
    if (line.startsWith("o=") && options.origin !== undefined) {
      // `o=<username> <sessID> <sessVersion> <netType> <addrType> <unicastAddress>`
      let origin = line.slice(2).split(" ");
      let newOrgin: string[] = [];

      // username
      if (options.origin.username !== undefined) {
        newOrgin.push(options.origin.username);
      } else {
        const f = origin.shift();
        if (f) newOrgin.push(f);
      }

      // sessionId
      if (options.origin.sessionId !== undefined) {
        newOrgin.push(options.origin.sessionId);
      } else {
        const f = origin.shift();
        if (f) newOrgin.push(f);
      }

      // sessVersion
      const f = origin.shift();
      if (f) newOrgin.push(f);

      // netType
      if (options.origin.netType !== undefined) {
        newOrgin.push(options.origin.netType);
      } else {
        const f = origin.shift();
        if (f) newOrgin.push(f);
      }

      // addrtype
      if (options.origin.addrtype !== undefined) {
        newOrgin.push(options.origin.addrtype);
      } else {
        const f = origin.shift();
        if (f) newOrgin.push(f);
      }

      // unicastAddress
      if (options.origin.unicastAddress !== undefined) {
        newOrgin.push(options.origin.unicastAddress);
      } else {
        const f = origin.shift();
        if (f) newOrgin.push(f);
      }

      decompactSDP.push(`o=${newOrgin.join(" ")}`);
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
        lastSetupIdx = decompactSDP.length - 1;
      }

      if (options.mediaOptions.removeMediaID) {
        decompactSDP.push(`a=mid:${mediaID}`);
        lastMidIdx = decompactSDP.length - 1;
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

  if (options.mediaOptions?.removeMediaID && !sawGroupToken) {
    decompactSDP.unshift(
      `a=group:BUNDLE ${Array.from(Array(mediaID).keys()).join(" ")}`
    );
  }

  let sdpStr = decompactSDP.join("\r\n");

  // do this to sort to the right order
  sdpStr = sdpTransform.write(sdpTransform.parse(sdpStr));

  return sdpStr;
}
