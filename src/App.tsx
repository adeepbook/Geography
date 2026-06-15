import { useState, useRef, useMemo } from 'react';
import { loadLocations, loadProcesses } from './lib/content';
import { reverseGeocode } from './lib/geocoding';
import { useAISettings } from './hooks/useAISettings';
import { useMapSettings } from './hooks/useMapSettings';
import { resolveStyleUrl } from './config/mapStyles';
import { loadNotes, saveNotes, makeEntry } from './lib/notes';
import { getCachedCard, setCachedCard, aiCardCacheKey } from './lib/cardCache';
import { generateAICard } from './lib/aiGenCard';
import type { NotesData } from './lib/notes';
import type { AILocationCard, LocationScript, ProcessModule } from './types';
import WorldMap, { type MapClickPayload } from './components/WorldMap';
import KnowledgeCard from './components/KnowledgeCard';
import AIAssistant from './components/AIAssistant';
import SettingsModal from './components/AISettings';
import NotesPanel from './components/NotesPanel';
import type { SaveNotePayload } from './components/NotesPanel';

// ---------------------------------------------------------------------------
// Content — loaded once at module level
// ---------------------------------------------------------------------------
const { items: locations, errorCount: locErrors } = loadLocations();
const { items: modules,   errorCount: modErrors } = loadProcesses();
const totalErrors = locErrors + modErrors;
const moduleMap  = new Map<string, ProcessModule>(modules.map((m) => [m.模块ID, m]));
const moduleIds  = modules.map((m) => m.模块ID);

// ---------------------------------------------------------------------------
// Panel state types
// ---------------------------------------------------------------------------

interface Candidate {
  key: string;
  label: string;
  isYaml: boolean;
  locationId?: string;
}

type CardPhase =
  | { type: 'yaml' }
  | { type: 'ai-no-key' }
  | { type: 'ai-loading' }
  | { type: 'ai-ready';    card: AILocationCard }
  | { type: 'ai-fallback'; text: string }
  | { type: 'ai-error';    message: string };

interface PanelState {
  lngLat: [number, number];
  placeName: string | null;
  candidates: Candidate[];
  activeKey: string;
  phase: CardPhase;
}

// ---------------------------------------------------------------------------
// Small inline UI pieces
// ---------------------------------------------------------------------------

function AICardLoading({ name }: { name: string }) {
  return (
    <div style={{
      background: '#FFFBF0', borderRadius: 14,
      border: '1px solid #FDE68A',
      padding: '20px 24px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 18, height: 18, borderRadius: '50%',
          border: '2.5px solid #E5E2DC', borderTopColor: '#78716C',
          flexShrink: 0,
          animation: 'spin 0.8s linear infinite',
        }} />
        <span style={{ fontSize: 13, color: '#57534E' }}>
          正在为「{name}」生成知识卡…
        </span>
      </div>
      {[70, 45, 60, 38, 52].map((w, i) => (
        <div key={i} style={{
          height: 9, borderRadius: 5,
          background: '#F4D793',
          marginBottom: 10, width: `${w}%`,
          animation: `card-shimmer 1.6s ease-in-out ${i * 0.15}s infinite`,
        }} />
      ))}
    </div>
  );
}

