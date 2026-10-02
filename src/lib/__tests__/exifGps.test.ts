import { describe, it, expect } from "vitest";
import { gpsFromImage, jpegExifSegment } from "../exifGps";

// Builds a minimal little-endian TIFF with a GPS IFD: 5°36'13.32"N, 0°11'13.2"W (Accra).
function tiffWithGps(): number[] {
  const out: number[] = [];
  const u16 = (v: number) => out.push(v & 0xff, (v >> 8) & 0xff);
  const u32 = (v: number) => out.push(v & 0xff, (v >> 8) & 0xff, (v >> 16) & 0xff, (v >>> 24) & 0xff);
  // header
  out.push(0x49, 0x49); u16(42); u32(8);
  // IFD0 @8: one entry, GPSTag -> GPS IFD @26
  u16(1); u16(0x8825); u16(4); u32(1); u32(26); u32(0);
  // GPS IFD @26: 4 entries (2 + 4*12 + 4 = 54 bytes) -> rationals start @80
  u16(4);
  u16(1); u16(2); u32(2); out.push(0x4e, 0, 0, 0);          // GPSLatitudeRef "N"
  u16(2); u16(5); u32(3); u32(80);                          // GPSLatitude -> @80
  u16(3); u16(2); u32(2); out.push(0x57, 0, 0, 0);          // GPSLongitudeRef "W"
  u16(4); u16(5); u32(3); u32(104);                         // GPSLongitude -> @104
  u32(0);
  // rationals: lat 5/1, 36/1, 1332/100 ; lon 0/1, 11/1, 132/10
  for (const [n, d] of [[5, 1], [36, 1], [1332, 100], [0, 1], [11, 1], [132, 10]]) { u32(n); u32(d); }
  return out;
}

function jpegWith(tiff: number[]): Uint8Array {
  const payload = [0x45, 0x78, 0x69, 0x66, 0, 0, ...tiff]; // "Exif\0\0" + TIFF
  const len = payload.length + 2;
  return new Uint8Array([0xff, 0xd8, 0xff, 0xe1, len >> 8, len & 0xff, ...payload, 0xff, 0xd9]);
}

describe("gpsFromImage", () => {
  it("reads signed decimal coordinates from a JPEG's EXIF GPS tags", () => {
    const { latitude, longitude } = gpsFromImage(jpegWith(tiffWithGps()));
    expect(latitude).toBeCloseTo(5.6037, 4);
    expect(longitude).toBeCloseTo(-0.187, 4);
  });

  it("returns nulls for images without EXIF and for non-JPEG data", () => {
    expect(gpsFromImage(new Uint8Array([0xff, 0xd8, 0xff, 0xd9]))).toEqual({ latitude: null, longitude: null });
    expect(gpsFromImage(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toEqual({ latitude: null, longitude: null });
    expect(jpegExifSegment(new Uint8Array([1, 2, 3]))).toBeNull();
  });
});
