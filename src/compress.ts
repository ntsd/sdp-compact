import { inflateSync, deflateSync, strToU8, strFromU8 } from "fflate";
import { base64ToUint8Array, uint8ArrayToBase64 } from "./base64";
import { base92ToUint8Array, uint8ArrayToBase92 } from "./base92";

const encoder = {
  base64: uint8ArrayToBase64,
  base92: uint8ArrayToBase92
} as const;
const decoder = {
  base64: base64ToUint8Array,
  base92: base92ToUint8Array
} as const;

export function compressText(text: string, encoding: 'base64' | 'base92'): string {
  const compressedData = deflateSync(strToU8(text), { level: 9 });
  return encoder[encoding](compressedData);
}

export function decompressText(compressedText: string, encoding: 'base64' | 'base92'): string {
  try {
    const compressedData = decoder[encoding](compressedText);
    return strFromU8(inflateSync(compressedData));
  } catch (e) {
    throw new Error(
      `Failed to decompress compacted SDP payload (encoding: ${encoding}): ${(e as Error)?.message ?? e}`
    );
  }
}

export function compressToBytes(text: string): Uint8Array {
  return deflateSync(strToU8(text), { level: 9 });
}

export function decompresBytes(compressedData: Uint8Array): string {
  try {
    return strFromU8(inflateSync(compressedData));
  } catch (e) {
    throw new Error(
      `Failed to decompress compacted SDP bytes payload: ${(e as Error)?.message ?? e}`
    );
  }
}
