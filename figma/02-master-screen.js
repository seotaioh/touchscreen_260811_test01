// ─────────────────────────────────────────────────────────────
// 02 — 마스터 화면 1장 (정수 / 맑음) 1024×600
// use_figma / fileKey: HEjWMZVZ0OBZKyylUZkisI
//
// 배경 파형은 프로토타입과 "동일한 사인 합성식"을 여기서 다시 계산해
// SVG path 로 굽습니다. 눈대중 베지어가 아니라 렌더 결과와 좌표가 일치합니다.
//   y(x) = base + A·sin(k1·x + φ) + 0.42·A·sin(k2·x − 1.45φ)
// ─────────────────────────────────────────────────────────────

const W = 1024, H = 600;
const P = { base: "#030E16", w1: "#BFE9FF", w2: "#5FB8E8", w3: "#0E3A57", accent: "#59B7FF", glow: "#CFEEFF" };

// ── 한글 지원 폰트 해석 (스타일 문자열을 절대 추측하지 않음) ──
const fonts = await figma.listAvailableFontsAsync();
const fam = {};
for (const f of fonts) (fam[f.fontName.family] ||= []).push(f.fontName.style);

const CANDIDATES = ["Pretendard", "Pretendard Variable", "Noto Sans KR", "Apple SD Gothic Neo",
                    "Spoqa Han Sans Neo", "IBM Plex Sans KR", "Nanum Gothic", "Malgun Gothic", "Inter"];
const family = CANDIDATES.find((c) => fam[c]);
if (!family) throw new Error("한글 지원 폰트를 찾지 못했습니다. 사용 가능 패밀리: " + Object.keys(fam).slice(0, 40).join(", "));

const pick = (...wanted) => wanted.find((s) => fam[family].includes(s)) || fam[family][0];
const F_BOLD  = { family, style: pick("Bold", "Semi Bold", "SemiBold", "Medium", "Regular") };
const F_MED   = { family, style: pick("Medium", "Semi Bold", "Regular") };
const F_REG   = { family, style: pick("Regular", "Light", "Medium") };
const F_LIGHT = { family, style: pick("Light", "Regular") };
for (const f of [F_BOLD, F_MED, F_REG, F_LIGHT]) await figma.loadFontAsync(f);

// ── 배경: 파형 3겹 + 중앙 글로우를 한 장의 SVG 로 ──
function wavePath(baseY, amp, k1n, k2n, phi) {
  const k1 = (k1n * Math.PI * 2) / W, k2 = (k2n * Math.PI * 2) / W;
  let d = `M0 ${H}`;
  for (let x = 0; x <= W; x += 6) {
    const y = baseY + Math.sin(x * k1 + phi) * amp + Math.sin(x * k2 - phi * 1.45) * amp * 0.42;
    d += ` L${x} ${y.toFixed(2)}`;
  }
  return d + ` L${W} ${H} Z`;
}

const layers = [
  { y: H * 0.58, amp: 15, k1: 1.5, k2: 2.9, col: P.w1, fo: 0.27, so: 0.46 },
  { y: H * 0.70, amp: 25, k1: 2.2, k2: 4.2, col: P.w2, fo: 0.21, so: 0.34 },
  { y: H * 0.82, amp: 35, k1: 2.9, k2: 5.5, col: P.w3, fo: 0.15, so: 0.22 }
];

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#010509"/><stop offset="0.5" stop-color="${P.base}"/><stop offset="1" stop-color="#000000"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.42">
      <stop offset="0" stop-color="${P.glow}" stop-opacity="0.16"/><stop offset="1" stop-color="${P.glow}" stop-opacity="0"/>
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
    const d = wavePath(l.y, l.amp, l.k1, l.k2, 0.8 + i * 0.5);
    return `<path d="${d}" fill="url(#w${i})"/><path d="${d}" fill="none" stroke="${l.col}" stroke-opacity="${l.so}" stroke-width="1.1"/>`;
  }).join("")}
