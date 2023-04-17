/**
 * Converts a string to base64.
 *
 * @param s The string to convert.
 * @returns The base64-encoded string.
 */
export function base64encode(s: string): string {
  if (btoa) {
    // if the browser supports
    return btoa(s);
  }
  // use node Buffer
  return Buffer.from(s, "binary").toString("base64");
}

/**
 * Decodes a base64-encoded string.
 *
 * @param s The base64-encoded string to decode.
 * @returns The decoded string.
 */
export function base64decode(s: string): string {
  if (atob) {
    // if the browser supports
    return atob(s);
  }
  // use node Buffer
  return Buffer.from(s, "base64").toString("binary");
}

export function uint8ArrayToBase64(array: Uint8Array): string {
  return base64encode(String.fromCharCode(...array));
}

export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = base64decode(base64);
  const length = binaryString.length;
  const bytes = new Uint8Array(length);

  for (let i = 0; i < length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
}
