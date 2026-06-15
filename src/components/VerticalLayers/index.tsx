import { useState } from 'react';
import type { VerticalLayers as VL, ProcessModule } from '../../types';
import ModuleChips from '../ModuleChips';
import ModuleDetail from '../ModuleDetail';

interface Props {
  layers: VL;
  moduleMap: Map<string, ProcessModule>;
}

type LayerKey = '天上' | '地面' | '地下';

const LAYER_META: { key: LayerKey; label: string; icon: string; color: string }[] = [
  { key: '天上', label: '天上 · 气候与大气', icon: '☁', color: '#3E7DBA' },
  { key: '地面', label: '地面 · 地貌过程',   icon: '◉', color: '#8B6B4E' },
  { key: '地下', label: '地下 · 岩石与构造', icon: '◈', color: '#4E5A6B' },
];

function stripParens(s: string): string {
  return s.replace(/\s*\(.*?\)\s*$/, '').trim();
}

function isModuleRef(s: string): boolean {
  return s.includes('/');
}

export default function VerticalLayers({ layers, moduleMap }: Props) {
  const [open, setOpen] = useState<Record<LayerKey, boolean>>({ 天上: true, 地面: true, 地下: false });
  const [activeModule, setActiveModule] = useState<string | null>(null);

  function toggleModule(id: string) {
    setActiveModule(prev => prev === id ? null : id);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {LAYER_META.map(({ key, label, icon, color }) => {
        const items: string[] = layers[key];
        const moduleIds = items.filter(isModuleRef).map(stripParens);
        const plainItems = items.filter(s => !isModuleRef(s));
        const isOpen = open[key];

        const activeHere = activeModule && moduleIds.includes(activeModule) ? activeModule : null;
        const activeMod = activeHere ? moduleMap.get(activeHere) : null;

        return (
          <div key={key} style={{ border: '1px solid #EAE6E0', borderRadius: 8, overflow: 'hidden' }}>
            <button
              onClick={() => setOpen(prev => ({ ...prev, [key]: !prev[key] }))}
              style={{
                width: '100%', textAlign: 'left', padding: '10px 14px',
                background: isOpen ? '#F7F5F2' : '#FAFAF9',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <span style={{ color, fontSize: 16 }}>{icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1C1917' }}>{label}</span>
              <span style={{ marginLeft: 'auto', color: '#78716C', fontSize: 12 }}>{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
              <div style={{ padding: '10px 14px 14px' }}>
                {plainItems.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: moduleIds.length > 0 ? 8 : 0 }}>
                    {plainItems.map((item, i) => (
                      <span key={i} style={{
                        fontSize: 12, color: '#57534E',
                        background: '#F2F0EB', borderRadius: 20,
                        padding: '2px 10px',
                      }}>{item}</span>
                    ))}
                  </div>
                )}
                <ModuleChips
                  moduleIds={moduleIds}
                  activeId={activeHere}
                  onToggle={toggleModule}
                  color={color}
                />
                {activeMod && (
                  <ModuleDetail module={activeMod} onClose={() => setActiveModule(null)} />
                )}
                {activeHere && !activeMod && (
                  <p style={{ fontSize: 12, color: '#78716C', marginTop: 8 }}>
                    模块详情暂未加载: {activeHere}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
