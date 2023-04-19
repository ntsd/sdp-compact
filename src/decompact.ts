import { decompressText } from "./compress";
import {
  AttributeRepalceMapReverse,
  CandidateReplaceList,
  FieldReplaceMapReverse,
  MediaReplaceList,
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
    compactSDPStr = decompressText(compactSDPStr);
  }

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
  compactSDP.forEach((line) => {
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
        MediaReplaceList.forEach(([to, from]) => {
          line = line.replace(from, to);
        });
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
      CandidateReplaceList.forEach(([to, from]) => {
        line = line.replace(from, to);
      });
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
};
