// Reusable SVG primitives for geological cross-sections.
// All elements are intended to be rendered inside a parent <svg viewBox="0 0 480 200">.
// Y increases downward; surface is typically around y=55-70.

export const W = 480;
export const H = 200;

export const C = {
  bg:           '#F8F6F0',
  sky:          '#E8EEF5',
  oceanSurf:    '#6EAEC8',
  oceanMid:     '#4A90B0',
  oceanDeep:    '#2E5878',
  limestone:    '#C8B094',
  limestoneAlt: '#D4BC9A',
  sandstone:    '#C8A46E',
  sandstoneLight:'#E0CFA0',
  shale:        '#C27A58',
  redwall:      '#B85C5C',
  metamorphic:  '#3A2818',
  hatchLine:    '#5A3A20',
  basalt:       '#3A4030',
  basaltMed:    '#4E5848',
  basaltLight:  '#606D58',
  ice:          '#C8E8F8',
  iceEdge:      '#8EC8E8',
  iceInner:     '#D8F0FC',
  river:        '#3E7DBA',
  karst:        '#8FA880',
  karstLight:   '#A8BC98',
  karstDark:    '#6A8058',
  cave:         '#1C1814',
  soil:         '#6B5030',
  ink:          '#1C1917',
  inkMed:       '#57534E',
  inkLight:     '#78716C',
  orange:       '#C97830',
  uplift:       '#D85A30',
  green:        '#5A8040',
  groundFill:   '#EDE8DF',
};

// Full-frame background rect
export function SceneBg({ fill }: { fill: string }) {
  return <rect x={0} y={0} width={W} height={H} fill={fill} />;
}

// "形成之前" centered label frame
export function PreFrame({ text, bgFill = C.sky, textColor = C.inkLight }:
  { text: string; bgFill?: string; textColor?: string }) {
  return (
    <>
      <SceneBg fill={bgFill} />
      <text x={W / 2} y={H / 2 - 10} textAnchor="middle" dominantBaseline="middle"
        fontSize={14} fill={textColor} fontStyle="italic">
        形成之前
      </text>
      <text x={W / 2} y={H / 2 + 12} textAnchor="middle" dominantBaseline="middle"
        fontSize={11} fill={textColor}>
        {text}
      </text>
    </>
  );
}

// Stage label in bottom-right corner
export function StageLabel({ n, text }: { n: number; text: string }) {
  return (
    <text x={W - 8} y={H - 8} textAnchor="end" fontSize={9} fill={C.inkLight}>
      {`${'①②③④⑤⑥⑦⑧⑨'[n - 1] ?? n} ${text}`}
    </text>
  );
}

// Metamorphic basement block (topY → H)
export function MetamorphicBasement({ topY, label = '变质基底' }: { topY: number; label?: string }) {
  return (
    <g>
      <rect x={0} y={topY} width={W} height={H - topY} fill={C.metamorphic} />
      {/* Hatch overlay — references shared pattern defined in SceneRenderer defs */}
      <rect x={0} y={topY} width={W} height={H - topY}
        fill="url(#p-hatch-meta)" opacity={0.45} />
      <text x={12} y={topY + 18} fontSize={9} fill="#C9A07A">{label}</text>
    </g>
  );
}

// Dashed unconformity line
export function UnconformityLine({ y, label = '大不整合面' }: { y: number; label?: string }) {
  return (
    <g>
      <rect x={0} y={y - 2} width={W} height={4} fill="#6B3A1F" />
      <line x1={0} y1={y} x2={W} y2={y}
        stroke={C.orange} strokeWidth={1.5} strokeDasharray="8,4" />
      <text x={10} y={y - 5} fontSize={9} fill={C.orange}>{label}</text>
    </g>
  );
}

// Stack of horizontal sedimentary strata
export interface StratumDef {
  label: string;
  fill: string;
  h: number;
}