</svg>`;

// ── 루트 프레임 (기존 콘텐츠와 겹치지 않게 오른쪽으로 배치) ──
const page = figma.currentPage;
const right = page.children.reduce((m, n) => Math.max(m, n.x + n.width), 0);
const startX = page.children.length ? right + 160 : 120;

const root = figma.createFrame();
root.name = "정수 / 맑음";
root.resize(W, H);
root.x = startX; root.y = 120;
root.clipsContent = true;
root.cornerRadius = 0;
root.fills = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }];
page.appendChild(root);
root.placeholder = true;

const bg = figma.createNodeFromSvg(svg);
bg.name = "배경 / 유체";
bg.x = 0; bg.y = 0;
root.appendChild(bg);

// ── 헬퍼 ──
const hexToRgb = (h) => ({
  r: parseInt(h.slice(1, 3), 16) / 255,
  g: parseInt(h.slice(3, 5), 16) / 255,
  b: parseInt(h.slice(5, 7), 16) / 255
});
const solid = (hex, opacity) => [{ type: "SOLID", color: hexToRgb(hex), opacity: opacity === undefined ? 1 : opacity }];

function text(chars, font, size, hex, opacity) {
  const t = figma.createText();
  t.fontName = font;
  t.characters = chars;
  t.fontSize = size;
  t.fills = solid(hex, opacity);
  t.textAutoResize = "WIDTH_AND_HEIGHT";
  return t;
}

const ids = { root: root.id, bg: bg.id };

// ── 1. 상태바 ──
const status = figma.createAutoLayout("HORIZONTAL", { name: "상태바", itemSpacing: 16 });
status.primaryAxisAlignItems = "SPACE_BETWEEN";
status.counterAxisAlignItems = "MIN";
status.fills = [];
root.appendChild(status);
status.x = 0; status.y = 24;
status.layoutSizingHorizontal = "FIXED";
status.resize(W, status.height);
status.paddingLeft = 28; status.paddingRight = 28;

const clock = text("09:30 AM", F_LIGHT, 33, "#FFFFFF");
status.appendChild(clock);

const chip = figma.createAutoLayout("HORIZONTAL", { name: "날씨 칩", itemSpacing: 9 });
chip.paddingLeft = 10; chip.paddingRight = 14; chip.paddingTop = 7; chip.paddingBottom = 7;
chip.cornerRadius = 999;
chip.counterAxisAlignItems = "CENTER";
chip.fills = solid("#08101A", 0.5);
chip.strokes = solid("#FFFFFF", 0.16);
chip.strokeWeight = 1;
status.appendChild(chip);
chip.appendChild(text("24°", F_BOLD, 19, "#FFFFFF"));
const chipMeta = figma.createAutoLayout("VERTICAL", { name: "메타", itemSpacing: 1 });
chipMeta.fills = [];
chip.appendChild(chipMeta);
chipMeta.appendChild(text("맑음", F_MED, 11, "#FFFFFF"));
chipMeta.appendChild(text("서울 강남 · 습도 41%", F_REG, 11, "#FFFFFF", 0.72));

const sys = text("≋   ☰", F_REG, 26, "#FFFFFF");
sys.name = "시스템 아이콘 (실제 제작 시 벡터로 교체)";
status.appendChild(sys);
ids.status = status.id;

// ── 2. 스테이지 ──
const stage = figma.createAutoLayout("VERTICAL", { name: "스테이지", itemSpacing: 11 });
stage.counterAxisAlignItems = "CENTER";
stage.fills = [];
root.appendChild(stage);

const reco = figma.createAutoLayout("HORIZONTAL", { name: "날씨 추천", itemSpacing: 9 });
reco.paddingLeft = 12; reco.paddingRight = 14; reco.paddingTop = 7; reco.paddingBottom = 7;
reco.cornerRadius = 999;
reco.counterAxisAlignItems = "CENTER";
reco.fills = solid("#FFFFFF", 0.07);
reco.strokes = solid("#FFFFFF", 0.12);
reco.strokeWeight = 1;
stage.appendChild(reco);
const dot = figma.createEllipse();
dot.resize(7, 7);
dot.fills = solid(P.glow);
reco.appendChild(dot);
reco.appendChild(text("선선한 오후입니다. 정수 250ml로 가볍게 시작해 보세요.", F_REG, 14, "#FFFFFF", 0.9));
reco.appendChild(text("적용", F_MED, 12, P.glow));

const titleRow = figma.createAutoLayout("HORIZONTAL", { name: "모드 타이틀", itemSpacing: 4 });
titleRow.counterAxisAlignItems = "CENTER";
titleRow.fills = [];
stage.appendChild(titleRow);
titleRow.appendChild(text("정수", F_BOLD, 88, "#FFFFFF"));
const cfg = figma.createEllipse();
cfg.resize(46, 46);
cfg.fills = solid(P.accent);
cfg.name = "추출 설정";
titleRow.appendChild(cfg);

stage.appendChild(text("상온 19°C · 잔여 필터 82%", F_REG, 16, "#FFFFFF", 0.6));

stage.x = (W - stage.width) / 2;
stage.y = 150;
ids.stage = stage.id;

// ── 3. 추출량 밴드 ──
const band = figma.createAutoLayout("HORIZONTAL", { name: "추출량 밴드", itemSpacing: 45 });
band.counterAxisAlignItems = "CENTER";
band.primaryAxisAlignItems = "CENTER";
band.fills = solid(P.accent, 0.12);
band.strokes = solid("#FFFFFF", 0.14);
band.strokeWeight = 1;
band.strokeAlign = "INSIDE";
band.strokeTopWeight = 1; band.strokeBottomWeight = 1;
band.strokeLeftWeight = 0; band.strokeRightWeight = 0;
band.paddingTop = 15; band.paddingBottom = 15;
root.appendChild(band);
[["120", false], ["250", false], ["500", true], ["1000", false], ["연속", false]].forEach(([label, on]) => {
  const t = text(label + (label === "연속" ? "" : "ml"), on ? F_MED : F_REG, on ? 42 : 25, "#FFFFFF", on ? 1 : 0.62);
  t.name = "추출량 " + label + (on ? " (선택)" : "");
  band.appendChild(t);
});
band.layoutSizingHorizontal = "FIXED";
band.resize(W, band.height);
band.x = 0;
band.y = 600 - 86 - band.height;
ids.band = band.id;

// ── 4. 탭바 ──
const tabs = figma.createAutoLayout("HORIZONTAL", { name: "탭바", itemSpacing: 0 });
tabs.fills = solid("#000000");
tabs.paddingTop = 15; tabs.paddingBottom = 14;
tabs.counterAxisAlignItems = "CENTER";
root.appendChild(tabs);
["온수", "정수", "냉수", "얼음", "얼음물"].forEach((label) => {
  const cell = figma.createAutoLayout("VERTICAL", { name: "탭 / " + label, itemSpacing: 6 });
  cell.counterAxisAlignItems = "CENTER";
  cell.fills = [];
  tabs.appendChild(cell);
  cell.layoutSizingHorizontal = "FILL";
  const on = label === "정수";
  const icon = text("◆", F_REG, 30, on ? P.glow : "#FFFFFF", on ? 1 : 0.55);
  icon.name = "아이콘 자리 (실제 제작 시 벡터로 교체)";
  cell.appendChild(icon);
  cell.appendChild(text(label, F_REG, 13, on ? P.glow : "#FFFFFF", on ? 1 : 0.55));
});
tabs.layoutSizingHorizontal = "FIXED";
tabs.resize(W, tabs.height);
tabs.x = 0;
tabs.y = H - tabs.height;
ids.tabs = tabs.id;

root.placeholder = false;

return {
  createdNodeIds: Object.values(ids),
  ids,
  fontUsed: family,
  styles: { bold: F_BOLD.style, medium: F_MED.style, regular: F_REG.style, light: F_LIGHT.style },
  note: "다음 단계: 03-mode-variants.js 로 이 프레임을 4벌 복제 후 팔레트/문구 교체"
};
