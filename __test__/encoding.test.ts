import {
  FingerprintToBase64,
  uint8ArrayToBase64,
  base64ToUint8Array,
  base64decode,
} from "../src/base64";
import { uint8ArrayToBase92, base92ToUint8Array } from "../src/base92";
import * as crypto from "crypto";

/** Byte-array comparison helper (Uint8Array<ArrayBufferLike> has no .equals). */
function expectBytesEqual(actual: Uint8Array, expected: Uint8Array): void {
  expect(Array.from(actual)).toEqual(Array.from(expected));
}

describe("base64 primitives", () => {
  describe("uint8ArrayToBase64 / base64ToUint8Array", () => {
    test("round-trip: empty array", () => {
      const empty = new Uint8Array(0);
      const encoded = uint8ArrayToBase64(empty);
      expect(encoded).toBe("");
      expectBytesEqual(base64ToUint8Array(encoded), empty);
    });

    test("round-trip: small array", () => {
      const bytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
      expectBytesEqual(base64ToUint8Array(uint8ArrayToBase64(bytes)), bytes);
    });

    test("round-trip: array containing 0x00 and 0xFF bytes", () => {
      // 0x00 and 0xFF are the extremes of the byte range; a charCode-based
      // encoding/decoding bug would show up here (e.g. 0x00 dropped, 0xFF
      // mangled by a signed-byte cast).
      const bytes = new Uint8Array([0x00, 0xff, 0x00, 0xff, 0x80, 0x7f]);
      const encoded = uint8ArrayToBase64(bytes);
      // Pinned against Node's Buffer oracle (Buffer.from(bytes).toString("base64")).
      expect(encoded).toBe("AP8A/4B/");
      expectBytesEqual(base64ToUint8Array(encoded), bytes);
      // Smaller 0x00/0xFF-only vector (exercises the '=' padding path:
      // 4 bytes -> 6 base64 chars + 2 padding).
      const extreme = new Uint8Array([0x00, 0xff, 0x00, 0xff]);
      expect(uint8ArrayToBase64(extreme)).toBe("AP8A/w==");
      expectBytesEqual(base64ToUint8Array("AP8A/w=="), extreme);
    });

    test("known fixed vector: 'Hello' bytes -> 'SGVsbG8='", () => {
      const hello = new Uint8Array([72, 101, 108, 108, 111]);
      const encoded = uint8ArrayToBase64(hello);
      expect(encoded).toBe("SGVsbG8=");
      expectBytesEqual(base64ToUint8Array(encoded), hello);
    });

    test("round-trip past the ~126k String.fromCharCode spread-arg boundary (200k bytes)", () => {
      // Regression pin for the RangeError: the old implementation used
      // `String.fromCharCode(...array)`, which throws
      // "RangeError: Maximum call stack size exceeded" once the byte count
      // exceeds the engine's call-argument limit (~126k on Node v26).
      // 200k bytes crosses that boundary and would throw on unpatched code.
      const big = new Uint8Array(crypto.randomBytes(200_000));
      const encoded = uint8ArrayToBase64(big);
      // 200k bytes -> ceil(200000 / 3) * 4 base64 chars (with padding).
      expect(encoded.length).toBe(266_668);
      const decoded = base64ToUint8Array(encoded);
      expect(decoded.length).toBe(200_000);
      expectBytesEqual(decoded, big);
    });

    test("Buffer fallback path: encode/decode without btoa/atob", () => {
      // The implementation branches on `btoa`/`atob` availability
      // (`if (btoa)`). Note: deleting the globals entirely would make the
      // guard itself throw a ReferenceError — the fallback is reachable
      // only when the globals are defined but falsy, as here.
      const btoaDesc = Object.getOwnPropertyDescriptor(globalThis, "btoa");
      const atobDesc = Object.getOwnPropertyDescriptor(globalThis, "atob");
      Object.defineProperty(globalThis, "btoa", {
        value: undefined,
        configurable: true,
        writable: true,
      });
      Object.defineProperty(globalThis, "atob", {
        value: undefined,
        configurable: true,
        writable: true,
      });
      try {
        // Falsy but defined -> the `if (btoa)` guard takes the Buffer path.
        expect(typeof btoa).toBe("undefined");
        expect(!!btoa).toBe(false);
        expect(typeof atob).toBe("undefined");
        expect(!!atob).toBe(false);

        const bytes = new Uint8Array([72, 101, 108, 108, 111]);
        // Same fixed vector as the btoa path.
        expect(uint8ArrayToBase64(bytes)).toBe("SGVsbG8=");
        expectBytesEqual(
          base64ToUint8Array("SGVsbG8="),
          new Uint8Array([72, 101, 108, 108, 111])
        );
        // 0x00/0xFF extremes through the Buffer path.
        expect(
          uint8ArrayToBase64(new Uint8Array([0x00, 0xff, 0x00, 0xff]))
        ).toBe("AP8A/w==");
        expect(base64decode("AP8A/w==")).toBe("\x00\xff\x00\xff");
      } finally {
        if (btoaDesc) Object.defineProperty(globalThis, "btoa", btoaDesc);
        if (atobDesc) Object.defineProperty(globalThis, "atob", atobDesc);
      }
    });
  });

  describe("FingerprintToBase64", () => {
    // sha-256 fingerprint from the main test fixture (offer.sdp).
    const SHA256_HEX =
      "E3:25:E3:11:51:3D:A2:4B:AA:B1:A8:EB:DB:03:98:F1:C7:0D:4D:1C:6C:88:EC:BB:20:DA:D0:B7:33:33:BA:8C";

    test("sha-256: fixed encode vector (matches Node Buffer base64 of the digest bytes)", () => {
      expect(FingerprintToBase64.encode(SHA256_HEX)).toBe(
        "4yXjEVE9okuqsajr2wOY8ccNTRxsiOy7INrQtzMzuow="
      );
    });

    test("sha-256: encode/decode round-trip", () => {
      expect(FingerprintToBase64.decode(FingerprintToBase64.encode(SHA256_HEX))).toBe(
        SHA256_HEX
      );
    });

    test("sha-1 (20 bytes): fixed encode vector", () => {
      const hex = "0A:1B:2C:3D:4E:5F:6A:7B:8C:9D:0E:1F:2A:3B:4C:5D:6E:7F:8A:9B";
      // Pinned against Buffer.from(hex).toString("base64").
      expect(FingerprintToBase64.encode(hex)).toBe("ChssPU5fanuMnQ4fKjtMXW5/ips=");
      expect(FingerprintToBase64.decode(FingerprintToBase64.encode(hex))).toBe(hex);
    });

    test("leading 0x00 bytes: fixed encode vector (base64 padding path)", () => {
      // 20 bytes starting with a 0x00 byte — exercises the bit-buffer's
      // leading-zero handling (bitBuffer starts at 0 and must accumulate
      // bits, not drop the first byte).
      const hex = "00:01:02:03:04:05:06:07:08:09:0A:0B:0C:0D:0E:0F:10:11:12:13";
      expect(FingerprintToBase64.encode(hex)).toBe(
        "AAECAwQFBgcICQoLDA0ODxAREhM="
      );
      expect(FingerprintToBase64.decode(FingerprintToBase64.encode(hex))).toBe(hex);
    });

    test("10-byte fingerprint: partial final 6-bit group", () => {
      // 10 bytes = 80 bits = 13 full 6-bit groups + 2 leftover bits,
      // exercising the final partial-group branch in encode() and the
      // missing-tail-bit handling in decode().
      const hex = "11:22:33:44:55:66:77:88:99:AA";
      expect(FingerprintToBase64.encode(hex)).toBe("ESIzRFVmd4iZqg==");
      expect(FingerprintToBase64.decode(FingerprintToBase64.encode(hex))).toBe(hex);
    });

    test("encode output equals standard base64 of the digest bytes (oracle check)", () => {
      // The hand-rolled bit buffer must produce exactly what Node's
      // Buffer produces for the same bytes — for several byte counts that
      // land on different padding cases (1 byte short of a 3-byte group,
      // 2 bytes short, and exact multiples of 3).
      const cases: Array<[string, number]> = [
        [SHA256_HEX, 32],
        ["0A:1B:2C:3D:4E:5F:6A:7B:8C:9D:0E:1F:2A:3B:4C:5D:6E:7F:8A:9B", 20],
        ["11:22:33:44:55:66:77:88:99:AA", 10],
        ["AB:CD:EF", 3],
        ["01:02", 2],
      ];
      for (const [hex, byteCount] of cases) {
        const digest = Buffer.from(hex.replace(/:/g, ""), "hex");
        expect(digest.length).toBe(byteCount);
        expect(FingerprintToBase64.encode(hex)).toBe(digest.toString("base64"));
      }
    });

    test("decode handles '=' padding and case-variant input", () => {
      // "YWJjZA==" is standard base64 of 0x61 0x62 0x63 0x64 — decode
      // must stop at the '=' padding and recover the exact hex.
      expect(FingerprintToBase64.decode("YWJjZA==")).toBe("61:62:63:64");

      // base64 decoding is case-sensitive (charset indices differ), so a
      // case-variant string decodes to DIFFERENT bytes than the original.
      // Both the lower- and upper-cased variants of the sha-256 encoding
      // are valid 6-bit-index sequences; their decoded digests must match
      // what Node's own base64 decoder produces (the reference for the
      // bit-buffer arithmetic), then re-encode canonically.
      const enc = FingerprintToBase64.encode(SHA256_HEX);
      const oracle = (s: string): string =>
        Buffer.from(s, "base64")
          .toString("hex")
          .replace(/(..)/g, "$1:")
          .replace(/:$/, "")
          .toUpperCase();
      for (const variant of [enc, enc.toUpperCase()]) {
        const decoded = FingerprintToBase64.decode(variant);
        expect(decoded).toBe(oracle(variant));
        // Re-encoding the decoded digest must reproduce the canonical
        // base64 of exactly the bytes that variant decodes to.
        expect(FingerprintToBase64.encode(decoded)).toBe(
          Buffer.from(variant, "base64").toString("base64")
        );
      }
    });
  });
});

