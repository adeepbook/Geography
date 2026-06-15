import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import type { LocationScript } from '../../types';
import { locationColor, tagColor } from '../../lib/tagColors';
import type { StyleUrl } from '../../config/mapStyles';

// GeoJSON source / layer IDs for pins
const PINS_SOURCE = 'geo-pins';
const PINS_LAYER  = 'geo-pins-circle';

// Chinese name: zh-Hans → zh → latin → fallback
const ZH_LABEL: maplibregl.ExpressionSpecification = [
  'coalesce',
  ['get', 'name:zh-Hans'],
  ['get', 'name:zh'],
  ['get', 'name:latin'],
  ['get', 'name'],
];

// Source-layers whose text labels we hide entirely
const HIDDEN_SRC_LAYERS = new Set([
  'transportation_name', 'transportation', 'poi_label', 'poi',
  'road', 'road_label',
]);

const HIDE_LAYER_KEYWORDS = [
  'road', 'highway', 'motorway', 'trunk', 'primary', 'secondary',
  'rail', 'transit', 'airport', 'aerodrome',
  'poi', 'shop', 'park',
  'suburb', 'neighbourhood', 'neighborhood', 'quarter',
  'hamlet', 'village', 'town',
];

export interface MapClickPayload {
  id: string | null;
  allIds: string[];
  lngLat: [number, number];
}

interface Props {
  locations: LocationScript[];
  selectedId: string | null;
  onSelect: (payload: MapClickPayload) => void;
  styleUrl: StyleUrl;
}

function uniqueTags(locations: LocationScript[]): string[] {
  const seen = new Set<string>();
  for (const loc of locations) for (const t of loc.类型标签) seen.add(t);
  return Array.from(seen);
}

function buildGeoJSON(locations: LocationScript[], hiddenTags: Set<string>) {
  return {
    type: 'FeatureCollection' as const,
    features: locations
      .filter(loc => !loc.类型标签.every(t => hiddenTags.has(t)))
      .map(loc => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [loc.坐标[1], loc.坐标[0]] as [number, number],
        },
        properties: {
          id: loc.地点ID,
          name: loc.名称,
          color: locationColor(loc.类型标签),
        },
      })),
  };
}

// Switch symbol layers to Chinese names; hide road / minor-place labels.
// Safe to call on raster-only styles (no symbol layers → no-op).
function tweakLabels(map: maplibregl.Map) {
  const layers = map.getStyle().layers ?? [];
  for (const layer of layers) {
    if (layer.type !== 'symbol') continue;
    const srcLayer = ((layer as Record<string, unknown>)['source-layer'] as string | undefined) ?? '';
    const lid = layer.id.toLowerCase();

    const shouldHide =
      HIDDEN_SRC_LAYERS.has(srcLayer) ||
      HIDE_LAYER_KEYWORDS.some(k => lid.includes(k));

    if (shouldHide) {
      try { map.setLayoutProperty(layer.id, 'visibility', 'none'); } catch { /* skip */ }
      continue;
    }

    try {
      const tf = map.getLayoutProperty(layer.id, 'text-field');
      if (tf != null && tf !== '') {
        map.setLayoutProperty(layer.id, 'text-field', ZH_LABEL);
      }
    } catch { /* skip */ }

    try {
      map.setPaintProperty(layer.id, 'text-halo-width', 1);
      map.setPaintProperty(layer.id, 'text-halo-blur', 0.5);
    } catch { /* skip */ }
  }
}

