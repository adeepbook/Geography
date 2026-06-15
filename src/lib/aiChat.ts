import type { AISettings } from '../hooks/useAISettings';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/** Collect the full streamed response into a single string. */
export async function chatOnce(
  settings: AISettings,
  messages: ChatMessage[],
  signal?: AbortSignal,
): Promise<string> {
  let acc = '';
  await streamChat(settings, messages, (d) => { acc += d; }, signal);
  return acc;
}

/**
 * Call an OpenAI-compatible streaming API.
 * Calls `onDelta` with each incremental text chunk.
 * Throws on network/API errors (including non-2xx responses).
 */
export async function streamChat(
  settings: AISettings,
  messages: ChatMessage[],
  onDelta: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const base = settings.baseUrl.replace(/\/$/, '');
  const url = `${base}/v1/chat/completions`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({ model: settings.model, messages, stream: true }),
    signal,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `API 错误 ${res.status}${body ? '：' + body.slice(0, 300) : ''}`,
    );
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('响应体为空');

  const dec = new TextDecoder();
  let buf = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    // Split on newlines; keep incomplete last line in buffer
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (payload === '[DONE]') return;
      try {
        const delta = JSON.parse(payload).choices?.[0]?.delta?.content;
        if (typeof delta === 'string') onDelta(delta);
      } catch { /* skip malformed SSE line */ }
    }
  }
}
