import * as pako from "pako";
import { base64ToUint8Array, uint8ArrayToBase64 } from "./base64";

export function compressText(text: string): string {
  const compressedData = pako.deflate(text, { level: 9 });
  return uint8ArrayToBase64(compressedData);
}

export function decompressText(compressedText: string): string {
  const compressedData = base64ToUint8Array(compressedText);
  return pako.inflate(compressedData, { to: "string" });
}

export function compressToBytes(text: string): Uint8Array {
  return pako.deflate(text, { level: 9 });
}

export function decompresBytes(compressedData: Uint8Array): string {
  return pako.inflate(compressedData, { to: "string" });
}
