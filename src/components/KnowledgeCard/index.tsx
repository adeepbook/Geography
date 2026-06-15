import { useState } from 'react';
import type { AnyCard, ProcessModule } from '../../types';
import { isAICard } from '../../types';
import { tagColor } from '../../lib/tagColors';
import FormationTimeline from '../FormationTimeline';
import VerticalLayers from '../VerticalLayers';
import type { SaveNotePayload } from '../NotesPanel';

interface Props {
  card: AnyCard;
  moduleMap: Map<string, ProcessModule>;
  onSaveNote?: (payload: SaveNotePayload) => void;
}

type Tab = 'timeline' | 'layers';

export default function KnowledgeCard({ card, moduleMap, onSaveNote }: Props) {
  const [tab, setTab] = useState<Tab>('timeline');
  const [cardSaved, setCardSaved] = useState(false);
  const ai = isAICard(card);

  function handleSaveCard() {
    const events = card.形成时间线.map((e) => e.事件).join(' → ');
    const content = [
      `**${card.名称}** · ${card.区位}`,
      `标签：${card.类型标签.join('、')}`,
      '',
      card.一句话,
      ...(events ? ['', `形成过程：${events}`] : []),
      ...(card.本地注解 ? ['', `注解：${card.本地注解}`] : []),
      ...(ai ? ['', '⚡ 本条目由 AI 推测生成，未经核对'] : []),
    ].join('\n');
    onSaveNote?.({ content, source: 'card', locationName: card.名称 });
    setCardSaved(true);
    setTimeout(() => setCardSaved(false), 2000);
  }

  // Header colours differ for AI-generated cards
  const headerBg  = ai ? '#FFFBF0' : '#FFFFFF';
  const accentClr = ai ? '#F59E0B' : '#3E7DBA';

  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: 14,
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      overflow: 'hidden',
      maxWidth: 620,
      margin: '0 auto',
      fontFamily: '"Segoe UI", system-ui, sans-serif',
    }}>
      {/* AI banner — only for AI cards */}
      {ai && (
        <div style={{
          background: '#FFFBF0',
          borderBottom: '1px solid #FDE68A',
          padding: '7px 18px',
          display: 'flex', alignItems: 'center', gap: 7,
        }}>
          <span style={{ fontSize: 13 }}>⚡</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#92600A' }}>
            AI 推测 · 未核对
          </span>
          <span style={{ fontSize: 11, color: '#A8A29E', flex: 1 }}>
            由大模型根据地理坐标推断生成，可能存在错误，请结合权威资料核实
          </span>
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #EAE6E0', background: headerBg }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1C1917', lineHeight: 1.2 }}>
              {card.名称}
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#78716C' }}>{card.区位}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {/* Status badge: only for non-AI non-verified cards */}
            {!ai && card.状态 !== '已核对' && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 11, padding: '2px 8px', borderRadius: 20,
                background: '#FEF9EE', color: '#92600A',
                border: '1px solid #F4D793', fontWeight: 500,
              }}>
                ⚑ {card.状态 === '起草' ? '草稿' : '待核对'}
              </span>
            )}
            {onSaveNote && (
              <button
                onClick={handleSaveCard}
                title="将知识卡关键信息存入笔记"
                style={{
                  padding: '3px 9px', borderRadius: 7,
                  border: '1px solid #D6D3CE',
                  background: cardSaved ? '#F0EDE8' : '#fff',
                  color: cardSaved ? '#57534E' : '#78716C',
                  fontSize: 11, cursor: 'pointer',
                  transition: 'background 0.12s',
                  whiteSpace: 'nowrap',
                }}
              >
                {cardSaved ? '已保存 ✓' : '存入笔记'}
              </button>
            )}
          </div>
        </div>

        {/* Type tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
          {card.类型标签.map(tag => (
            <span key={tag} style={{
              fontSize: 12, fontWeight: 600, padding: '3px 10px',
              borderRadius: 20, color: '#fff',
              background: tagColor(tag),
            }}>{tag}</span>
          ))}
        </div>

        <p style={{ margin: '12px 0 0', fontSize: 14, lineHeight: 1.65, color: '#292524', fontStyle: 'italic' }}>
          {card.一句话}
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #EAE6E0' }}>
        {([
          { key: 'timeline', label: '形成时间轴' },
          { key: 'layers',   label: '垂直拆解' },
        ] as { key: Tab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              flex: 1, padding: '10px 0',
              border: 'none', background: 'none',
              cursor: 'pointer',
              fontSize: 13, fontWeight: tab === key ? 600 : 400,
              color: tab === key ? '#1C1917' : '#78716C',
              borderBottom: tab === key ? `2px solid ${accentClr}` : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: '20px 24px' }}>
        {tab === 'timeline' && (
          <FormationTimeline events={card.形成时间线} locationId={card.地点ID} />
        )}
        {tab === 'layers' && (
          <VerticalLayers layers={card.垂直拆解} moduleMap={moduleMap} />
        )}
      </div>

      {/* Footer: sources */}
      {card.事实来源.length > 0 && (
        <div style={{ padding: '12px 24px 16px', borderTop: '1px solid #EAE6E0', background: '#FAFAF9' }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#78716C', marginBottom: 4 }}>
            {ai ? '生成说明' : '事实来源'}
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {card.事实来源.map((src, i) => (
              <li key={i} style={{ fontSize: 11, color: '#78716C' }}>· {src}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
