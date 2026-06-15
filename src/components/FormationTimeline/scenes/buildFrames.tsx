import type { TimelineEvent } from '../../../types';
import {
  W, H, C,
  SceneBg, PreFrame, StageLabel, SkyStrip,
  MetamorphicBasement, UnconformityLine,
  HorizontalStrata, type StratumDef,
  UpliftArrows, RiverCanyon,
  SoilCap, GroundLine,
} from './primitives';

// ─── GC-001  大峡谷 ────────────────────────────────────────────────────────────

const GC_STRATA: StratumDef[] = [
  { label: 'Kaibab 灰岩',   fill: '#A8C4A0', h: 15 },
  { label: 'Coconino 砂岩', fill: '#E8D5A0', h: 15 },
  { label: 'Hermit 页岩',   fill: '#CC7A55', h: 15 },
  { label: 'Redwall 灰岩',  fill: '#B85C5C', h: 15 },
  { label: '碎屑岩层组',    fill: '#D4956A', h: 15 },
  { label: 'Tapeats 砂岩',  fill: '#C8A46E', h: 10 },
];
const GC_STRATA_TOP = 40;  // surface y-position when strata are deposited
const GC_UNCF_Y    = 140;  // unconformity y-position
const GC_BASE_Y    = 145;  // top of metamorphic basement

function gcFrames(): React.ReactNode[] {
  // Frame 0: ancient sea (before basement was exposed)
  const frame0 = (
    <>
      <SceneBg fill={C.oceanMid} />
      <text x={W / 2} y={H / 2 - 10} textAnchor="middle" fontSize={13}
        fill="#C8E4F4" fontStyle="italic">形成之前</text>
      <text x={W / 2} y={H / 2 + 10} textAnchor="middle" fontSize={10} fill="#8EC8E4">
        远古海洋 · 古生代之前
      </text>
    </>
  );

  // Frame 1: metamorphic basement exposed at surface
  const frame1 = (
    <>
      <SceneBg fill={C.groundFill} />
      <MetamorphicBasement topY={GC_BASE_Y} label="毗湿奴片岩 + 花岗岩侵入体 ~17亿年" />
      <SkyStrip surfaceY={GC_BASE_Y} />
      <GroundLine y={GC_BASE_Y} />
      <StageLabel n={1} text="古老基底 · 元古宙" />
    </>
  );

  // Frame 2: unconformity surface — basement eroded flat, nothing deposited yet
  const frame2 = (
    <>
      <SceneBg fill={C.groundFill} />
      <MetamorphicBasement topY={GC_BASE_Y} label="毗湿奴片岩 + 花岗岩侵入体 ~17亿年" />
      <SkyStrip surfaceY={GC_UNCF_Y} />
      <UnconformityLine y={GC_UNCF_Y} label="大不整合面 · 缺失约十余亿年" />
      <StageLabel n={2} text="大不整合" />
    </>
  );

  // Frame 3: Paleozoic strata stacked above unconformity
  const frame3 = (
    <>
      <SceneBg fill={C.groundFill} />
      <MetamorphicBasement topY={GC_BASE_Y} label="毗湿奴片岩 ~17亿年" />
      <UnconformityLine y={GC_UNCF_Y} />
      <HorizontalStrata strata={GC_STRATA} topY={GC_STRATA_TOP} />
      <SoilCap y={GC_STRATA_TOP - 3} thickness={3} />
      <SkyStrip surfaceY={GC_STRATA_TOP - 3} />
      <StageLabel n={3} text="古生代沉积 · 寒武—二叠纪" />
    </>
  );

  // Frame 4: Colorado Plateau uplifted
  const frame4 = (
    <>
      <SceneBg fill={C.groundFill} />
      <MetamorphicBasement topY={GC_BASE_Y} label="毗湿奴片岩 ~17亿年" />
      <UnconformityLine y={GC_UNCF_Y} />
      <HorizontalStrata strata={GC_STRATA} topY={GC_STRATA_TOP} />
      <SoilCap y={GC_STRATA_TOP - 3} thickness={3} />
      <SkyStrip surfaceY={GC_STRATA_TOP - 3} />
      <UpliftArrows label="科罗拉多高原整体抬升" />
      <StageLabel n={4} text="高原抬升 · 白垩纪末以来" />
    </>
  );

  // Frame 5: river incision — canyon cut
  const frame5 = (
    <>
      <SceneBg fill={C.groundFill} />
      <MetamorphicBasement topY={GC_BASE_Y} label="毗湿奴片岩" />
      <UnconformityLine y={GC_UNCF_Y} />
      <HorizontalStrata strata={GC_STRATA} topY={GC_STRATA_TOP} />
      <SoilCap y={GC_STRATA_TOP - 3} thickness={3} />
      <SkyStrip surfaceY={GC_STRATA_TOP - 3} />
      <RiverCanyon
        topY={GC_STRATA_TOP - 3}
        bottomY={GC_BASE_Y}
        wTop={150} wBottom={90}
        riverLabel="科罗拉多河" depthLabel="≈1.6 km"
      />
      <StageLabel n={5} text="河流下切 · ~500万年前至今" />
    </>
  );

  return [frame0, frame1, frame2, frame3, frame4, frame5];
}

