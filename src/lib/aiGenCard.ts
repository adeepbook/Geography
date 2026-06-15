import type { AISettings } from '../hooks/useAISettings';
import type { AILocationCard, TimelineEvent, VerticalLayers } from '../types';
import { chatOnce, type ChatMessage } from './aiChat';

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

const SYSTEM =
  '你是严谨的地理知识卡生成器。规则：' +
  '①绝不编造精确数字/年代，用量级范围（如"约X亿年前"）；' +
  '②不确定时主动说"可能""推测""需核对"；' +
  '③宁可粗别假准；' +
  '④直接返回 JSON，可接受 ```json 代码块。';

function buildPrompt(name: string, lngLat: [number, number], moduleIds: string[]): string {
  const [lng, lat] = lngLat;
  const coord = `${Math.abs(lat).toFixed(3)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(3)}°${lng >= 0 ? 'E' : 'W'}`;
  const mList = moduleIds.slice(0, 60).join('、');

  return `请为以下地点生成一张地理知识卡：
地点：${name}（${coord}）

严格按以下 JSON schema 返回，字段不多不少：

{
  "名称": "地点正式名称",
  "区位": "大洲·国家·省级/区域",
  "类型标签": ["1-3个，只从这里选：火山与板块、造山与构造、流水、冰川、喀斯特、风与干旱、气候与生物"],
  "一句话": "≤50字，点明最核心地理特征",
  "形成时间线": [
    {
      "事件": "关键事件简洁名称",
      "模块": "只能取以下过程库ID之一：${mList}；若无合适则写"通用/综合"",
      "参数": {},
      "说明": "1-2句解释，标注不确定性"
    }
  ],
  "垂直拆解": {
    "天上": ["气候/大气/天气，2-3项"],
    "地面": ["主要地貌/地面过程，3-5项"],
    "地下": ["岩层/构造/地下水，2-3项"]
  },
  "本地注解": "≤80字，该地最独特地理特点，承认不确定性"
}

形成时间线 3-5 个事件，按时间从早到晚排列。`;
}

// ---------------------------------------------------------------------------
// JSON extraction
// ---------------------------------------------------------------------------

function extractJSON(text: string): unknown {
  const block = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (block) return JSON.parse(block[1].trim());
  const s = text.indexOf('{');
  const e = text.lastIndexOf('}');
  if (s !== -1 && e > s) return JSON.parse(text.slice(s, e + 1));
  throw new Error('响应中未找到 JSON');
}

function strArr(obj: unknown, key: string): string[] {
  if (!obj || typeof obj !== 'object') return [];
  const v = (obj as Record<string, unknown>)[key];
  return Array.isArray(v) ? v.map(String) : [];
}

function parseCard(raw: unknown, lngLat: [number, number], fallback: string): AILocationCard {
  const r = raw as Record<string, unknown>;

  const timeline: TimelineEvent[] = (Array.isArray(r['形成时间线']) ? r['形成时间线'] : [])
    .map((e: unknown) => {
      const ev = e as Record<string, unknown>;
      return {
        事件: String(ev['事件'] ?? ''),
        模块: String(ev['模块'] ?? '通用/综合'),
        参数: (ev['参数'] as Record<string, unknown>) ?? {},
        ...(ev['说明'] ? { 说明: String(ev['说明']) } : {}),
      };
    });

  const vl = r['垂直拆解'];
  const layers: VerticalLayers = {
    天上: strArr(vl, '天上'),
    地面: strArr(vl, '地面'),
    地下: strArr(vl, '地下'),
  };

  return {
    _source: 'ai',
    地点ID: `ai_${lngLat[0].toFixed(3)}_${lngLat[1].toFixed(3)}`,
    名称: String(r['名称'] ?? fallback),
    坐标: [lngLat[1], lngLat[0]] as [number, number], // stored as [lat, lng]
    区位: String(r['区位'] ?? ''),
    类型标签: Array.isArray(r['类型标签']) ? r['类型标签'].map(String) : [],
    一句话: String(r['一句话'] ?? ''),
    形成时间线: timeline,
    垂直拆解: layers,
    本地注解: String(r['本地注解'] ?? ''),
    事实来源: ['AI 推测生成 · 未经核对，仅供学习参考'],
    状态: '待核对',
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type GenResult =
  | { ok: true; card: AILocationCard }
  | { ok: false; fallbackText: string };

export async function generateAICard(
  placeName: string,
  lngLat: [number, number],
  settings: AISettings,
  moduleIds: string[],
  signal?: AbortSignal,
): Promise<GenResult> {
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM },
    { role: 'user', content: buildPrompt(placeName, lngLat, moduleIds) },
  ];

  const text = await chatOnce(settings, messages, signal);

  try {
    const card = parseCard(extractJSON(text), lngLat, placeName);
    return { ok: true, card };
  } catch {
    return { ok: false, fallbackText: text };
  }
}
