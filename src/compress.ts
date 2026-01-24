import * as pako from "pako";
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
  const compressedData = pako.deflate(text, { level: 9 });
  return encoder[encoding](compressedData);
}

export function decompressText(compressedText: string, encoding: 'base64' | 'base92'): string {
  const compressedData = decoder[encoding](compressedText);
  return pako.inflate(compressedData, { to: "string" });
}

export function compressToBytes(text: string): Uint8Array {
  return pako.deflate(text, { level: 9 });
}

export function decompresBytes(compressedData: Uint8Array): string {
  return pako.inflate(compressedData, { to: "string" });
}
