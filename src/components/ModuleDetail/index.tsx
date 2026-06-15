import type { ProcessModule } from '../../types';

interface Props {
  module: ProcessModule;
  onClose: () => void;
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

export default function ModuleDetail({ module, onClose }: Props) {
  return (
    <div style={{
      background: '#FAFAF9',
      border: '1px solid #EAE6E0',
      borderRadius: 10,
      padding: '16px 20px',
      marginTop: 8,
      position: 'relative',
    }}>
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 12, right: 12,
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#78716C', fontSize: 18, lineHeight: 1, padding: 4,
        }}
        aria-label="关闭"
      >×</button>

      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#78716C', marginBottom: 4 }}>
        {module.模块ID}
      </div>
      {module.一句话 && (
        <p style={{ margin: '0 0 12px', color: '#1C1917', fontSize: 14, fontStyle: 'italic' }}>
          {module.一句话}
        </p>
      )}

      {module.原理讲解 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#78716C', marginBottom: 6 }}>原理讲解</div>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: '#292524' }}>
            {renderInlineMarkdown(module.原理讲解)}
          </p>
        </div>
      )}

      {module.易错警示 && (
        <div style={{
          background: '#FEF9EE',
          border: '1px solid #F4D793',
          borderRadius: 6,
          padding: '8px 12px',
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: '#92600A', marginBottom: 4 }}>⚠ 易错警示</div>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: '#78350F' }}>
            {renderInlineMarkdown(module.易错警示)}
          </p>
        </div>
      )}

      {module.状态 !== '已核对' && (
        <div style={{ marginTop: 10, fontSize: 11, color: '#78716C' }}>
          状态: {module.状态}
        </div>
      )}
    </div>
  );
}
