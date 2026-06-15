// Nominatim (OpenStreetMap) reverse geocoding — free, no key required.
// Rate limit: 1 req/s max. Called only on user click, so well within limits.
// https://nominatim.org/release-docs/latest/api/Reverse/

const NOMINATIM = 'https://nominatim.openstreetmap.org/reverse';

interface NominatimResponse {
  name?: string;
  display_name?: string;
  address?: {
    city?: string;
    town?: string;
    county?: string;
    state?: string;
    country?: string;
    [k: string]: string | undefined;
  };
}

/** Reverse-geocode a point to a human-readable place name (Chinese preferred). */
export async function reverseGeocode(lng: number, lat: number): Promise<string> {
  try {
    const url = `${NOMINATIM}?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10`;
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.1',
        // Nominatim policy requires identifying User-Agent
        'User-Agent': '地理纵深/1.0 (geography-depth; educational; ealice1002@gmail.com)',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = (await res.json()) as NominatimResponse;

    // Prefer the feature's own name if it's meaningful (not just coordinates)
    if (data.name && data.name.trim() && !/^\d/.test(data.name)) {
      return data.name.trim();
    }

    // Build a concise name from address components
    const a = data.address ?? {};
    const locality = a.city ?? a.town ?? a.county ?? a.state ?? '';
    const country  = a.country ?? '';
    if (locality && country) return `${locality} · ${country}`;
    if (locality) return locality;
    if (country)  return country;

    // Last resort: the full display_name from Nominatim (may be verbose)
    if (data.display_name) return data.display_name.split(',')[0]?.trim() ?? coordLabel(lng, lat);
  } catch {
    // Network error or parse failure — fall through to coord label
  }
  return coordLabel(lng, lat);
}

function coordLabel(lng: number, lat: number): string {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(2)}°${ns}, ${Math.abs(lng).toFixed(2)}°${ew}`;
}