function AIFallback({ text }: { text: string }) {
  return (
    <div style={{
      background: '#FFFBF0', borderRadius: 14,
      border: '1px solid #FDE68A', padding: '16px 20px',
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#92600A', marginBottom: 8 }}>
        ⚡ AI 回复（未能解析为结构化卡）
      </div>
      <div style={{ fontSize: 13, color: '#292524', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
        {text}
      </div>
    </div>
  );
}

function AIErrorMsg({ message }: { message: string }) {
  return (
    <div style={{
      background: '#FEF2F2', borderRadius: 14,
      border: '1px solid #FECACA', padding: '16px 20px',
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#B91C1C', marginBottom: 4 }}>
        生成失败
      </div>
      <div style={{ fontSize: 12, color: '#B91C1C' }}>{message}</div>
    </div>
  );
}

function NoKeyNudge({ onOpen }: { onOpen: () => void }) {
  return (
    <div style={{
      background: '#FFFBEB', border: '1px solid #FDE68A',
      borderRadius: 14, padding: '20px 24px',
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#92600A', marginBottom: 6 }}>
        需要 AI 生成知识卡
      </div>
      <p style={{ margin: '0 0 14px', fontSize: 13, color: '#78716C', lineHeight: 1.6 }}>
        这里没有已核对的精选内容。请先配置 AI 接口，即可由大模型推测生成一张未核对知识卡。
      </p>
      <button
        onClick={onOpen}
        style={{
          padding: '7px 14px', borderRadius: 8,
          border: '1.5px solid #F59E0B', background: '#FFFBEB',
          color: '#92600A', fontSize: 12, fontWeight: 600, cursor: 'pointer',
        }}
      >
        ⚙ 配置 AI 接口
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  const [panel, setPanel] = useState<PanelState | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState<NotesData>(() => loadNotes());

  const { settings: aiSettings, save: saveAISettings } = useAISettings();
  const { settings: mapSettings, save: saveMapSettings } = useMapSettings();

  // Tracks the map style currently shown (may differ from saved mapSettings
  // while the settings modal is open for live preview)
  const [previewStyleId, setPreviewStyleId] = useState(() => mapSettings.styleId);

  // Resolved style URL/object; useMemo keeps the ESRI object reference stable
  const activeStyleUrl = useMemo(
    () => resolveStyleUrl(previewStyleId, mapSettings.mapTilerKey),
    [previewStyleId, mapSettings.mapTilerKey],
  );

  // Keep AI settings fresh inside async callbacks without re-registering map listeners
  const aiSettingsRef = useRef(aiSettings);
  aiSettingsRef.current = aiSettings;

  // Abort controller for in-flight AI generation
  const abortRef = useRef<AbortController | null>(null);

  // ── Notes helpers ─────────────────────────────────────────────────────────

  function handleSaveNote(payload: SaveNotePayload) {
    const entry = makeEntry(payload);
    const updated: NotesData = { ...notes, entries: [...notes.entries, entry] };
    setNotes(updated);
    saveNotes(updated);
    setShowNotes(true);
  }

  function handleUpdateNotes(updated: NotesData) {
    setNotes(updated);
    saveNotes(updated);
  }

  // ── Settings modal handlers ───────────────────────────────────────────────

  function handleSaveSettings(ai: typeof aiSettings, map: typeof mapSettings) {
    saveAISettings(ai);
    saveMapSettings(map);
    setPreviewStyleId(map.styleId);  // confirm the previewed style
    setShowSettings(false);
  }

  function handleCancelSettings() {
    setPreviewStyleId(mapSettings.styleId);  // revert to last saved style
    setShowSettings(false);
  }

  function handlePreviewStyle(styleId: string) {
    setPreviewStyleId(styleId);
  }

  // ── AI card generation ────────────────────────────────────────────────────

  async function triggerAIGen(name: string, lngLat: [number, number]) {
    const cfg = aiSettingsRef.current;

    if (!cfg.apiKey) {
      setPanel((p) => p ? { ...p, phase: { type: 'ai-no-key' } } : null);
      return;
    }

    const key = aiCardCacheKey(lngLat);
    const cached = getCachedCard(key);
    if (cached) {
      setPanel((p) => p ? { ...p, phase: { type: 'ai-ready', card: cached } } : null);
      return;
    }

    setPanel((p) => p ? { ...p, phase: { type: 'ai-loading' } } : null);

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const result = await generateAICard(name, lngLat, cfg, moduleIds, ac.signal);
      setPanel((p) => {
        if (!p || p.lngLat[0] !== lngLat[0] || p.lngLat[1] !== lngLat[1]) return p;
        if (result.ok) {
          setCachedCard(key, result.card);
          return { ...p, phase: { type: 'ai-ready', card: result.card } };
        }
        return { ...p, phase: { type: 'ai-fallback', text: result.fallbackText } };
      });
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setPanel((p) => {
          if (!p || p.lngLat[0] !== lngLat[0] || p.lngLat[1] !== lngLat[1]) return p;
          return { ...p, phase: { type: 'ai-error', message: (err as Error).message } };
        });
      }
    }
  }

  // ── Map click handler ─────────────────────────────────────────────────────

  async function handleMapClick({ allIds, lngLat }: MapClickPayload) {
    abortRef.current?.abort();

    const candidates: Candidate[] = allIds.map((hitId) => {
      const loc = locations.find((l) => l.地点ID === hitId);
      return loc
        ? { key: `yaml_${hitId}`, label: loc.名称,  isYaml: true,  locationId: hitId }
        : { key: `pin_${hitId}`,  label: hitId,     isYaml: false };
    });

    candidates.push({ key: 'geo', label: '定位中…', isYaml: false });

    const defaultCand = candidates.find((c) => c.isYaml) ?? candidates[candidates.length - 1];
    const defaultKey  = defaultCand.key;
    const defaultIsYaml = defaultCand.isYaml;

    const initialPhase: CardPhase = defaultIsYaml
      ? { type: 'yaml' }
      : aiSettingsRef.current.apiKey
        ? { type: 'ai-loading' }
        : { type: 'ai-no-key' };

    setPanel({ lngLat, placeName: null, candidates, activeKey: defaultKey, phase: initialPhase });

    const name = await reverseGeocode(lngLat[0], lngLat[1]);

    setPanel((p) => {
      if (!p || p.lngLat[0] !== lngLat[0] || p.lngLat[1] !== lngLat[1]) return p;
      const updatedCands = p.candidates.map((c) =>
        c.key === 'geo' ? { ...c, label: name ?? '附近地区' } : c,
      );
      return { ...p, placeName: name, candidates: updatedCands };
    });

    if (!defaultIsYaml) {
      await triggerAIGen(
        name ?? `${Math.abs(lngLat[1]).toFixed(2)}°, ${Math.abs(lngLat[0]).toFixed(2)}°`,
        lngLat,
      );
    }
  }

  // ── Subject picker handler ────────────────────────────────────────────────

  async function handleSelectCandidate(key: string) {
    if (!panel) return;
    const cand = panel.candidates.find((c) => c.key === key);
    if (!cand) return;

    if (cand.isYaml) {
      setPanel((p) => p ? { ...p, activeKey: key, phase: { type: 'yaml' } } : null);
      return;
    }

    setPanel((p) => p ? { ...p, activeKey: key } : null);
    const name = cand.label !== '定位中…' ? cand.label : (panel.placeName ?? '');
    await triggerAIGen(
      name || `${Math.abs(panel.lngLat[1]).toFixed(2)}°, ${Math.abs(panel.lngLat[0]).toFixed(2)}°`,
      panel.lngLat,
    );
  }

  // ── Derived values ────────────────────────────────────────────────────────

  const activeCand = panel?.candidates.find((c) => c.key === panel.activeKey);
  const activeYamlLoc: LocationScript | undefined = activeCand?.isYaml && activeCand.locationId
    ? locations.find((l) => l.地点ID === activeCand.locationId)
    : undefined;

  const activeCard: LocationScript | AILocationCard | undefined =
    panel?.phase.type === 'ai-ready' ? panel.phase.card : activeYamlLoc;

  const displayName: string = (() => {
    if (!panel) return '';
    if (panel.phase.type === 'ai-ready') return panel.phase.card.名称;
    return panel.placeName ?? '定位中…';
  })();

  const panelOpen  = panel !== null;
  const showPicker = (panel?.candidates.length ?? 0) > 2;

  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
      {/* Error banner */}
      {totalErrors > 0 && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
          background: '#FEF9EE', borderBottom: '1px solid #F4D793',
          padding: '6px 16px', fontSize: 12, color: '#92600A',
        }}>
          ⚠ 加载时跳过 {totalErrors} 个失败项，详见控制台
        </div>
      )}

      {/* Full-viewport map */}
      <WorldMap
        locations={locations}
        selectedId={activeCand?.locationId ?? null}
        onSelect={handleMapClick}
        styleUrl={activeStyleUrl}
      />

      {/* ── Unified top-left toolbar: Notes + Settings ── */}
      <div style={{
        position: 'absolute', top: 14, left: 14, zIndex: 20,
        display: 'flex', gap: 6, alignItems: 'center',
      }}>
        {/* Notes toggle */}
        <button
          onClick={() => setShowNotes((v) => !v)}
          title="我的笔记"
          style={{
            height: 34, padding: '0 12px', borderRadius: 8,
            background: showNotes ? '#1C1917' : 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(6px)',
            border: `1.5px solid ${showNotes ? '#1C1917' : '#D6D3CE'}`,
            cursor: 'pointer', fontSize: 12, fontWeight: 600,
            color: showNotes ? '#F9F8F5' : '#57534E',
            display: 'flex', alignItems: 'center', gap: 5,
            boxShadow: '0 1px 6px rgba(0,0,0,0.10)',
            transition: 'background 0.18s, color 0.18s, border-color 0.18s',
          }}
        >
          ✏ 笔记
          {notes.entries.length > 0 && (
            <span style={{
              background: showNotes ? 'rgba(255,255,255,0.25)' : '#E5E2DC',
              color: showNotes ? '#fff' : '#57534E',
              borderRadius: 10, fontSize: 10, padding: '0 5px',
              lineHeight: '16px', minWidth: 16, textAlign: 'center',
            }}>
              {notes.entries.length}
            </span>
          )}
        </button>

        {/* Settings button */}
        <button
          onClick={() => setShowSettings(true)}
          title="设置"
          style={{
            width: 34, height: 34, borderRadius: 8,
            background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(6px)',
            border: '1.5px solid #D6D3CE', cursor: 'pointer', fontSize: 15, color: '#57534E',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 1px 6px rgba(0,0,0,0.10)',
          }}
        >⚙</button>
      </div>

      {/* Notes panel */}
      <NotesPanel
        open={showNotes}
        onClose={() => setShowNotes(false)}
        notes={notes}
        onUpdate={handleUpdateNotes}
      />

      {/* Right side panel */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0,
        width: 520,
        background: '#F2F0EB',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.14)',
        overflowY: 'auto',
        zIndex: 30,
        transform: panelOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
      }}>
        {panelOpen && (
          <>
            {/* Sticky close strip */}
            <div style={{
              position: 'sticky', top: 0, zIndex: 5,
              display: 'flex', justifyContent: 'flex-end',
              padding: '12px 12px 4px',
              background: 'linear-gradient(to bottom, #F2F0EB 70%, transparent)',
            }}>
              <button
                onClick={() => { abortRef.current?.abort(); setPanel(null); }}
                style={{
                  width: 30, height: 30, borderRadius: '50%',
                  border: '1px solid #D6D3CE', background: '#fff',
                  cursor: 'pointer', fontSize: 18, color: '#78716C', lineHeight: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                }}
                aria-label="关闭"
              >×</button>
            </div>

            {/* Subject picker */}
            {showPicker && (
              <div style={{
                display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6,
                padding: '8px 14px 10px',
                borderBottom: '1px solid #E5E2DC',
                background: '#F7F5F2',
              }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>
                  选择主体
                </span>
                {panel.candidates
                  .filter((c) => c.key !== 'geo' || c.label !== '定位中…')
                  .map((cand) => {
                    const active = cand.key === panel.activeKey;
                    return (
                      <button
                        key={cand.key}
                        onClick={() => handleSelectCandidate(cand.key)}
                        style={{
                          padding: '4px 10px', borderRadius: 6,
                          border: `1.5px solid ${active ? '#1C1917' : '#D6D3CE'}`,
                          background: active ? '#1C1917' : '#fff',
                          color: active ? '#fff' : '#57534E',
                          fontSize: 11, cursor: 'pointer',
                          fontWeight: active ? 600 : 400,
                        }}
                      >
                        {cand.label}
                        {cand.isYaml && (
                          <span style={{ marginLeft: 4, fontSize: 9, opacity: 0.7 }}>精选</span>
                        )}
                      </button>
                    );
                  })}
              </div>
            )}

            <div style={{ padding: '4px 14px 40px' }}>
              {/* Place header — only when no card is shown */}
              {panel.phase.type !== 'yaml' && panel.phase.type !== 'ai-ready' && (
                <div style={{ marginBottom: 12 }}>
                  <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#1C1917', lineHeight: 1.3 }}>
                    {displayName}
                  </h2>
                  <p style={{ margin: 0, fontSize: 12, color: '#A8A29E' }}>
                    {Math.abs(panel.lngLat[1]).toFixed(4)}°{panel.lngLat[1] >= 0 ? 'N' : 'S'},&nbsp;
                    {Math.abs(panel.lngLat[0]).toFixed(4)}°{panel.lngLat[0] >= 0 ? 'E' : 'W'}
                  </p>
                </div>
              )}

              {/* Card content */}
              {panel.phase.type === 'yaml' && activeYamlLoc && (
                <KnowledgeCard card={activeYamlLoc} moduleMap={moduleMap} onSaveNote={handleSaveNote} />
              )}
              {panel.phase.type === 'ai-loading' && (
                <AICardLoading name={panel.placeName ?? '该地点'} />
              )}
              {panel.phase.type === 'ai-ready' && (
                <KnowledgeCard card={panel.phase.card} moduleMap={moduleMap} onSaveNote={handleSaveNote} />
              )}
              {panel.phase.type === 'ai-fallback' && (
                <AIFallback text={panel.phase.text} />
              )}
              {panel.phase.type === 'ai-error' && (
                <AIErrorMsg message={panel.phase.message} />
              )}
              {panel.phase.type === 'ai-no-key' && (
                <NoKeyNudge onOpen={() => setShowSettings(true)} />
              )}

              {/* AI Assistant */}
              <AIAssistant
                key={`${panel.lngLat[0].toFixed(5)}_${panel.lngLat[1].toFixed(5)}`}
                placeName={displayName}
                lngLat={panel.lngLat}
                location={activeCard}
                settings={aiSettings}
                onOpenSettings={() => setShowSettings(true)}
                onSaveNote={handleSaveNote}
              />
            </div>
          </>
        )}
      </div>

      {/* Settings modal */}
      {showSettings && (
        <SettingsModal
          aiSettings={aiSettings}
          mapSettings={mapSettings}
          onSave={handleSaveSettings}
          onCancel={handleCancelSettings}
          onPreviewStyle={handlePreviewStyle}
        />
      )}
    </div>
  );
}
