import { useState } from 'react';
import type { NotesData, NoteEntry } from '../../lib/notes';
import { toMarkdown } from '../../lib/notes';

export interface SaveNotePayload {
  content: string;
  source: 'ai' | 'card';
  locationName: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  notes: NotesData;
  onUpdate: (updated: NotesData) => void;
}

export default function NotesPanel({ open, onClose, notes, onUpdate }: Props) {
  const [copyFeedback, setCopyFeedback] = useState(false);

  function handleFreeTextChange(text: string) {
    onUpdate({ ...notes, freeText: text });
  }

  function handleExport() {
    const md = toMarkdown(notes);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `地理笔记_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleCopyAll() {
    const md = toMarkdown(notes);
    try {
      await navigator.clipboard.writeText(md);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = md;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  }

  function handleClear() {
    if (!window.confirm('确认清空所有笔记？此操作不可撤销。')) return;
    onUpdate({ freeText: '', entries: [] });
  }

  function deleteEntry(id: string) {
    onUpdate({ ...notes, entries: notes.entries.filter((e) => e.id !== id) });
  }

  const isEmpty = !notes.freeText.trim() && notes.entries.length === 0;

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, bottom: 0,
      width: 400,
      background: '#F2F0EB',
      boxShadow: '4px 0 24px rgba(0,0,0,0.14)',
      zIndex: 30,
      transform: open ? 'translateX(0)' : 'translateX(-100%)',
      transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 16px 12px',
        borderBottom: '1px solid #D6D3CE',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1C1917' }}>我的笔记</div>
          <div style={{ fontSize: 10, color: '#A8A29E', marginTop: 2 }}>
            仅存本机 · 不跨设备同步
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="关闭笔记"
          style={{
            width: 30, height: 30, borderRadius: '50%',
            border: '1px solid #D6D3CE',
            background: '#fff', cursor: 'pointer',
            fontSize: 18, color: '#78716C',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          }}
        >×</button>
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex', gap: 6, padding: '10px 16px',
        borderBottom: '1px solid #E5E2DC',
        flexShrink: 0,
      }}>
        <ActionBtn onClick={handleExport} title="下载为 .md 文件">导出 .md</ActionBtn>
        <ActionBtn onClick={handleCopyAll} title="复制全部内容为 Markdown">
          {copyFeedback ? '已复制 ✓' : '复制全部'}
        </ActionBtn>
        <ActionBtn onClick={handleClear} danger disabled={isEmpty} title="清空所有笔记">
          清空
        </ActionBtn>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 32px' }}>

        {/* Free text */}
        <SectionLabel>自由笔记</SectionLabel>
        <textarea
          value={notes.freeText}
          onChange={(e) => handleFreeTextChange(e.target.value)}
          placeholder="在这里记录你的想法、问题、总结…"
          style={{
            width: '100%', minHeight: 120,
            border: '1.5px solid #D6D3CE', borderRadius: 9,
            background: '#fff', padding: '10px 12px',
            fontSize: 13, color: '#1C1917', lineHeight: 1.65,
            resize: 'vertical', outline: 'none',
            fontFamily: 'inherit', boxSizing: 'border-box',
          }}
        />

        {/* Saved entries */}
        <div style={{ marginTop: 22 }}>
          <SectionLabel>
            已保存条目
            {notes.entries.length > 0 && (
              <span style={{
                marginLeft: 6, fontSize: 10,
                background: '#E5E2DC', borderRadius: 10,
                padding: '1px 6px', color: '#57534E',
              }}>
                {notes.entries.length}
              </span>
            )}
          </SectionLabel>

          {notes.entries.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '24px 0',
              color: '#A8A29E', fontSize: 12,
            }}>
              还没有保存的条目<br />
              <span style={{ opacity: 0.75 }}>点击 AI 回复或知识卡上的「存入笔记」</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...notes.entries].reverse().map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onDelete={() => deleteEntry(entry.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 600, color: '#A8A29E',
      letterSpacing: '0.07em', textTransform: 'uppercase',
      marginBottom: 8,
      display: 'flex', alignItems: 'center',
    }}>
      {children}
    </div>
  );
}

function ActionBtn({
  children, onClick, title, danger, disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  danger?: boolean;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const active = hovered && !disabled;
  return (
    <button
      onClick={disabled ? undefined : onClick}
      title={title}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '5px 10px', borderRadius: 7,
        border: `1.5px solid ${active ? (danger ? '#FECACA' : '#B8B4AE') : '#D6D3CE'}`,
        background: active ? (danger ? '#FEF2F2' : '#E8E5E0') : '#fff',
        color: disabled ? '#C4C0BB' : (danger ? (active ? '#B91C1C' : '#DC2626') : '#57534E'),
        fontSize: 11, fontWeight: 500,
        cursor: disabled ? 'default' : 'pointer',
        transition: 'background 0.12s, border-color 0.12s, color 0.12s',
        lineHeight: 1,
      }}
    >
      {children}
    </button>
  );
}

function EntryCard({ entry, onDelete }: { entry: NoteEntry; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);

  const isLong = entry.content.length > 280;
  const preview = isLong && !expanded ? entry.content.slice(0, 280) + '…' : entry.content;

  const date = new Date(entry.timestamp).toLocaleString('zh-CN', {
    month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  const srcLabel = entry.source === 'ai' ? 'AI 助手' : '知识卡';

  return (
    <div style={{
      background: '#fff', borderRadius: 10,
      border: '1px solid #E5E2DC',
      padding: '10px 12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    }}>
      {/* Meta row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 7,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#1C1917' }}>
            {entry.locationName}
          </span>
          <span style={{ fontSize: 10, color: '#C4C0BB' }}>·</span>
          <span style={{ fontSize: 10, color: '#A8A29E' }}>{date}</span>
          <span style={{ fontSize: 10, color: '#C4C0BB' }}>·</span>
          <span style={{
            fontSize: 10, color: '#57534E',
            background: '#F0EDE8', borderRadius: 4, padding: '1px 5px',
          }}>
            {srcLabel}
          </span>
        </div>
        <button
          onClick={onDelete}
          title="删除此条"
          style={{
            flexShrink: 0, width: 20, height: 20, borderRadius: 4,
            border: '1px solid #E5E2DC', background: 'transparent',
            color: '#A8A29E', cursor: 'pointer', fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1,
          }}
        >×</button>
      </div>

      {/* Content */}
      <div style={{
        fontSize: 12, color: '#292524', lineHeight: 1.65,
        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      }}>
        {preview}
      </div>

      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            marginTop: 5, padding: 0, border: 'none', background: 'none',
            color: '#78716C', fontSize: 11, cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          {expanded ? '收起' : '展开全部'}
        </button>
      )}
    </div>
  );
}
