import { useState, useEffect, useRef, Fragment } from 'react';
import type { TimelineEvent } from '../../types';
import SceneRenderer from './scenes/SceneRenderer';

interface Props {
  events: TimelineEvent[];
  locationId: string;
}

export default function FormationTimeline({ events, locationId }: Props) {
  // 0 = "before", 1..N = event index
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = events.length;

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setIdx(prev => {
          if (prev >= total) { setPlaying(false); return prev; }
          return prev + 1;
        });
      }, 1800);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, total]);

  function handlePlay() {
    if (idx >= total) setIdx(0);
    setPlaying(true);
  }

  const currentEvent = idx > 0 ? events[idx - 1] : null;

  return (
    <div>
      <SceneRenderer events={events} locationId={locationId} frameIdx={idx} />

      {/* Slider row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
        <button
          onClick={playing ? () => setPlaying(false) : handlePlay}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '1.5px solid #3E7DBA',
            background: playing ? '#3E7DBA' : 'transparent',
            color: playing ? '#fff' : '#3E7DBA',
            cursor: 'pointer', fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
          aria-label={playing ? '暂停' : '播放'}
        >
          {playing ? '⏸' : '▶'}
        </button>

        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="range"
            min={0} max={total}
            value={idx}
            onChange={e => { setPlaying(false); setIdx(Number(e.target.value)); }}
            style={{ width: '100%', accentColor: '#3E7DBA' }}
          />
          {/* Tick marks */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: -2 }}>
            <span style={{ fontSize: 9, color: '#78716C' }}>形成之前</span>
            {events.map((ev, i) => (
              <span key={i} style={{ fontSize: 9, color: '#78716C', maxWidth: 60, textAlign: 'center', lineHeight: 1.2 }}>
                {ev.事件.split('(')[0].trim()}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Current event info */}
      <div style={{ marginTop: 12, minHeight: 64 }}>
        {idx === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: '#78716C', fontStyle: 'italic' }}>
            拖动滑块或点击播放，沿时间线了解形成过程。
          </p>
        ) : currentEvent && (
          <div style={{ background: '#F7F5F2', borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: '#78716C' }}>{idx} / {total}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#1C1917' }}>{currentEvent.事件}</span>
            </div>
            <div style={{ fontSize: 11, color: '#3E7DBA', marginBottom: 6 }}>
              {currentEvent.模块}
            </div>
            {currentEvent.参数 && Object.keys(currentEvent.参数).length > 0 && (
              <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2px 12px' }}>
                {Object.entries(currentEvent.参数).map(([k, v]) => (
                  <Fragment key={k}>
                    <dt style={{ fontSize: 11, color: '#78716C', fontWeight: 500, whiteSpace: 'nowrap' }}>{k}</dt>
                    <dd style={{ fontSize: 11, color: '#292524', margin: 0 }}>{String(v)}</dd>
                  </Fragment>
                ))}
              </dl>
            )}
            {currentEvent.说明 && (
              <p style={{ margin: '6px 0 0', fontSize: 11, color: '#57534E', lineHeight: 1.6, fontStyle: 'italic' }}>
                {currentEvent.说明}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
