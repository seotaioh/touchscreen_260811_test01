// ─────────────────────────────────────────────────────────────
// 03 — 나머지 4개 모드 화면 생성 (온수 / 냉수 / 얼음 / 얼음물)
// use_figma / fileKey: HEjWMZVZ0OBZKyylUZkisI
//
// 실행 전: 아래 MASTER_ID 를 02 단계가 반환한 ids.root 값으로 교체하세요.
// ─────────────────────────────────────────────────────────────

const MASTER_ID = "PASTE_ROOT_ID_FROM_STEP_02";

const W = 1024, H = 600;

const MODES = [
  { key: "hot",      label: "온수",   base: "#0A0503", w1: "#FF7A3C", w2: "#E23C1E", w3: "#7A1B08",
    accent: "#FF6A35", glow: "#FF9A5C", sub: "85°C · 분유 안심 온도 · 잠금 해제됨",
    opts: ["70", "120", "250", "500", "연속"], sel: 2, unit: "ml" },
  { key: "cold",     label: "냉수",   base: "#020B1C", w1: "#4FB3FF", w2: "#1560D8", w3: "#082A63",
    accent: "#2B8CFF", glow: "#58B4FF", sub: "4°C · 급속 냉각 완료",
    opts: ["120", "250", "500", "1000", "연속"], sel: 2, unit: "ml" },
  { key: "ice",      label: "얼음",   base: "#02121A", w1: "#8AE3FF", w2: "#26A8D4", w3: "#06364A",
    accent: "#2FC6EA", glow: "#A8F0FF", sub: "각얼음 · 제빙 대기 0분 · 저장 18개",
    opts: ["3", "6", "9", "12", "연속"], sel: 1, unit: "개" },
  { key: "icewater", label: "얼음물", base: "#020E1E", w1: "#96E1FF", w2: "#2E8CF0", w3: "#072C58",
    accent: "#3F9DFF", glow: "#8FD8FF", sub: "냉수 + 각얼음 3개 자동 배합",
    opts: ["200", "350", "500", "750", "연속"], sel: 2, unit: "ml" }
];

const master = await figma.getNodeByIdAsync(MASTER_ID);
if (!master) throw new Error("마스터 프레임을 찾지 못했습니다: " + MASTER_ID);

const hexToRgb = (h) => ({
  r: parseInt(h.slice(1, 3), 16) / 255,
  g: parseInt(h.slice(3, 5), 16) / 255,
  b: parseInt(h.slice(5, 7), 16) / 255
});
const solid = (hex, opacity) => [{ type: "SOLID", color: hexToRgb(hex), opacity: opacity === undefined ? 1 : opacity }];

