export interface MapStyleDef {
  id: string;
  name: string;
  provider: 'ofm' | 'esri' | 'maptiler';
  needsKey: boolean;
  palette: [string, string, string];
}

export const MAP_STYLES: MapStyleDef[] = [
  // Free — no key required
  { id: 'ofm-liberty',  name: 'Liberty（默认）', provider: 'ofm',      needsKey: false, palette: ['#F4EEE2', '#A8C5DA', '#5C8DB8'] },
  { id: 'ofm-bright',   name: 'Bright',          provider: 'ofm',      needsKey: false, palette: ['#FFFFFF', '#C8E0B8', '#5596CC'] },
  { id: 'ofm-positron', name: 'Positron',        provider: 'ofm',      needsKey: false, palette: ['#F5F5F3', '#D9D9D1', '#6CB8D4'] },
  { id: 'ofm-dark',     name: 'Dark',            provider: 'ofm',      needsKey: false, palette: ['#1A1A2E', '#2A3A4A', '#4EADCF'] },
  { id: 'esri-sat',     name: '卫星影像',         provider: 'esri',     needsKey: false, palette: ['#2D5A27', '#1A3A5C', '#7D6C55'] },
  // MapTiler — needs API key
  { id: 'mt-hybrid',    name: '卫星混合',         provider: 'maptiler', needsKey: true,  palette: ['#2D5A27', '#1A3A5C', '#E8D88A'] },
  { id: 'mt-outdoor',   name: '户外地形',         provider: 'maptiler', needsKey: true,  palette: ['#E8EFD8', '#B8D4A8', '#8B6B4E'] },
  { id: 'mt-streets',   name: '街道',            provider: 'maptiler', needsKey: true,  palette: ['#F8F4EE', '#D5C9B8', '#E08040'] },
  { id: 'mt-satellite', name: '纯卫星',           provider: 'maptiler', needsKey: true,  palette: ['#355228', '#1C3A5E', '#6B7C5D'] },
];

// Stable module-level constant so React's Object.is comparison sees no change across renders
export const ESRI_SATELLITE_STYLE = {
  version: 8 as const,
  sources: {
    'esri-imagery': {
      type: 'raster' as const,
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: '© Esri, Maxar, Earthstar Geographics and the GIS User Community',
    },
  },
  layers: [{ id: 'esri-imagery-layer', type: 'raster' as const, source: 'esri-imagery' }],
};

const OFM = 'https://tiles.openfreemap.org/styles';
const MT  = 'https://api.maptiler.com/maps';

export type StyleUrl = string | typeof ESRI_SATELLITE_STYLE;

export function resolveStyleUrl(styleId: string, mapTilerKey = ''): StyleUrl {
  switch (styleId) {
    case 'ofm-liberty':  return `${OFM}/liberty`;
    case 'ofm-bright':   return `${OFM}/bright`;
    case 'ofm-positron': return `${OFM}/positron`;
    case 'ofm-dark':     return `${OFM}/dark`;
    case 'esri-sat':     return ESRI_SATELLITE_STYLE; // stable reference
    case 'mt-hybrid':    return `${MT}/hybrid/style.json?key=${mapTilerKey}`;
    case 'mt-outdoor':   return `${MT}/outdoor/style.json?key=${mapTilerKey}`;
    case 'mt-streets':   return `${MT}/streets/style.json?key=${mapTilerKey}`;
    case 'mt-satellite': return `${MT}/satellite/style.json?key=${mapTilerKey}`;
    default:             return `${OFM}/liberty`;
  }
}
