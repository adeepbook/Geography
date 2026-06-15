import yaml from 'js-yaml';
import type {
  LocationScript,
  ProcessModule,
  LocationModuleIndex,
  ContentStatus,
  ModuleStatus,
} from '../types';

// ---------------------------------------------------------------------------
// Raw file imports via Vite glob
// ---------------------------------------------------------------------------

const locationRaws = import.meta.glob('/content/locations/*.yaml', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const processRaws = import.meta.glob('/content/processes/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

// ---------------------------------------------------------------------------
// Location parsing (M2)
// ---------------------------------------------------------------------------

function mapYamlToLocation(raw: Record<string, unknown>): LocationScript {
  const vl = (raw['垂直拆解'] ?? {}) as Record<string, unknown>;
  return {
    地点ID: String(raw['地点ID'] ?? ''),
    名称: String(raw['名称'] ?? ''),
    坐标: (raw['坐标'] as [number, number]) ?? [0, 0],
    区位: String(raw['区位'] ?? ''),
    类型标签: (raw['类型标签'] as string[]) ?? [],
    一句话: String(raw['一句话'] ?? ''),
    形成时间线: ((raw['形成时间线'] as unknown[]) ?? []).map((e) => {
      const ev = e as Record<string, unknown>;
      return {
        事件: String(ev['事件'] ?? ''),
        模块: String(ev['模块'] ?? ''),
        参数: (ev['参数'] as Record<string, unknown>) ?? {},
      };
    }),
    垂直拆解: {
      天上: ((vl['天上'] as string[]) ?? []).map(String),
      地面: ((vl['地面'] as string[]) ?? []).map(String),
      地下: ((vl['地下'] as string[]) ?? []).map(String),
    },
    本地注解: String(raw['本地注解'] ?? ''),
    事实来源: ((raw['事实来源'] as unknown[]) ?? []).map(String),
    状态: (raw['状态'] as ContentStatus) ?? '起草',
  };
}

export interface LoadResult<T> {
  items: T[];
  errorCount: number;
}

export function loadLocations(): LoadResult<LocationScript> {
  const items: LocationScript[] = [];
  let errorCount = 0;

  for (const [path, content] of Object.entries(locationRaws)) {
    const filename = path.split('/').pop() ?? path;
    let docs: unknown[];

    try {
      docs = yaml.loadAll(content) as unknown[];
    } catch (err) {
      console.warn(`[content] YAML 解析失败 — ${filename}\n`, err);
      errorCount++;
      continue;
    }

    for (const doc of docs) {
      if (!doc || typeof doc !== 'object') continue;
      const raw = doc as Record<string, unknown>;
      if (!raw['地点ID']) continue;

      try {
        items.push(mapYamlToLocation(raw));
      } catch (err) {
        console.warn(
          `[content] 地点映射失败 — ${filename} / ${raw['地点ID']}\n`,
          err,
        );
        errorCount++;
      }
    }
  }

  return { items, errorCount };
}

// ---------------------------------------------------------------------------
// Process module parsing (M3)
// ---------------------------------------------------------------------------

function parseModuleBody(body: string): Record<string, string> {
  const fields: Record<string, string> = {};
  let currentKey: string | null = null;
  const currentVal: string[] = [];

  const flush = () => {
    if (currentKey !== null) {
      fields[currentKey] = currentVal.join('\n').trim();
    }
  };

  for (const line of body.split('\n')) {
    // Match "- 字段名: 值" (Chinese or ASCII field names, colon or fullwidth colon)
    const m = line.match(/^-\s+([^\n:：]+)[：:]\s*(.*)/);
    if (m) {
      flush();
      currentKey = m[1].trim();
      currentVal.length = 0;
      currentVal.push(m[2]);
    } else if (currentKey !== null) {
      currentVal.push(line);
    }
  }
  flush();

  return fields;
}

function parseListField(raw: string | undefined): string[] | undefined {
  if (!raw) return undefined;
  const s = raw.trim();
  if (s.startsWith('[') && s.endsWith(']')) {
    return s
      .slice(1, -1)
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return s ? [s] : undefined;
}

function extractModuleId(headingText: string): string | null {
  // Strip parenthetical suffixes like "(公共时间轴)" or "(补全 9)"
  const text = headingText.replace(/\s*\(.*?\)\s*$/, '').trim();
  if (!text.includes('/')) return null;
  if (/^(第|附录)/.test(text)) return null;
  return text;
}

function parseDeepProcessFile(
  content: string,
  filename: string,
): { modules: ProcessModule[]; errorCount: number } {
  const modules: ProcessModule[] = [];
  let errorCount = 0;

  const sections = content.split(/(?=^#{2,3} )/m);

  for (const section of sections) {
    const firstLine = section.split('\n')[0];
    const hm = firstLine.match(/^#{2,3}\s+(.+)/);
    if (!hm) continue;

    const moduleId = extractModuleId(hm[1]);
    if (!moduleId) continue;

    try {
      const body = section.slice(firstLine.length + 1).trim();
      const fields = parseModuleBody(body);

      modules.push({
        模块ID: moduleId,
        一句话: fields['一句话'] ?? '',
        原理讲解: fields['原理讲解'] || undefined,
        剖面画法: fields['剖面画法'] || undefined,
        动画脚本: fields['动画脚本'] || undefined,
        参数槽: parseListField(fields['参数槽']),
        子模块: parseListField(fields['子模块']),
        易错警示: fields['易错警示'] || undefined,
        事实来源: parseListField(fields['事实来源']),
        状态: (fields['状态'] as ModuleStatus) || '起草',
        rawMarkdown: body,
      });
    } catch (err) {
      console.warn(`[content] 模块解析失败 — ${filename} / ${moduleId}\n`, err);
      errorCount++;
    }
  }

  return { modules, errorCount };
}

function parseSkeletonFile(content: string): ProcessModule[] {
  const modules: ProcessModule[] = [];
  const rowRe = /^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/gm;
  let m: RegExpExecArray | null;

  while ((m = rowRe.exec(content)) !== null) {
    const id = m[1].trim();
    const desc = m[2].trim();
    if (!id.includes('/') || id === '模块ID' || /^-+$/.test(id)) continue;
    modules.push({
      模块ID: id,
      一句话: desc,
      状态: '骨架',
      rawMarkdown: '',
    });
  }

  return modules;
}

const FILE_ORDER = [
  '过程库骨架-v0.1.md',
  '过程库-阶段1深化.md',
  '过程库-阶段2深化.md',
  '过程库-阶段3补全.md',
];

export function loadProcesses(): LoadResult<ProcessModule> {
  const map = new Map<string, ProcessModule>();
  let errorCount = 0;

  const sorted = Object.entries(processRaws).sort(([a], [b]) => {
    const ai = FILE_ORDER.findIndex((f) => a.endsWith(f));
    const bi = FILE_ORDER.findIndex((f) => b.endsWith(f));
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  for (const [path, content] of sorted) {
    const filename = path.split('/').pop() ?? path;
    try {
      if (path.endsWith('过程库骨架-v0.1.md')) {
        for (const mod of parseSkeletonFile(content)) {
          map.set(mod.模块ID, mod);
        }
      } else {
        const result = parseDeepProcessFile(content, filename);
        errorCount += result.errorCount;
        for (const mod of result.modules) {
          map.set(mod.模块ID, mod);
        }
      }
    } catch (err) {
      console.warn(`[content] 过程库文件解析失败 — ${filename}\n`, err);
      errorCount++;
    }
  }

  return { items: Array.from(map.values()), errorCount };
}

// ---------------------------------------------------------------------------
// Location → Process module index
// ---------------------------------------------------------------------------

function extractModuleRefs(location: LocationScript): string[] {
  const refs = new Set<string>();

  for (const event of location.形成时间线) {
    for (const part of event.模块.split(/\s*\+\s*/)) {
      const id = part.trim();
      if (id.includes('/')) refs.add(id);
    }
  }

  const allLayers = [
    ...location.垂直拆解.天上,
    ...location.垂直拆解.地面,
    ...location.垂直拆解.地下,
  ];
  for (const item of allLayers) {
    if (item.includes('/')) {
      refs.add(item.replace(/\s*\(.*\)\s*$/, '').trim());
    }
  }

  return Array.from(refs);
}

export function buildLocationModuleIndex(
  locations: LocationScript[],
): LocationModuleIndex {
  const index: LocationModuleIndex = {};
  for (const loc of locations) {
    index[loc.地点ID] = extractModuleRefs(loc);
  }
  return index;
}
