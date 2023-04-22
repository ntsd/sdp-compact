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

export class FingerprintToBase64 {
  private static readonly CHARSET =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  private static readonly BITS_PER_BYTE = 8;
  private static readonly BITS_PER_BASE64_CHAR = 6;

  static encode(hexString: string): string {
    const hexArray = hexString.split(":");
    const byteArray = new Uint8Array(hexArray.map((hex) => parseInt(hex, 16)));

    let bitBuffer = 0;
    let bitCount = 0;
    let base64String = "";

    for (const byte of byteArray) {
      bitBuffer = (bitBuffer << this.BITS_PER_BYTE) | byte;
      bitCount += this.BITS_PER_BYTE;

      while (bitCount >= this.BITS_PER_BASE64_CHAR) {
        bitCount -= this.BITS_PER_BASE64_CHAR;
        const index =
          (bitBuffer >> bitCount) & ((1 << this.BITS_PER_BASE64_CHAR) - 1);
        base64String += this.CHARSET[index];
      }
    }

    if (bitCount > 0) {
      const index =
        (bitBuffer << (this.BITS_PER_BASE64_CHAR - bitCount)) &
        ((1 << this.BITS_PER_BASE64_CHAR) - 1);
      base64String += this.CHARSET[index];
    }

    while (base64String.length % 4 !== 0) {
      base64String += "=";
    }

    return base64String;
  }

  static decode(base64String: string): string {
    let bitBuffer = 0;
    let bitCount = 0;
    let hexString = "";

    for (const char of base64String) {
      if (char === "=") {
        break;
      }

      const index = this.CHARSET.indexOf(char);
      bitBuffer = (bitBuffer << this.BITS_PER_BASE64_CHAR) | index;
      bitCount += this.BITS_PER_BASE64_CHAR;

      while (bitCount >= this.BITS_PER_BYTE) {
        bitCount -= this.BITS_PER_BYTE;
        const byte = (bitBuffer >> bitCount) & ((1 << this.BITS_PER_BYTE) - 1);
        hexString += byte.toString(16).padStart(2, "0").toUpperCase();
      }
    }

    // add colon every 2 hex
    let output = "";
    for (let i = 0; i < hexString.length; i++) {
      output += hexString[i];
      if (i % 2 === 1 && i !== hexString.length - 1) {
        output += ":";
      }
    }

    return output;
  }
}