function buildSvg(p) {
  const layers = [
    { y: H * 0.58, amp: 15, k1: 1.5, k2: 2.9, col: p.w1, fo: 0.27, so: 0.46 },
    { y: H * 0.70, amp: 25, k1: 2.2, k2: 4.2, col: p.w2, fo: 0.21, so: 0.34 },
    { y: H * 0.82, amp: 35, k1: 2.9, k2: 5.5, col: p.w3, fo: 0.15, so: 0.22 }
  ];
  const path = (l, phi) => {
    const k1 = (l.k1 * Math.PI * 2) / W, k2 = (l.k2 * Math.PI * 2) / W;
    let d = `M0 ${H}`;
    for (let x = 0; x <= W; x += 6) {
      const y = l.y + Math.sin(x * k1 + phi) * l.amp + Math.sin(x * k2 - phi * 1.45) * l.amp * 0.42;
      d += ` L${x} ${y.toFixed(2)}`;
    }
    return d + ` L${W} ${H} Z`;
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#010509"/><stop offset="0.5" stop-color="${p.base}"/><stop offset="1" stop-color="#000000"/>
      </linearGradient>
      <radialGradient id="glow" cx="0.5" cy="0.42" r="0.42">
        <stop offset="0" stop-color="${p.glow}" stop-opacity="0.16"/><stop offset="1" stop-color="${p.glow}" stop-opacity="0"/>
      </radialGradient>
      ${layers.map((l, i) => `<linearGradient id="w${i}" x1="0" y1="${((l.y - l.amp * 1.6) / H).toFixed(3)}" x2="0" y2="1">
        <stop offset="0" stop-color="${l.col}" stop-opacity="${l.fo}"/>
        <stop offset="0.5" stop-color="${l.col}" stop-opacity="${(l.fo * 0.3).toFixed(3)}"/>
        <stop offset="1" stop-color="${l.col}" stop-opacity="0"/>
      </linearGradient>`).join("")}
    </defs>
    <rect width="${W}" height="${H}" fill="url(#ground)"/>
    <rect width="${W}" height="${H}" fill="url(#glow)"/>
    ${layers.map((l, i) => {
      const d = path(l, 0.8 + i * 0.5);
      return `<path d="${d}" fill="url(#w${i})"/><path d="${d}" fill="none" stroke="${l.col}" stroke-opacity="${l.so}" stroke-width="1.1"/>`;
    }).join("")}
  </svg>`;
}

// 텍스트를 건드리기 전에 마스터가 실제로 쓰는 폰트를 로드 (하드코딩 금지)
const allText = master.findAllWithCriteria({ types: ["TEXT"] });
const seen = new Set();
for (const t of allText) {
  for (const seg of t.getStyledTextSegments(["fontName"])) {
    const k = seg.fontName.family + "|" + seg.fontName.style;
    if (!seen.has(k)) { seen.add(k); await figma.loadFontAsync(seg.fontName); }
  }
}

const created = [];
let x = master.x;

for (const m of MODES) {
  x += W + 80;
  const f = master.clone();
  f.name = m.label + " / 맑음";
  f.x = x; f.y = master.y;
  figma.currentPage.appendChild(f);

  // 배경 교체
  const oldBg = f.children.find((n) => n.name === "배경 / 유체");
  const newBg = figma.createNodeFromSvg(buildSvg(m));
  newBg.name = "배경 / 유체";
  newBg.x = 0; newBg.y = 0;
  f.insertChild(0, newBg);
  if (oldBg) oldBg.remove();

  // 타이틀 · 서브라인
  const titleRow = f.findOne((n) => n.name === "모드 타이틀");
  if (titleRow) {
    const h2 = titleRow.findOne((n) => n.type === "TEXT");
    if (h2) h2.characters = m.label;
    const circle = titleRow.findOne((n) => n.type === "ELLIPSE");
    if (circle) circle.fills = solid(m.accent);
  }
  const stage = f.findOne((n) => n.name === "스테이지");
  if (stage) {
    const texts = stage.findAllWithCriteria({ types: ["TEXT"] });
    const subline = texts[texts.length - 1];
    if (subline) subline.characters = m.sub;
    const applyLabel = texts.find((t) => t.characters === "적용");
    if (applyLabel) applyLabel.fills = solid(m.glow);
    const d = stage.findOne((n) => n.type === "ELLIPSE");
    if (d) d.fills = solid(m.glow);
    stage.x = (W - stage.width) / 2;
  }

  // 추출량 밴드
  const band = f.findOne((n) => n.name === "추출량 밴드");
  if (band) {
    band.fills = solid(m.accent, 0.12);
    const cells = band.children.filter((n) => n.type === "TEXT");
    cells.forEach((t, i) => {
      const on = i === m.sel;
      t.characters = m.opts[i] + (m.opts[i] === "연속" ? "" : m.unit);
      t.fontSize = on ? 42 : 25;
      t.fills = solid("#FFFFFF", on ? 1 : 0.62);
      t.name = "추출량 " + m.opts[i] + (on ? " (선택)" : "");
    });
    band.resize(W, band.height);
    band.y = H - 86 - band.height;
  }

  // 탭바 선택 상태
  const tabs = f.findOne((n) => n.name === "탭바");
  if (tabs) {
    for (const cell of tabs.children) {
      const on = cell.name === "탭 / " + m.label;
      for (const t of cell.findAllWithCriteria({ types: ["TEXT"] })) {
        t.fills = solid(on ? m.glow : "#FFFFFF", on ? 1 : 0.55);
      }
    }
  }

  created.push({ key: m.key, name: f.name, id: f.id });
}

return {
  createdNodeIds: created.map((c) => c.id),
  screens: created,
  note: "다음 단계: 04-weather-variants.js"
};
