// Maps type tag strings (or substrings) to hex colors per CLAUDE.md §4
const TAG_COLORS: [string, string][] = [
  ['火山与板块', '#D85A30'],
  ['造山与构造', '#8B6B4E'],
  ['沉积地层',   '#8B6B4E'],
  ['流水',       '#3E7DBA'], // matches both "流水" and "流水侵蚀"
  ['冰川',       '#5FB3C9'],
  ['喀斯特',     '#4E9444'],
  ['风与干旱',   '#C98A26'],
  ['气候与生物', '#1D9E75'],
];

export function tagColor(tag: string): string {
  for (const [key, color] of TAG_COLORS) {
    if (tag.includes(key)) return color;
  }
  return '#78716C';
}

// Return the display color for a location (first matching tag wins)
export function locationColor(tags: string[]): string {
  for (const tag of tags) {
    const c = tagColor(tag);
    if (c !== '#78716C') return c;
  }
  return '#78716C';
}