export function HorizontalStrata({ strata, topY }: { strata: StratumDef[]; topY: number }) {
  let y = topY;
  return (
    <g>
      {strata.map((s, i) => {
        const sy = y;
        y += s.h;
        return (
          <g key={i}>
            <rect x={0} y={sy} width={W} height={s.h} fill={s.fill} />
            <line x1={0} y1={sy} x2={W} y2={sy}
              stroke="rgba(0,0,0,0.14)" strokeWidth={0.6} />
            <text x={8} y={sy + s.h / 2 + 4} fontSize={9} fill="rgba(0,0,0,0.55)">
              {s.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

// Uplift arrows on left and right flanks
export function UpliftArrows({ label = '整体抬升' }: { label?: string }) {
  return (
    <g stroke={C.uplift} strokeWidth={2} fill="none" strokeDasharray="5,3">
      {[55, W - 55].map(x => (
        <g key={x}>
          <line x1={x} y1={165} x2={x} y2={28} />
          <polyline
            points={`${x - 7},44 ${x},26 ${x + 7},44`}
            strokeDasharray="none" fill="none"
          />
        </g>
      ))}
      <text x={W / 2} y={20} textAnchor="middle" fontSize={10}
        fill={C.uplift} stroke="none">{label}</text>
    </g>
  );
}

// River canyon cut (draws a dark trapezoid shadow in the center)
export function RiverCanyon({
  centerX = W / 2,
  topY = 40,
  bottomY = 145,
  wTop = 150,
  wBottom = 90,
  riverLabel = '科罗拉多河',
  depthLabel = '≈1.6 km',
}: {
  centerX?: number; topY?: number; bottomY?: number;
  wTop?: number; wBottom?: number;
  riverLabel?: string; depthLabel?: string;
}) {
  const lTop  = centerX - wTop  / 2;
  const rTop  = centerX + wTop  / 2;
  const lBot  = centerX - wBottom / 2;
  const rBot  = centerX + wBottom / 2;
  const midY  = (topY + bottomY) / 2;

  return (
    <g>
      {/* Canyon shadow */}
      <polygon
        points={`${lTop},${topY} ${rTop},${topY} ${rBot},${bottomY} ${lBot},${bottomY}`}
        fill="rgba(25,16,8,0.58)"
      />
      {/* Left wall line */}
      <line x1={lTop} y1={topY} x2={lBot} y2={bottomY}
        stroke={C.inkMed} strokeWidth={1} />
      {/* Right wall line */}
      <line x1={rTop} y1={topY} x2={rBot} y2={bottomY}
        stroke={C.inkMed} strokeWidth={1} />
      {/* River ellipse */}
      <ellipse cx={centerX} cy={bottomY + 2} rx={wBottom / 2 - 6} ry={5}
        fill={C.river} opacity={0.88} />
      <text x={centerX} y={bottomY + 2} textAnchor="middle" fontSize={8}
        fill="#fff" dominantBaseline="middle">{riverLabel}</text>
      {/* Depth annotation */}
      <line x1={rTop + 4} y1={topY} x2={rTop + 4} y2={bottomY}
        stroke={C.inkLight} strokeWidth={0.8} strokeDasharray="3,2" />
      <text x={rTop + 8} y={midY} fontSize={9} fill={C.inkMed}
        dominantBaseline="middle">{depthLabel}</text>
    </g>
  );
}

// Ground-level sky strip above a surface line
export function SkyStrip({ surfaceY }: { surfaceY: number }) {
  return <rect x={0} y={0} width={W} height={surfaceY} fill={C.sky} />;
}

// Ocean fill (from y=0 to seaY is sky, seaY to H is ocean)
export function OceanFill({
  seaY,
  deepColor = C.oceanMid,
  surfLabel = '海面',
}: { seaY: number; deepColor?: string; surfLabel?: string }) {
  return (
    <g>
      <rect x={0} y={seaY} width={W} height={H - seaY} fill={deepColor} />
      <line x1={0} y1={seaY} x2={W} y2={seaY}
        stroke="#3A8AB0" strokeWidth={1.2} />
      <text x={10} y={seaY - 5} fontSize={9} fill={C.inkLight}>{surfLabel}</text>
    </g>
  );
}

// Simple thin soil/weathering cap on surface
export function SoilCap({ y, thickness = 4 }: { y: number; thickness?: number }) {
  return <rect x={0} y={y} width={W} height={thickness} fill={C.soil} opacity={0.7} />;
}

// Thin ground-line rule
export function GroundLine({ y }: { y: number }) {
  return <line x1={0} y1={y} x2={W} y2={y} stroke={C.ink} strokeWidth={0.8} />;
}
