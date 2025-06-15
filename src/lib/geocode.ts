
export type GeocodeResult = {
  country: string;
  country_code: string;
};

export const reverseGeocode = async (lat: number, lng: number): Promise<GeocodeResult | null> => {
  if (isNaN(lat) || isNaN(lng)) {
    return null;
  }

  // Use Nominatim for reverse geocoding, as inspired by your example
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=3&addressdetails=1`;

  try {
    const response = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    if (!response.ok) {
      console.error("Failed to fetch from Nominatim:", response.status, response.statusText);
      return null;
    }
    const data = await response.json();

    if (data && data.address && data.address.country && data.address.country_code) {
      return {
        country: data.address.country,
        country_code: data.address.country_code.toUpperCase(),
      };
    }
    return null;
  } catch (error) {
    console.error("Error during reverse geocoding:", error);
    return null;
  }
};