// ─── IS-001  冰岛 ──────────────────────────────────────────────────────────────
//
// Coordinate reference (W=480, H=200, SEA_Y=90):
//   Island peak: (240, 22)
//   Left coast:  (65, 90)   Right coast: (415, 90)
//   At any y between 22 and 90:
//     left edge  = 65  + 175*(90-y)/68
//     right edge = 415 - 175*(90-y)/68

const IS_SEA_Y    = 90;
const IS_PEAK_X   = W / 2;         // 240
const IS_PEAK_Y   = 22;
const IS_LEFT_X   = 65;
const IS_RIGHT_X  = 415;

// x at a given y on the LEFT slope (22 ≤ y ≤ 90)
function islandLeftX(y: number)  { return IS_LEFT_X  + 175 * (IS_SEA_Y - y) / 68; }
// x at a given y on the RIGHT slope
function islandRightX(y: number) { return IS_RIGHT_X - 175 * (IS_SEA_Y - y) / 68; }

function isFrames(): React.ReactNode[] {
  const BASALT_FILLS = [C.basalt, C.basaltMed, C.basaltLight, C.basaltMed, C.basalt];

  // ── Full island polygon (peak, right coast → bottom, left coast) ──
  const ISLAND_PTS = [
    `${IS_PEAK_X},${IS_PEAK_Y}`,
    `${IS_RIGHT_X},${IS_SEA_Y}`,
    `${IS_RIGHT_X},${H}`,
    `${IS_LEFT_X},${H}`,
    `${IS_LEFT_X},${IS_SEA_Y}`,
  ].join(' ');

  // ── Basalt layers (below sea level, full island width there) ──
  function BasaltLayers() {
    return (
      <g>
        {BASALT_FILLS.map((fill, i) => {
          const ly = IS_SEA_Y + 14 + i * 13;
          return (
            <g key={i}>
              <rect x={IS_LEFT_X} y={ly} width={IS_RIGHT_X - IS_LEFT_X} height={11}
                fill={fill} opacity={0.55} />
              <line x1={IS_LEFT_X} y1={ly} x2={IS_RIGHT_X} y2={ly}
                stroke="rgba(0,0,0,0.2)" strokeWidth={0.7} />
            </g>
          );
        })}
      </g>
    );
  }

  // ── Ocean sides ──
  function OceanSides() {
    return (
      <g>
        <rect x={0} y={IS_SEA_Y} width={IS_LEFT_X + 5} height={H - IS_SEA_Y} fill={C.oceanMid} />
        <rect x={IS_RIGHT_X - 5} y={IS_SEA_Y} width={W - IS_RIGHT_X + 5} height={H - IS_SEA_Y} fill={C.oceanMid} />
        <line x1={0} y1={IS_SEA_Y} x2={IS_LEFT_X + 5} y2={IS_SEA_Y} stroke="#3A8AB0" strokeWidth={1} />
        <line x1={IS_RIGHT_X - 5} y1={IS_SEA_Y} x2={W} y2={IS_SEA_Y} stroke="#3A8AB0" strokeWidth={1} />
        <text x={18} y={IS_SEA_Y - 5} fontSize={9} fill={C.inkLight}>海面</text>
      </g>
    );
  }

  // Frame 0: deep ocean before any volcanism
  const frame0 = (
    <>
      <SceneBg fill={C.oceanDeep} />
      <rect x={0} y={H - 28} width={W} height={28} fill="#1E3E58" />
      <text x={W / 2} y={H / 2 - 10} textAnchor="middle" fontSize={13}
        fill="#A8D0E8" fontStyle="italic">形成之前</text>
      <text x={W / 2} y={H / 2 + 10} textAnchor="middle" fontSize={10} fill="#7AACCC">
        深洋盆地 · 大西洋中脊
      </text>
    </>
  );

  // Frame 1: ridge + hotspot, island barely emerging
  const frame1 = (
    <>
      <SceneBg fill={C.sky} />
      <rect x={0} y={IS_SEA_Y} width={W} height={H - IS_SEA_Y} fill={C.oceanMid} />
      {/* Mid-ocean ridge dome emerging from seafloor */}
      <polygon
        points={`0,${H} 70,175 150,148 195,115 ${IS_PEAK_X},${IS_SEA_Y - 4} 285,115 330,148 410,175 ${W},${H}`}
        fill={C.basalt}
      />
      {/* Tiny island tip above sea */}
      <polygon
        points={`214,${IS_SEA_Y} ${IS_PEAK_X},${IS_SEA_Y - 14} 266,${IS_SEA_Y}`}
        fill={C.basaltLight}
      />
      {/* Sea surface line */}
      <line x1={0} y1={IS_SEA_Y} x2={W} y2={IS_SEA_Y} stroke="#3A8AB0" strokeWidth={1.2} />
      <text x={10} y={IS_SEA_Y - 5} fontSize={9} fill={C.inkLight}>海面</text>
      {/* Hotspot arrow from below */}
      <line x1={IS_PEAK_X} y1={H - 5} x2={IS_PEAK_X} y2={IS_SEA_Y + 22}
        stroke={C.uplift} strokeWidth={2} strokeDasharray="5,3" />
      <polyline
        points={`${IS_PEAK_X - 6},${IS_SEA_Y + 30} ${IS_PEAK_X},${IS_SEA_Y + 18} ${IS_PEAK_X + 6},${IS_SEA_Y + 30}`}
        stroke={C.uplift} strokeWidth={2} fill="none" strokeDasharray="none"
      />
      {/* Plate divergence arrows */}
      {([155, 325] as const).map((x, i) => {
        const dir = i === 0 ? -1 : 1;
        return (
          <g key={x} stroke={C.inkMed} strokeWidth={1.5} fill="none">
            <line x1={x} y1={130} x2={x + dir * 34} y2={130} />
            <polyline
              points={`${x + dir * 24},${130 - 6} ${x + dir * 34},${130} ${x + dir * 24},${130 + 6}`}
              fill="none"
            />
          </g>
        );
      })}
      <text x={88} y={144} fontSize={8} fill={C.inkLight} textAnchor="middle">← 北美板块</text>
      <text x={392} y={144} fontSize={8} fill={C.inkLight} textAnchor="middle">欧亚板块 →</text>
      <text x={IS_PEAK_X} y={IS_SEA_Y - 22} textAnchor="middle" fontSize={8} fill={C.uplift}>地幔柱</text>
      <StageLabel n={1} text="中脊+热点叠加 · 岛屿出水" />
    </>
  );

  // Frame 2: full shield volcano above sea
  const frame2 = (
    <>
      <SceneBg fill={C.sky} />
      <OceanSides />
      <polygon points={ISLAND_PTS} fill={C.basalt} />
      <BasaltLayers />
      {/* Columnar joint suggestion on right cliff */}
      {[0, 1, 2, 3].map(i => (
        <line key={i}
          x1={IS_RIGHT_X + i * 3} y1={IS_SEA_Y}
          x2={IS_RIGHT_X + 5 + i * 3} y2={H}
          stroke={C.inkLight} strokeWidth={0.6} opacity={0.35}
        />
      ))}
      <text x={IS_PEAK_X} y={IS_SEA_Y + 28} textAnchor="middle" fontSize={9} fill="#8EA898">玄武岩层</text>
      <text x={IS_PEAK_X} y={IS_PEAK_Y + 14} textAnchor="middle" fontSize={9} fill={C.inkLight}>盾状剖面</text>
      <StageLabel n={2} text="玄武岩盾状堆积" />
    </>
  );

  // Frame 3: ice cap covering the island
  // All ice points are verified to stay inside the island silhouette.
  // At y=30: island ≈ x219–261. At y=40: ≈ x194–286. At y=52: ≈ x163–317. At y=62: ≈ x137–343.
  const ICE_OUTER = [
    `${IS_PEAK_X},14`,
    `${IS_PEAK_X + 22},30`,   // right upper slope (inside island at y=30: x≤261 ✓)
    `${IS_PEAK_X + 46},40`,   // (inside at y=40: x≤286 ✓)
    `${IS_PEAK_X + 72},52`,   // (inside at y=52: x≤317 ✓)
    `${IS_PEAK_X + 92},62`,   // right toe (inside at y=62: x≤343 ✓)
    // glacier toe, right to left
    `${IS_PEAK_X + 62},57`,
    `${IS_PEAK_X + 32},61`,
    `${IS_PEAK_X},55`,
    `${IS_PEAK_X - 32},61`,
    `${IS_PEAK_X - 62},57`,
    `${IS_PEAK_X - 92},62`,   // left toe (inside at y=62: x≥137 ✓)
    // left slope back to peak
    `${IS_PEAK_X - 72},52`,
    `${IS_PEAK_X - 46},40`,
    `${IS_PEAK_X - 22},30`,
  ].join(' ');

  const GLACIER_TOE = [
    `${IS_PEAK_X - 92},62`,
    `${IS_PEAK_X - 62},57`,
    `${IS_PEAK_X - 32},61`,
    `${IS_PEAK_X},55`,
    `${IS_PEAK_X + 32},61`,
    `${IS_PEAK_X + 62},57`,
    `${IS_PEAK_X + 92},62`,
  ].join(' ');

  const frame3 = (
    <>
      <SceneBg fill={C.sky} />
      <OceanSides />
      <polygon points={ISLAND_PTS} fill={C.basalt} />
      <BasaltLayers />
      {/* Ice cap — polygon stays inside island silhouette */}
      <polygon points={ICE_OUTER} fill={C.iceInner} stroke="none" />
      {/* Glacier terminus (ragged edge) */}
      <polyline points={GLACIER_TOE} fill="none" stroke={C.iceEdge} strokeWidth={1.5} />
      {/* Ice shading line near peak */}
      <polyline
        points={`${IS_PEAK_X - 18},26 ${IS_PEAK_X},16 ${IS_PEAK_X + 18},26`}
        fill="none" stroke={C.iceEdge} strokeWidth={0.8} opacity={0.6}
      />
      <text x={IS_PEAK_X} y={IS_PEAK_Y + 18} textAnchor="middle" fontSize={9} fill={C.inkMed}>冰盖</text>
      <text x={IS_PEAK_X - 96} y={66} fontSize={8} fill={C.inkLight} textAnchor="end">冰前缘</text>
      <StageLabel n={3} text="冰期 · 全岛披冰" />
    </>
  );

  // Frame 4: rift / graben — island torn apart
  // Horsts remain at original peak height (IS_PEAK_Y=22). Graben floor at y=62 (above sea).
  const RIFT_HALF    = 29;    // half-width of rift zone
  const RIFT_FLOOR_Y = 62;   // graben surface (above sea level)
  const RL = IS_PEAK_X - RIFT_HALF;  // 211
  const RR = IS_PEAK_X + RIFT_HALF;  // 269

  // Verify: at y=RIFT_FLOOR_Y=62, island_left ≈ 65 + 175*28/68 ≈ 137.
  // RL=211 > 137, so left fault wall is inside island. ✓

  const frame4 = (
    <>
      <SceneBg fill={C.sky} />
      <OceanSides />
      {/* Left horst */}
      <polygon
        points={`${IS_LEFT_X},${IS_SEA_Y} ${RL},${IS_PEAK_Y} ${RL},${H} ${IS_LEFT_X},${H}`}
        fill={C.basalt}
      />
      {/* Right horst */}
      <polygon
        points={`${IS_RIGHT_X},${IS_SEA_Y} ${RR},${IS_PEAK_Y} ${RR},${H} ${IS_RIGHT_X},${H}`}
        fill={C.basalt}
      />
      {/* Graben block (sunken basement) */}
      <rect x={RL} y={RIFT_FLOOR_Y} width={RR - RL} height={H - RIFT_FLOOR_Y} fill={C.basaltMed} />
      {/* Fault scarps */}
      <line x1={RL} y1={IS_PEAK_Y} x2={RL} y2={H} stroke={C.inkMed} strokeWidth={1.2} />
      <line x1={RR} y1={IS_PEAK_Y} x2={RR} y2={H} stroke={C.inkMed} strokeWidth={1.2} />
      {/* Plate divergence arrows (strong) */}
      {([125, 355] as const).map((x, i) => {
        const dir = i === 0 ? -1 : 1;
        return (
          <g key={x} stroke={C.inkMed} strokeWidth={2} fill="none">
            <line x1={x} y1={IS_SEA_Y + 28} x2={x + dir * 42} y2={IS_SEA_Y + 28} />
            <polyline
              points={`${x + dir * 30},${IS_SEA_Y + 22} ${x + dir * 42},${IS_SEA_Y + 28} ${x + dir * 30},${IS_SEA_Y + 34}`}
              fill="none"
            />
          </g>
        );
      })}
      {/* Labels */}
      <text x={IS_PEAK_X} y={RIFT_FLOOR_Y + (H - RIFT_FLOOR_Y) / 2}
        textAnchor="middle" fontSize={9} fill={C.inkLight} dominantBaseline="middle">
        地堑
      </text>
      <text x={IS_PEAK_X} y={RIFT_FLOOR_Y - 8} textAnchor="middle" fontSize={8} fill={C.inkMed}>
        辛格韦德利裂谷带
      </text>
      <text x={RL - 4} y={IS_PEAK_Y + 10} fontSize={8} fill={C.inkLight} textAnchor="end">正断层</text>
      <StageLabel n={4} text="板块持续拉开 · 裂谷发育" />
    </>
  );

  return [frame0, frame1, frame2, frame3, frame4];
}

