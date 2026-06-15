export interface NoteEntry {
  id: string;
  content: string;
  source: 'ai' | 'card';
  locationName: string;
  timestamp: string; // ISO 8601
}

export interface NotesData {
  freeText: string;
  entries: NoteEntry[];
}

const KEY = 'geo_notes_v1';

export function loadNotes(): NotesData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { freeText: '', entries: [] };
    return JSON.parse(raw) as NotesData;
  } catch {
    return { freeText: '', entries: [] };
  }
}

export function saveNotes(data: NotesData): void {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function makeEntry(
  payload: Omit<NoteEntry, 'id' | 'timestamp'>,
): NoteEntry {
  return {
    ...payload,
    id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
    timestamp: new Date().toISOString(),
  };
}

export function toMarkdown(data: NotesData): string {
  const lines: string[] = ['# 地理纵深 · 我的笔记', ''];

  if (data.freeText.trim()) {
    lines.push('## 自由笔记', '', data.freeText.trim(), '');
  }

  if (data.entries.length > 0) {
    lines.push('## 已保存条目', '');
    for (const e of data.entries) {
      const date = new Date(e.timestamp).toLocaleString('zh-CN');
      const src = e.source === 'ai' ? 'AI 助手' : '知识卡';
      lines.push(`### ${e.locationName}  ·  ${date}  ·  ${src}`, '', e.content.trim(), '');
    }
  }

  return lines.join('\n');
}
