import { useMemo } from 'react';
import type { TimelineEvent } from '../../../types';
import { W, H } from './primitives';
import { buildFrames } from './buildFrames';

interface Props {
  events: TimelineEvent[];
  locationId: string;
  frameIdx: number; // 0 = "before", 1..N = that event has happened
}

// Shared SVG defs (patterns) referenced by all frames.
function SharedDefs() {
  return (
    <defs>
      {/* Diagonal hatch for metamorphic basement */}
      <pattern id="p-hatch-meta" width="7" height="7"
        patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="7" stroke="#5A3A20" strokeWidth="1.5" />
      </pattern>
    </defs>
  );
}

export default function SceneRenderer({ events, locationId, frameIdx }: Props) {
  const frames = useMemo(
    () => buildFrames(locationId, events),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locationId],
  );

  const safeIdx = Math.min(frameIdx, frames.length - 1);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ display: 'block', borderRadius: 8, background: '#F8F6F0' }}
    >
      <SharedDefs />
      {frames.map((frame, i) => (
        <g
          key={i}
          style={{
            opacity: i === safeIdx ? 1 : 0,
            transition: 'opacity 0.65s ease',
            // pointer-events off for hidden frames avoids accidental interactions
            pointerEvents: i === safeIdx ? 'auto' : 'none',
          }}
        >
          {frame}
        </g>
      ))}
    </svg>
  );
}
