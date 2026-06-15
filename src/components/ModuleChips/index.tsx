interface Props {
  moduleIds: string[];
  activeId: string | null;
  onToggle: (id: string) => void;
  color?: string;
}

function shortLabel(id: string): string {
  // "外力/流水/下切与峡谷" → "下切与峡谷"
  const parts = id.split('/');
  return parts[parts.length - 1];
}

export default function ModuleChips({ moduleIds, activeId, onToggle, color = '#3E7DBA' }: Props) {
  if (moduleIds.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
      {moduleIds.map((id) => {
        const active = id === activeId;
        return (
          <button
            key={id}
            onClick={() => onToggle(id)}
            title={id}
            style={{
              padding: '3px 10px',
              borderRadius: 20,
              border: `1.5px solid ${color}`,
              background: active ? color : 'transparent',
              color: active ? '#fff' : color,
              fontSize: 12,
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.15s',
            }}
          >
            {shortLabel(id)}
          </button>
        );
      })}
    </div>
  );
}