// ─── GL-001  桂林喀斯特 ────────────────────────────────────────────────────────

// Karst tower: near-vertical sides with a rounded dome top.
function KarstTower({ cx, baseY, h, hw }: { cx: number; baseY: number; h: number; hw: number }) {
  const peakY = baseY - h;
  const r = Math.min(hw * 0.55, h * 0.4);
  return (
    <path
      d={[
        `M${cx - hw},${baseY}`,
        `L${cx - hw},${peakY + r}`,
        `Q${cx - hw},${peakY} ${cx},${peakY}`,
        `Q${cx + hw},${peakY} ${cx + hw},${peakY + r}`,
        `L${cx + hw},${baseY}`,
        'Z',
      ].join(' ')}
      fill={C.karst}
      stroke={C.ink}
      strokeWidth={0.6}
    />
  );
}

// Thin joint lines through limestone block.
function JointLines({ topY, bottomY }: { topY: number; bottomY: number }) {
  const xs = [80, 144, 208, 272, 336, 400];
  return (
    <g stroke={C.inkLight} strokeWidth={0.5} strokeDasharray="4,3" opacity={0.5}>
      {xs.map(x => <line key={x} x1={x} y1={topY} x2={x} y2={bottomY} />)}
    </g>
  );
}

function glFrames(): React.ReactNode[] {
  const SURF_Y    = 45;   // top of limestone block when uplifted
  const PLAIN_Y   = 118;  // floor of karst plain (base of towers)

  // Fixed tower positions and sizes
  const TOWERS = [
    { cx: 55,  h: 68, hw: 18 },
    { cx: 118, h: 48, hw: 16 },
    { cx: 182, h: 82, hw: 20 },
    { cx: 254, h: 56, hw: 17 },
    { cx: 330, h: 74, hw: 19 },
    { cx: 400, h: 44, hw: 15 },
    { cx: 452, h: 62, hw: 17 },
  ];

  // Frame 0: before deposition
  const frame0 = (
    <PreFrame
      key="gl0"
      text="志留纪以前 · 古生代初期地台"
      bgFill="#D4CBB8"
      textColor={C.inkMed}
    />
  );

  // Frame 1: ancient shallow sea — limestone layers forming
  const SEA_Y = 72;
  const LS_LAYERS: StratumDef[] = [
    { label: '灰岩 (新层)', fill: '#D0BC9A', h: 14 },
    { label: '灰岩',        fill: '#C8B094', h: 16 },
    { label: '灰岩',        fill: '#C4AC8C', h: 18 },
    { label: '灰岩 (底层)', fill: '#BC9E7A', h: 20 },
  ];
  const LS_TOTAL_H = LS_LAYERS.reduce((s, l) => s + l.h, 0);  // 68
  const LS_TOP = H - LS_TOTAL_H - 2;  // y=130

  const frame1 = (
    <>
      <SceneBg fill={C.oceanMid} />
      {/* Sky above sea */}
      <rect x={0} y={0} width={W} height={SEA_Y} fill={C.sky} />
      {/* Ocean water column */}
      <rect x={0} y={SEA_Y} width={W} height={LS_TOP - SEA_Y} fill={C.oceanMid} opacity={0.65} />
      {/* Limestone accumulating at seafloor */}
      <HorizontalStrata strata={LS_LAYERS} topY={LS_TOP} />
      {/* Sea surface */}
      <line x1={0} y1={SEA_Y} x2={W} y2={SEA_Y} stroke="#3A8AB0" strokeWidth={1.2} />
      <text x={10} y={SEA_Y - 5} fontSize={9} fill={C.inkLight}>海面</text>
      {/* Marine fossil dots */}
      {[110, 200, 310, 390].map(x => (
        <circle key={x} cx={x} cy={LS_TOP + 8} r={2.5}
          fill="none" stroke={C.inkLight} strokeWidth={0.8} opacity={0.55} />
      ))}
      <text x={W / 2} y={LS_TOP - 7} textAnchor="middle" fontSize={9} fill="#C8E0F4">
        浅海碳酸盐台地
      </text>
      <text x={10} y={LS_TOP + 26} fontSize={9} fill={C.inkLight}>巨厚灰岩</text>
      <StageLabel n={1} text="古海沉积 · 泥盆—石炭纪" />
    </>
  );

  // Frame 2: uplifted — limestone now at surface, joints visible
  const LIFT_STRATA: StratumDef[] = [
    { label: '灰岩', fill: '#C8B094', h: 26 },
    { label: '灰岩', fill: '#D0BC9A', h: 26 },
    { label: '灰岩', fill: '#C4AC8C', h: 26 },
    { label: '灰岩', fill: '#BC9E7A', h: 26 },
    { label: '灰岩', fill: '#B4967A', h: 22 },
  ];

  const frame2 = (
    <>
      <SceneBg fill={C.groundFill} />
      <SkyStrip surfaceY={SURF_Y} />
      <HorizontalStrata strata={LIFT_STRATA} topY={SURF_Y} />
      <SoilCap y={SURF_Y - 3} thickness={3} />
      <GroundLine y={SURF_Y} />
      <JointLines topY={SURF_Y} bottomY={H} />
      <UpliftArrows label="构造抬升 · 中生代以来" />
      <text x={W / 2} y={SURF_Y + 52} textAnchor="middle" fontSize={9} fill={C.inkLight}>
        节理发育
      </text>
      <StageLabel n={2} text="抬升出海" />
    </>
  );

  // Frame 3: tower karst (峰林) — the dramatic landscape
  const frame3 = (
    <>
      <SceneBg fill={C.sky} />
      {/* Underground limestone base */}
      <rect x={0} y={PLAIN_Y} width={W} height={H - PLAIN_Y} fill={C.limestone} />
      {/* Surface plain with vegetation */}
      <rect x={0} y={PLAIN_Y - 5} width={W} height={8} fill="#9AB880" />
      {/* Tower karst peaks */}
      {TOWERS.map((t, i) => (
        <KarstTower key={i} cx={t.cx} baseY={PLAIN_Y} h={t.h} hw={t.hw} />
      ))}
      {/* 漓江 river */}
      <line x1={0} y1={PLAIN_Y + 5} x2={W} y2={PLAIN_Y + 5}
        stroke={C.river} strokeWidth={2.5} opacity={0.7} />
      {/* Labels */}
      <text x={182} y={PLAIN_Y - 82 - 8} textAnchor="middle" fontSize={9} fill={C.inkMed}>
        峰林
      </text>
      <text x={W / 2} y={PLAIN_Y + 16} textAnchor="middle" fontSize={9} fill={C.river} opacity={0.9}>
        漓江
      </text>
      <text x={10} y={PLAIN_Y + 32} fontSize={9} fill={C.inkLight}>灰岩</text>
      <StageLabel n={3} text="湿热溶蚀 · 新生代以来" />
    </>
  );

  // Frame 4: underground cave system developing simultaneously
  const CAVES = [
    { cx: 120, cy: 148, rx: 42, ry: 15 },
    { cx: 285, cy: 155, rx: 58, ry: 18 },
    { cx: 430, cy: 152, rx: 32, ry: 13 },
  ];

  const frame4 = (
    <>
      <SceneBg fill={C.sky} />
      {/* Underground limestone */}
      <rect x={0} y={PLAIN_Y} width={W} height={H - PLAIN_Y} fill={C.limestone} />
      {/* Cave cavities */}
      {CAVES.map((cave, i) => (
        <g key={i}>
          <ellipse cx={cave.cx} cy={cave.cy} rx={cave.rx} ry={cave.ry} fill={C.cave} />
          {/* Stalactite lines */}
          {[-12, 0, 12].map(dx => (
            <line key={dx}
              x1={cave.cx + dx} y1={cave.cy - cave.ry}
              x2={cave.cx + dx} y2={cave.cy - cave.ry + 6}
              stroke={C.inkLight} strokeWidth={0.9} opacity={0.45}
            />
          ))}
        </g>
      ))}
      {/* Underground river */}
      <line x1={35} y1={H - 14} x2={W - 35} y2={H - 14}
        stroke={C.river} strokeWidth={1.8} strokeDasharray="14,6" opacity={0.6} />
      <text x={W / 2} y={H - 5} textAnchor="middle" fontSize={8} fill={C.river} opacity={0.65}>
        地下河
      </text>
      {/* Surface */}
      <rect x={0} y={PLAIN_Y - 5} width={W} height={8} fill="#9AB880" />
      {TOWERS.map((t, i) => (
        <KarstTower key={i} cx={t.cx} baseY={PLAIN_Y} h={t.h} hw={t.hw} />
      ))}
      <line x1={0} y1={PLAIN_Y + 5} x2={W} y2={PLAIN_Y + 5}
        stroke={C.river} strokeWidth={2.5} opacity={0.7} />
      {/* Cave label */}
      <text x={120} y={148} textAnchor="middle" fontSize={8} fill="#A8A29E" dominantBaseline="middle">
        溶洞
      </text>
      <text x={W / 2} y={PLAIN_Y + 16} textAnchor="middle" fontSize={9} fill={C.river} opacity={0.9}>
        漓江
      </text>
      <StageLabel n={4} text="地下溶洞同步发育" />
    </>
  );

  return [frame0, frame1, frame2, frame3, frame4];
}