describe("base92 primitives", () => {
  test("round-trip: empty input", () => {
    expect(uint8ArrayToBase92(new Uint8Array(0))).toBe("");
    expect(Array.from(base92ToUint8Array(""))).toEqual([]);
  });

  test("round-trip: all-zero leading bytes (LEADER repeat path)", () => {
    // Leading 0x00 bytes must encode as leading LEADER chars ('!') and
    // round-trip back to the same leading zero bytes.
    const bytes = new Uint8Array([0x00, 0x00, 0x00, 0xff]);
    const encoded = uint8ArrayToBase92(bytes);
    // Pinned reference: '!!!' + encoding of 0xff.
    expect(encoded).toBe("!!!$j");
    // The leaders are literal '!' (charCode 0x21), i.e. LEADER.repeat(3).
    expect(encoded.slice(0, 3)).toBe("!!!");
    expect([0, 1, 2].map((i) => encoded.charCodeAt(i))).toEqual([0x21, 0x21, 0x21]);
    expectBytesEqual(base92ToUint8Array(encoded), bytes);

    // All-zero input: every byte is a leader.
    const allZero = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00]);
    const encodedZero = uint8ArrayToBase92(allZero);
    expect(encodedZero).toBe("!!!!!");
    expectBytesEqual(base92ToUint8Array(encodedZero), allZero);
  });

  test("known fixed vector: 8-byte sequence", () => {
    const bytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef, 0x00, 0x11, 0x22, 0x33]);
    const encoded = uint8ArrayToBase92(bytes);
    // Pinned reference (computed once and verified against the round-trip).
    expect(encoded).toBe("C}N9t:KgIQ");
    expectBytesEqual(base92ToUint8Array(encoded), bytes);
  });

  test("round-trip: 1KB random bytes", () => {
    const random = crypto.randomBytes(1024);
    const bytes = new Uint8Array(random);
    const encoded = uint8ArrayToBase92(bytes);
    const decoded = base92ToUint8Array(encoded);
    expectBytesEqual(decoded, bytes);
    // Re-encoding the decoded bytes must reproduce the exact same string
    // (canonical encoding: no leading-zero ambiguity introduced).
    expect(uint8ArrayToBase92(decoded)).toBe(encoded);
  });

  test("round-trip: large input (40KB random bytes)", () => {
    // base-x is O(n^2); 100KB takes ~66s (measured) and would dominate the
    // suite, so 40KB (~11s) is the large-input size. The important property
    // here is that multi-KB random payloads survive the big-int division
    // loop and the LEADER/size bookkeeping.
    const random = crypto.randomBytes(40_000);
    const bytes = new Uint8Array(random);
    const encoded = uint8ArrayToBase92(bytes);
    const decoded = base92ToUint8Array(encoded);
    expectBytesEqual(decoded, bytes);
  });
});