export default function WorldMap({ locations, selectedId, onSelect, styleUrl }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<maplibregl.Map | null>(null);
  const onSelectRef  = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Always-current refs so style.load closure sees latest values
  const locationsRef  = useRef(locations);
  const hiddenTagsRef = useRef<Set<string>>(new Set());
  const selectedIdRef = useRef(selectedId);
  locationsRef.current  = locations;
  selectedIdRef.current = selectedId;

  // Becomes true after the first style.load; guards the style-change effect
  const mapInitializedRef = useRef(false);

  const tags = uniqueTags(locations);
  const [hiddenTags, setHiddenTags] = useState<Set<string>>(new Set());
  hiddenTagsRef.current = hiddenTags;

  // ── Init map (once) ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      style: styleUrl as any,
      center: [20, 15],
      zoom: 1.6,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'bottom-right');

    // Map-level click registered ONCE — survives style changes
    map.on('click', (e) => {
      const hits = map.queryRenderedFeatures(e.point, { layers: [PINS_LAYER] });
      const allIds = hits.map(h => String(h.properties?.id ?? '')).filter(Boolean);
      onSelectRef.current({ id: allIds[0] ?? null, allIds, lngLat: [e.lngLat.lng, e.lngLat.lat] });
    });

    // Stable hover function references so we can safely off/on after each style change
    const onEnterPin = () => { map.getCanvas().style.cursor = 'pointer'; };
    const onLeavePin = () => { map.getCanvas().style.cursor = ''; };

    // style.load fires on initial load AND after every setStyle call
    map.on('style.load', () => {
      mapInitializedRef.current = true;

      tweakLabels(map);

      // Re-add GeoJSON source + circle layer (removed when style changes)
      if (!map.getSource(PINS_SOURCE)) {
        map.addSource(PINS_SOURCE, {
          type: 'geojson',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: buildGeoJSON(locationsRef.current, hiddenTagsRef.current) as any,
        });
      }
      if (!map.getLayer(PINS_LAYER)) {
        map.addLayer({
          id: PINS_LAYER,
          type: 'circle',
          source: PINS_SOURCE,
          paint: {
            'circle-radius': 7,
            'circle-color': ['get', 'color'],
            'circle-stroke-width': 2.5,
            'circle-stroke-color': '#ffffff',
          },
        });
      }

      // Remove stale hover listeners then re-add (safe to off non-existent handlers)
      map.off('mouseenter', PINS_LAYER, onEnterPin);
      map.off('mouseleave', PINS_LAYER, onLeavePin);
      map.on('mouseenter', PINS_LAYER, onEnterPin);
      map.on('mouseleave', PINS_LAYER, onLeavePin);

      // Re-apply selected-pin highlight after style change
      const sid = selectedIdRef.current ?? '';
      map.setPaintProperty(PINS_LAYER, 'circle-radius',
        ['case', ['==', ['get', 'id'], sid], 12, 7]);
      map.setPaintProperty(PINS_LAYER, 'circle-stroke-width',
        ['case', ['==', ['get', 'id'], sid], 3.5, 2.5]);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      mapInitializedRef.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Style switching ──────────────────────────────────────────────────────────
  // Skip on mount (map is already initialized with styleUrl from the constructor).
  // map.isStyleLoaded() is false until the first style.load, which prevents
  // double-loading on mount.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapInitializedRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.setStyle(styleUrl as any);
  }, [styleUrl]);

  // ── Sync filter → GeoJSON data ───────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const src = map.getSource(PINS_SOURCE) as maplibregl.GeoJSONSource | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    src?.setData(buildGeoJSON(locations, hiddenTags) as any);
  }, [hiddenTags, locations]);

  // ── Sync selected pin highlight ──────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer(PINS_LAYER)) return;
    const sid = selectedId ?? '';
    map.setPaintProperty(PINS_LAYER, 'circle-radius',
      ['case', ['==', ['get', 'id'], sid], 12, 7]);
    map.setPaintProperty(PINS_LAYER, 'circle-stroke-width',
      ['case', ['==', ['get', 'id'], sid], 3.5, 2.5]);
  }, [selectedId]);

  function toggleTag(tag: string) {
    setHiddenTags(prev => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Map canvas */}
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />

      {/* Filter bar — left offset leaves room for the toolbar in App.tsx */}
      <div style={{
        position: 'absolute', top: 14, left: 150, zIndex: 10,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(8px)',
        borderRadius: 10,
        padding: '8px 12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.14)',
        display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
        maxWidth: 420,
      }}>
        <span style={{
          fontSize: 11, fontWeight: 600, color: '#78716C',
          letterSpacing: '0.06em', textTransform: 'uppercase', marginRight: 4,
        }}>
          筛选
        </span>
        {tags.map(tag => {
          const hidden = hiddenTags.has(tag);
          const color  = tagColor(tag);
          return (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '3px 9px', borderRadius: 20,
                border: `1.5px solid ${color}`,
                background: hidden ? 'transparent' : color,
                color: hidden ? color : '#fff',
                fontSize: 11, fontWeight: 600,
                cursor: 'pointer',
                opacity: hidden ? 0.5 : 1,
                transition: 'all 0.15s',
              }}
            >
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: hidden ? color : '#fff',
                display: 'inline-block', flexShrink: 0,
              }} />
              {tag}
            </button>
          );
        })}
      </div>

      {/* Brand label — bottom-left, above attribution bar */}
      <div style={{
        position: 'absolute', bottom: 30, left: 14, zIndex: 10,
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(6px)',
        borderRadius: 8, padding: '6px 12px',
        boxShadow: '0 1px 6px rgba(0,0,0,0.10)',
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#1C1917', letterSpacing: '0.03em' }}>
          地理纵深
        </span>
        <span style={{ fontSize: 11, color: '#78716C', marginLeft: 8 }}>
          点击任意位置探索地点
        </span>
      </div>
    </div>
  );
}
