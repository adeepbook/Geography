import { useState, useRef, useEffect } from 'react';
import type { AISettings } from '../../hooks/useAISettings';
import type { LocationScript } from '../../types';
import { streamChat, type ChatMessage } from '../../lib/aiChat';
import {
  PRESET_GROUPS,
  SYSTEM_PROMPT_BASE,
  injectPreset,
  type AiPreset,
  type PresetContext,
} from '../../config/aiPresets';
import type { SaveNotePayload } from '../NotesPanel';

interface Props {
  placeName: string;
  lngLat: [number, number];
  /** Present only when a curated (精选) location is selected */
  location?: LocationScript;
  settings: AISettings;
  onOpenSettings: () => void;
  onSaveNote?: (payload: SaveNotePayload) => void;
}

// ---------------------------------------------------------------------------
// System prompt builder — uses base from config + injects location context
// ---------------------------------------------------------------------------

function buildSystemPrompt(
  placeName: string,
  lngLat: [number, number],
  location?: LocationScript,
): string {
  const [lng, lat] = lngLat;
  const latStr = `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? 'N' : 'S'}`;
  const lngStr = `${Math.abs(lng).toFixed(4)}°${lng >= 0 ? 'E' : 'W'}`;

  let p = SYSTEM_PROMPT_BASE + '\n\n';
  p += `当前地点：${placeName}\n坐标：${latStr}, ${lngStr}\n`;

  if (location) {
    p += '\n【精选地点背景信息】\n';
    p += `类型：${location.类型标签.join('、')}\n`;
    p += `简介：${location.一句话}\n`;
    p += `区位：${location.区位}\n`;
    if (location.形成时间线.length) {
      p += `形成过程（关键事件）：${location.形成时间线.map((e) => e.事件).join(' → ')}\n`;
    }
    const layers = [
      ...location.垂直拆解.天上,
      ...location.垂直拆解.地面,
      ...location.垂直拆解.地下,
    ].filter(Boolean);
    if (layers.length) p += `垂直结构：${layers.join('、')}\n`;
    if (location.本地注解) p += `本地注解：${location.本地注解}\n`;
    p += `内容状态：${location.状态}（非"已核对"时供学习参考，请结合权威资料）\n`;
  }

  return p;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type DisplayMessage = { role: 'user' | 'assistant'; content: string };

export default function AIAssistant({
  placeName,
  lngLat,
  location,
  settings,
  onOpenSettings,
  onSaveNote,
}: Props) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  // Track which message indices have been saved (brief feedback)
  const [savedIndices, setSavedIndices] = useState<Set<number>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Core send logic — accepts the final text string
  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    if (!settings.apiKey) {
      setError('请先点击右上角 ⚙ 填写 API Key');
      return;
    }

    const userMsg: DisplayMessage = { role: 'user', content: trimmed };
    const history = [...messages, userMsg];
    setMessages([...history, { role: 'assistant', content: '' }]);
    setStreaming(true);
    setError(null);

    const systemMsg: ChatMessage = {
      role: 'system',
      content: buildSystemPrompt(placeName, lngLat, location),
    };

    let accumulated = '';
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      await streamChat(
        settings,
        [systemMsg, ...history] as ChatMessage[],
        (delta) => {
          accumulated += delta;
          setMessages([...history, { role: 'assistant', content: accumulated }]);
        },
        ac.signal,
      );
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError((err as Error).message);
        setMessages(history);
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  // Called by the input send button / Enter key
  function handleInputSend() {
    if (!input.trim()) return;
    const text = input;
    setInput('');
    sendMessage(text);
  }

  // Called by preset chip
  function handlePresetClick(preset: AiPreset) {
    const [lng, lat] = lngLat;
    const ctx: PresetContext = {
      地名: placeName,
      lat: `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? 'N' : 'S'}`,
      lng: `${Math.abs(lng).toFixed(4)}°${lng >= 0 ? 'E' : 'W'}`,
      location,
    };
    sendMessage(injectPreset(preset.提示词模板, ctx));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleInputSend();
    }
  }

  function handleSaveMsg(content: string, index: number) {
    onSaveNote?.({ content, source: 'ai', locationName: placeName });
    setSavedIndices((prev) => new Set([...prev, index]));
    setTimeout(() => {
      setSavedIndices((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }, 2000);
  }

  const hasKey = Boolean(settings.apiKey);
  const chipsDisabled = !hasKey || streaming;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>

      {/* ── Section header ────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderTop: '1px solid #E5E2DC', paddingTop: 16, marginTop: 8, paddingBottom: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1C1917' }}>AI 学习助手</span>
          <span style={{
            fontSize: 10, fontWeight: 600, color: '#92600A',
            background: '#FEF9EE', border: '1px solid #F4D793',
            borderRadius: 4, padding: '1px 6px',
          }}>
            内容未经核对
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 11, color: '#A8A29E' }}>{settings.model}</span>
          <button
            onClick={onOpenSettings}
            title="配置 AI 助手"
            style={{
              width: 26, height: 26, borderRadius: 6,
              border: '1px solid #D6D3CE', background: '#fff',
              cursor: 'pointer', fontSize: 13, color: '#78716C',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >⚙</button>
        </div>
      </div>

      {/* ── Location pill ─────────────────────────────────────────────────── */}
      <div style={{
        background: '#F0EDE8', borderRadius: 7, padding: '6px 10px',
        fontSize: 11, color: '#57534E', marginBottom: 12,
      }}>
        {placeName}
      </div>

      {/* ── No-key nudge ──────────────────────────────────────────────────── */}
      {!hasKey && (
        <div style={{
          background: '#FFFBEB', border: '1px solid #FDE68A',
          borderRadius: 8, padding: '8px 12px', fontSize: 12,
          color: '#92600A', marginBottom: 10,
        }}>
          请先点击右上角 ⚙ 填写 API Key 和接口地址。
        </div>
      )}

      {/* ── Message list ──────────────────────────────────────────────────── */}
      <div style={{
        minHeight: 120, maxHeight: 280, overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 10,
        paddingBottom: 4,
      }}>
        {messages.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '28px 16px',
            color: '#A8A29E', fontSize: 12,
          }}>
            选择上方模块或自由提问
          </div>
        )}

        {messages.map((msg, i) => {
          const isUser = msg.role === 'user';
          const isLast = i === messages.length - 1;
          const isEmpty = msg.content === '';
          return (
            <div key={i} style={{ display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row' }}>
              <div style={{
                maxWidth: '88%',
                background: isUser ? '#1C1917' : '#fff',
                color: isUser ? '#F9F8F5' : '#1C1917',
                borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                padding: '9px 13px',
                fontSize: 13, lineHeight: 1.65,
                boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
                border: isUser ? 'none' : '1px solid #E5E2DC',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {isEmpty && !isUser && streaming && isLast
                  ? <span style={{ opacity: 0.4 }}>▌</span>
                  : msg.content}

                {!isUser && msg.content && (
                  <div style={{
                    marginTop: 8, paddingTop: 7,
                    borderTop: '1px solid #F0EDE8',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 8,
                  }}>
                    <span style={{ fontSize: 10, color: '#A8A29E' }}>
                      AI 辅助 · 内容未经核对，请结合权威资料
                    </span>
                    {onSaveNote && !streaming && (
                      <button
                        onClick={() => handleSaveMsg(msg.content, i)}
                        title="保存到笔记"
                        style={{
                          flexShrink: 0,
                          padding: '2px 7px', borderRadius: 5,
                          border: '1px solid #D6D3CE',
                          background: savedIndices.has(i) ? '#F0EDE8' : '#fff',
                          color: savedIndices.has(i) ? '#57534E' : '#78716C',
                          fontSize: 10, cursor: 'pointer',
                          transition: 'background 0.12s',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {savedIndices.has(i) ? '已保存 ✓' : '存入笔记'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── Error bar ─────────────────────────────────────────────────────── */}
      {error && (
        <div style={{
          background: '#FEF2F2', border: '1px solid #FECACA',
          borderRadius: 8, padding: '8px 12px', marginTop: 6,
          fontSize: 12, color: '#B91C1C',
        }}>
          {error}
        </div>
      )}

      {/* ── Preset chips ──────────────────────────────────────────────────── */}
      <div style={{ marginTop: 14, marginBottom: 10 }}>
        {PRESET_GROUPS.map((group, gi) => (
          <div key={group.分组} style={{ marginBottom: gi < PRESET_GROUPS.length - 1 ? 9 : 0 }}>
            {/* Group label */}
            <div style={{
              fontSize: 10, fontWeight: 600, color: '#A8A29E',
              letterSpacing: '0.06em', textTransform: 'uppercase',
              marginBottom: 5,
            }}>
              {group.分组}
            </div>
            {/* Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {group.items.map((preset) => {
                const hovered = hoveredId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onMouseEnter={() => !chipsDisabled && setHoveredId(preset.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => !chipsDisabled && handlePresetClick(preset)}
                    disabled={chipsDisabled}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '4px 9px', borderRadius: 20,
                      border: `1.5px solid ${hovered && !chipsDisabled ? '#B8B4AE' : '#D6D3CE'}`,
                      background: hovered && !chipsDisabled ? '#E8E5E0' : '#F0EDE8',
                      color: chipsDisabled ? '#B8B4AE' : '#57534E',
                      fontSize: 11, fontWeight: 500,
                      cursor: chipsDisabled ? 'default' : 'pointer',
                      opacity: chipsDisabled ? 0.5 : 1,
                      transition: 'background 0.12s, border-color 0.12s',
                      lineHeight: 1,
                    }}
                  >
                    <span style={{ fontSize: 12, lineHeight: 1 }}>{preset.图标}</span>
                    {preset.标题}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Input area ────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 8, alignItems: 'flex-end',
        border: '1.5px solid #D6D3CE', borderRadius: 10, background: '#fff',
        padding: '7px 7px 7px 12px',
      }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={hasKey ? '自由提问… (Enter 发送，Shift+Enter 换行)' : '配置 API Key 后可提问'}
          disabled={!hasKey || streaming}
          rows={1}
          style={{
            flex: 1, border: 'none', outline: 'none',
            resize: 'none', fontSize: 13, color: '#1C1917',
            background: 'transparent', lineHeight: 1.55,
            fontFamily: 'inherit', minHeight: 22,
          }}
        />
        <button
          onClick={handleInputSend}
          disabled={!input.trim() || streaming || !hasKey}
          title="发送 (Enter)"
          style={{
            flexShrink: 0, width: 34, height: 34, borderRadius: 7,
            border: 'none',
            background: input.trim() && !streaming && hasKey ? '#1C1917' : '#E5E2DC',
            color: input.trim() && !streaming && hasKey ? '#fff' : '#A8A29E',
            cursor: input.trim() && !streaming && hasKey ? 'pointer' : 'default',
            fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s, color 0.15s',
            lineHeight: 1,
          }}
        >↑</button>
      </div>
    </div>
  );
}