// ─── Generic fallback ─────────────────────────────────────────────────────────

const FALLBACK_FILLS = ['#C8B094', '#C8A46E', '#CC7A55', '#B85C5C', '#A8C4A0', '#E8D5A0'];

function genericFrames(events: TimelineEvent[]): React.ReactNode[] {
  const frame0 = <PreFrame key="gen0" text="——" bgFill="#DDD8CE" textColor={C.inkLight} />;

  const frames = events.map((ev, i) => {
    const visibleCount = Math.min(i + 1, FALLBACK_FILLS.length);
    const usableH = H - 50;
    const layerH = usableH / FALLBACK_FILLS.length;
    return (
      <>
        <SceneBg fill={C.groundFill} />
        <SkyStrip surfaceY={28} />
        {FALLBACK_FILLS.slice(0, visibleCount).map((fill, li) => (
          <rect key={li} x={0} y={28 + li * layerH} width={W} height={layerH}
            fill={fill} opacity={0.9} />
        ))}
        {/* Dividing lines */}
        {Array.from({ length: visibleCount }).map((_, li) => (
          <line key={li} x1={0} y1={28 + li * layerH} x2={W} y2={28 + li * layerH}
            stroke="rgba(0,0,0,0.12)" strokeWidth={0.6} />
        ))}
        {/* Event label centred on the newest layer */}
        <text x={W / 2} y={28 + (visibleCount - 0.5) * layerH}
          textAnchor="middle" fontSize={11} fill={C.inkMed} dominantBaseline="middle">
          {ev.事件}
        </text>
        <text x={W / 2} y={28 + (visibleCount - 0.5) * layerH + 15}
          textAnchor="middle" fontSize={9} fill={C.inkLight} dominantBaseline="middle">
          {ev.模块}
        </text>
        <StageLabel n={i + 1} text={ev.事件.split('(')[0].trim()} />
      </>
    );
  });

  return [frame0, ...frames];
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function buildFrames(locationId: string, events: TimelineEvent[]): React.ReactNode[] {
  if (locationId === 'GC-001') return gcFrames();
  if (locationId === 'IS-001') return isFrames();
  if (locationId === 'GL-001') return glFrames();
  return genericFrames(events);
}
