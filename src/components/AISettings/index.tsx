import { useState } from 'react';
import type { AISettings } from '../../hooks/useAISettings';
import type { MapSettings } from '../../hooks/useMapSettings';
import { MAP_STYLES } from '../../config/mapStyles';

const COMMON_MODELS = [
  'deepseek-chat',
  'deepseek-reasoner',
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-3.5-turbo',
];

const PROVIDER_LABEL: Record<string, string> = {
  ofm: 'OpenFreeMap',
  esri: 'ESRI（署名）',
  maptiler: 'MapTiler',
};

interface Props {
  aiSettings: AISettings;
  mapSettings: MapSettings;
  onSave: (ai: AISettings, map: MapSettings) => void;
  onCancel: () => void;
  onPreviewStyle: (styleId: string) => void;
}

export default function SettingsModal({ aiSettings, mapSettings, onSave, onCancel, onPreviewStyle }: Props) {
  const [aiDraft,  setAiDraft]  = useState<AISettings>(aiSettings);
  const [mapDraft, setMapDraft] = useState<MapSettings>(mapSettings);

  const hasMapTilerKey = mapDraft.mapTilerKey.trim().length > 0;

  function handleStyleClick(styleId: string) {
    setMapDraft(d => ({ ...d, styleId }));
    onPreviewStyle(styleId);
  }

  function handleSave() {
    onSave(aiDraft, mapDraft);
  }

  const freeStyles    = MAP_STYLES.filter(s => !s.needsKey);
  const maptilerStyles = MAP_STYLES.filter(s => s.needsKey);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.42)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div style={{
        background: '#F9F8F5', borderRadius: 14,
        padding: '24px 28px',
        width: 480, maxWidth: '100%',
        maxHeight: '92vh', overflowY: 'auto',
        boxShadow: '0 8px 48px rgba(0,0,0,0.24)',
        display: 'flex', flexDirection: 'column', gap: 0,
      }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#1C1917' }}>设置</span>
          <button onClick={onCancel} style={{
            border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 22, color: '#78716C', lineHeight: 1, padding: '0 2px',
          }}>×</button>
        </div>

        {/* ══════════════ AI 助手 ══════════════ */}
        <div style={sectionTitleStyle}>AI 助手</div>

        <p style={disclaimerStyle}>
          配置仅存于本机浏览器，不上传任何服务器。如遇 CORS，可将接口地址改为{' '}
          <code style={{ fontFamily: 'monospace', fontSize: 11 }}>/ai-proxy</code>（Vite 内置代理，仅本地 dev 有效）。
        </p>

        <label style={labelStyle}>接口地址（Base URL）</label>
        <input
          value={aiDraft.baseUrl}
          onChange={(e) => setAiDraft(d => ({ ...d, baseUrl: e.target.value }))}
          placeholder="https://api.deepseek.com"
          style={inputStyle}
          spellCheck={false}
        />

        <label style={labelStyle}>API Key</label>
        <input
          type="password"
          value={aiDraft.apiKey}
          onChange={(e) => setAiDraft(d => ({ ...d, apiKey: e.target.value }))}
          placeholder="sk-..."
          style={inputStyle}
          autoComplete="off"
        />

        <label style={labelStyle}>模型</label>
        <input
          list="ai-model-list"
          value={aiDraft.model}
          onChange={(e) => setAiDraft(d => ({ ...d, model: e.target.value }))}
          placeholder="deepseek-chat"
          style={inputStyle}
          spellCheck={false}
        />
        <datalist id="ai-model-list">
          {COMMON_MODELS.map(m => <option key={m} value={m} />)}
        </datalist>
        <p style={{ fontSize: 11, color: '#A8A29E', margin: '4px 0 0' }}>
          可下拉选常见模型，也可直接输入任意模型 ID。
        </p>

        {/* ── Divider ── */}
        <div style={{ borderTop: '1px solid #E5E2DC', margin: '22px 0 18px' }} />

        {/* ══════════════ 地图样式 ══════════════ */}
        <div style={sectionTitleStyle}>地图样式</div>

        {/* Free styles */}
        <div style={subLabelStyle}>免费无密钥</div>
        <div style={styleGridStyle}>
          {freeStyles.map(s => (
            <StyleCard
              key={s.id}
              def={s}
              active={mapDraft.styleId === s.id}
              disabled={false}
              onClick={() => handleStyleClick(s.id)}
            />
          ))}
        </div>

        {/* MapTiler styles */}
        <div style={{ ...subLabelStyle, marginTop: 14 }}>
          MapTiler 专业样式
          {!hasMapTilerKey && (
            <span style={{ fontSize: 10, color: '#A8A29E', marginLeft: 6, fontWeight: 400 }}>
              （填写 Key 后解锁）
            </span>
          )}
        </div>
        <div style={{ ...styleGridStyle, opacity: hasMapTilerKey ? 1 : 0.45, pointerEvents: hasMapTilerKey ? 'auto' : 'none' }}>
          {maptilerStyles.map(s => (
            <StyleCard
              key={s.id}
              def={s}
              active={mapDraft.styleId === s.id}
              disabled={!hasMapTilerKey}
              onClick={() => handleStyleClick(s.id)}
            />
          ))}
        </div>

        <label style={{ ...labelStyle, marginTop: 14 }}>MapTiler API Key（可选）</label>
        <input
          value={mapDraft.mapTilerKey}
          onChange={(e) => setMapDraft(d => ({ ...d, mapTilerKey: e.target.value }))}
          placeholder="在 maptiler.com 免费注册后获取"
          style={inputStyle}
          spellCheck={false}
          autoComplete="off"
        />
        <p style={{ fontSize: 11, color: '#A8A29E', margin: '4px 0 0' }}>
          Key 仅存本机 localStorage，不会上传任何服务器。
        </p>

        {/* ── Footer ── */}
        <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={cancelBtnStyle}>取消</button>
          <button onClick={handleSave} style={saveBtnStyle}>保存</button>
        </div>
      </div>
    </div>
  );
}

