import ExifReader from "exif-reader";
import { Buffer } from "buffer";

export interface GpsPoint {
  latitude: number | null;
  longitude: number | null;
}

const NONE: GpsPoint = { latitude: null, longitude: null };

/**
 * Returns the EXIF payload (starting "Exif\0\0") of a JPEG's APP1 segment, or null.
 * exif-reader parses only that segment - handing it a whole JPEG file throws.
 */
export function jpegExifSegment(bytes: Uint8Array): Uint8Array | null {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null; // not a JPEG
  let i = 2;
  while (i + 4 <= bytes.length) {
    if (bytes[i] !== 0xff) return null;
    const marker = bytes[i + 1];
    if (marker === 0xda || marker === 0xd9) return null; // image data / end: no EXIF before it
    const length = (bytes[i + 2] << 8) | bytes[i + 3]; // includes the two length bytes
    const isExif = marker === 0xe1 && bytes[i + 4] === 0x45 && bytes[i + 5] === 0x78 && bytes[i + 6] === 0x69 && bytes[i + 7] === 0x66;
    if (isExif) return bytes.subarray(i + 4, i + 2 + length);
    i += 2 + length;
  }
  return null;
}

// EXIF stores coordinates as [degrees, minutes, seconds] plus an N/S/E/W reference.
function toDecimal(dms: number[] | undefined, ref: string | undefined): number | null {
  if (!dms || dms.length < 3 || dms.some((n) => !Number.isFinite(n))) return null;
  const value = dms[0] + dms[1] / 60 + dms[2] / 3600;
  return ref === "S" || ref === "W" ? -value : value;
}

/** GPS coordinates embedded in a JPEG photo, or nulls when there are none. */
export function gpsFromImage(bytes: Uint8Array): GpsPoint {
  const segment = jpegExifSegment(bytes);
  if (!segment) return NONE;
  try {
    const gps = ExifReader(Buffer.from(segment)).GPSInfo;
    return {
      latitude: toDecimal(gps?.GPSLatitude, gps?.GPSLatitudeRef),
      longitude: toDecimal(gps?.GPSLongitude, gps?.GPSLongitudeRef),
    };
  } catch {
    return NONE;
  }
}
