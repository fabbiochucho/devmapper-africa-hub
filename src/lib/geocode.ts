
export type GeocodeResult = {
  country: string;
  country_code: string;
};

export const reverseGeocode = (lat: number, lng: number): GeocodeResult | null => {
  if (isNaN(lat) || isNaN(lng)) {
    return null;
  }

  // Simple reverse geocoding for African countries based on coordinates
  // Note: These are rough bounding boxes and not precise.
  if (lat > -5 && lat < 5 && lng > 33 && lng < 42) {
    return { country: "Kenya", country_code: "KEN" };
  }
  if (lat > 4 && lat < 14 && lng > 2 && lng < 15) {
    return { country: "Nigeria", country_code: "NGA" };
  }
  if (lat > -35 && lat < -22 && lng > 16 && lng < 33) {
    return { country: "South Africa", country_code: "ZAF" };
  }
  if (lat > 4 && lat < 12 && lng > -4 && lng < 2) {
    return { country: "Ghana", country_code: "GHA" };
  }
  if (lat > 3 && lat < 15 && lng > 33 && lng < 48) {
    return { country: "Ethiopia", country_code: "ETH" };
  }
  if (lat > -3 && lat < -1 && lng > 28 && lng < 31) {
    return { country: "Rwanda", country_code: "RWA" };
  }
  if (lat > -2 && lat < 5 && lng > 29 && lng < 35) {
    return { country: "Uganda", country_code: "UGA" };
  }
  if (lat > -12 && lat < -1 && lng > 29 && lng < 41) {
    return { country: "Tanzania", country_code: "TZA" };
  }

  return null;
};