// ── Style card sub-component ─────────────────────────────────────────────────

interface StyleCardProps {
  def: typeof MAP_STYLES[number];
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}

function StyleCard({ def, active, disabled, onClick }: StyleCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={def.name}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5,
        padding: '8px 10px 7px',
        borderRadius: 8,
        border: `1.5px solid ${active ? '#1C1917' : '#D6D3CE'}`,
        background: active ? '#1C1917' : '#fff',
        cursor: disabled ? 'default' : 'pointer',
        textAlign: 'left',
        transition: 'border-color 0.15s, background 0.15s',
        minWidth: 0,
      }}
    >
      {/* Palette swatches */}
      <div style={{ display: 'flex', gap: 3 }}>
        {def.palette.map((c, i) => (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: '50%', background: c,
            border: '0.5px solid rgba(0,0,0,0.12)',
            flexShrink: 0,
          }} />
        ))}
      </div>
      {/* Name */}
      <div style={{
        fontSize: 11, fontWeight: 600, lineHeight: 1.2,
        color: active ? '#fff' : '#1C1917',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        maxWidth: '100%',
      }}>
        {def.name}
      </div>
      {/* Provider badge */}
      <div style={{ fontSize: 10, color: active ? 'rgba(255,255,255,0.55)' : '#A8A29E', lineHeight: 1 }}>
        {PROVIDER_LABEL[def.provider]}
      </div>
    </button>
  );
}

// ── Shared styles ──────────────────────────────────────────────────────────────

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 700, color: '#1C1917',
  marginBottom: 8,
};

const subLabelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: '#78716C',
  marginBottom: 8,
  display: 'flex', alignItems: 'center',
};

const disclaimerStyle: React.CSSProperties = {
  fontSize: 12, color: '#78716C',
  marginBottom: 4, lineHeight: 1.65,
  background: '#F0EDE8', borderRadius: 8,
  padding: '8px 12px',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: '#57534E', marginBottom: 5, marginTop: 14,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 11px',
  border: '1.5px solid #D6D3CE', borderRadius: 7,
  fontSize: 13, color: '#1C1917', background: '#fff',
  boxSizing: 'border-box', outline: 'none',
  fontFamily: 'inherit',
};

const styleGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 8,
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '8px 18px', borderRadius: 7,
  border: '1.5px solid #D6D3CE', background: '#fff',
  color: '#57534E', fontSize: 13, fontWeight: 600, cursor: 'pointer',
};

const saveBtnStyle: React.CSSProperties = {
  padding: '8px 22px', borderRadius: 7,
  border: 'none', background: '#1C1917',
  color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
};
