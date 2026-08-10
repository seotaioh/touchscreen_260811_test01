// ─────────────────────────────────────────────────────────────
// 04 — 날씨 6종 변형 + 모션 사양 보드
// use_figma / fileKey: HEjWMZVZ0OBZKyylUZkisI
//
// 실행 전: SOURCE_ID 를 03 단계가 만든 "얼음물 / 맑음" 프레임 id 로 교체하세요.
// (얼음물이 폭염 추천의 기본 모드라 날씨 변형의 기준 화면으로 적합합니다)
// ─────────────────────────────────────────────────────────────

const SOURCE_ID = "PASTE_ICEWATER_FRAME_ID_FROM_STEP_03";

const W = 1024, H = 600;

const WEATHER = [
  { key: "clear",  label: "맑음",  temp: "24°", place: "서울 강남 · 습도 41%",   tint: "#2B6FA8", a: 0.10,
    reco: "선선한 오후입니다. 정수 250ml로 가볍게 시작해 보세요." },
  { key: "heat",   label: "폭염",  temp: "36°", place: "서울 강남 · 폭염경보",   tint: "#C6602A", a: 0.14,
    reco: "폭염경보입니다. 얼음물 500ml로 체온을 낮춰 주세요." },
  { key: "cloudy", label: "흐림",  temp: "21°", place: "서울 강남 · 습도 78%",   tint: "#4A5A6B", a: 0.12,
    reco: "습도 78%. 정수 500ml로 수분을 채워 두세요." },
  { key: "rain",   label: "비",    temp: "18°", place: "서울 강남 · 시간당 4mm", tint: "#39566E", a: 0.16,
    reco: "비가 내립니다. 온수 250ml로 몸을 데워 보세요." },
  { key: "snow",   label: "눈",    temp: "−2°", place: "서울 강남 · 적설 3cm",   tint: "#5B7C97", a: 0.16,
    reco: "눈이 내립니다. 온수 120ml로 손부터 녹이세요." },
  { key: "freeze", label: "한파",  temp: "−11°", place: "서울 강남 · 한파주의보", tint: "#2E4E7A", a: 0.18,
    reco: "한파주의보입니다. 온수 500ml를 보온병에 담아 가세요." }
];

const MOTION = [
  ["배경 유체",     "3중 사인 파형이 서로 다른 속도로 위상 이동, 가산 합성",           "∞",        "linear · 무한 루프",              "상시"],
  ["배경 팔레트",   "모드 전환 시 파형 3색 + 글로우 색을 보간 전환",                   "700 ms",   "ease-in-out · 1회",               "모드 변경"],
  ["파형 진폭",     "추출 중 진폭 1.0 → 2.6배",                                       "450 ms",   "cubic-bezier(.22,1,.36,1)",       "추출 시작/종료"],
  ["모드 파티클",   "온수=수증기 / 정수=스파클 / 냉수=기포 / 얼음=조각 낙하·회전",     "∞",        "랜덤 시드 · 무한 스폰",           "모드별 상시"],
  ["날씨 파티클",   "비=사선 스트릭 / 눈=드리프트 도트 / 한파=결정 반짝임",            "∞",        "투명도 0.35 상한 · 상단 40%",     "날씨 상태"],
  ["추출량 전환",   "선택 항목 25px → 42px 확대 + 글로우",                             "260 ms",   "cubic-bezier(.22,1,.36,1)",       "탭 / 스와이프"],
  ["추출 게이지",   "밴드가 좌→우로 채워지고 숫자 실시간 카운트업",                     "용량 비례", "linear · 1회",                    "추출 중"],
  ["완료 토스트",   "하단에서 12px 떠오르며 페이드 인, 2.2초 후 소멸",                  "320 ms",   "cubic-bezier(.22,1,.36,1)",       "추출 완료"],
  ["추천 도트",     "글로우 도트 밝기 100% ↔ 32% 왕복",                                "2.6 s",    "ease-in-out · 무한 루프",         "추천 노출 중"]
];

const src = await figma.getNodeByIdAsync(SOURCE_ID);
if (!src) throw new Error("기준 프레임을 찾지 못했습니다: " + SOURCE_ID);

const hexToRgb = (h) => ({
  r: parseInt(h.slice(1, 3), 16) / 255,
  g: parseInt(h.slice(3, 5), 16) / 255,
  b: parseInt(h.slice(5, 7), 16) / 255
});
const solid = (hex, opacity) => [{ type: "SOLID", color: hexToRgb(hex), opacity: opacity === undefined ? 1 : opacity }];

// 기준 프레임이 쓰는 폰트를 로드
const seen = new Set();
let anyFont = null;
for (const t of src.findAllWithCriteria({ types: ["TEXT"] })) {
  for (const seg of t.getStyledTextSegments(["fontName"])) {
    const k = seg.fontName.family + "|" + seg.fontName.style;
    if (!seen.has(k)) { seen.add(k); await figma.loadFontAsync(seg.fontName); anyFont = anyFont || seg.fontName; }
  }
}
if (!anyFont) throw new Error("기준 프레임에 텍스트 노드가 없습니다.");

const baseY = src.y + H + 200;
const created = [];

WEATHER.forEach((w, i) => {
  const f = src.clone();
  f.name = "얼음물 / " + w.label;
  f.x = src.x + i * (W + 80);
  f.y = baseY;
  figma.currentPage.appendChild(f);

  // 날씨 틴트 워시 — 배경 바로 위, UI 아래
  const wash = figma.createRectangle();
  wash.name = "날씨 틴트 / " + w.label;
  wash.resize(W, H);
  wash.x = 0; wash.y = 0;
  wash.fills = solid(w.tint, w.a);
  f.insertChild(1, wash);

  // 상태바 칩
  const chip = f.findOne((n) => n.name === "날씨 칩");
  if (chip) {
    const ct = chip.findAllWithCriteria({ types: ["TEXT"] });
    if (ct[0]) ct[0].characters = w.temp;
    if (ct[1]) ct[1].characters = w.label;
    if (ct[2]) ct[2].characters = w.place;
  }

  // 추천 문구
  const reco = f.findOne((n) => n.name === "날씨 추천");
  if (reco) {
    const rt = reco.findAllWithCriteria({ types: ["TEXT"] });
    const body = rt.find((t) => t.characters !== "적용");
    if (body) body.characters = w.reco;
  }

  created.push({ key: w.key, name: f.name, id: f.id });
});

// ── 모션 사양 보드 ──
const board = figma.createAutoLayout("VERTICAL", { name: "동적 표현 사양", itemSpacing: 0 });
board.fills = solid("#080D15");
board.strokes = solid("#1A2534");
board.strokeWeight = 1;
board.cornerRadius = 12;
board.paddingTop = 28; board.paddingBottom = 28;
board.paddingLeft = 28; board.paddingRight = 28;
figma.currentPage.appendChild(board);
board.x = src.x;
board.y = baseY + H + 200;

function row(cells, opts) {
  const r = figma.createAutoLayout("HORIZONTAL", { name: "행", itemSpacing: 0 });
  r.fills = [];
  r.paddingTop = opts.head ? 0 : 11;
  r.paddingBottom = 11;
  board.appendChild(r);
  r.layoutSizingHorizontal = "FIXED";
  r.resize(1320, r.height);
  const widths = [180, 470, 130, 300, 240];
  cells.forEach((c, i) => {
    const t = figma.createText();
    t.fontName = anyFont;
    t.characters = c;
    t.fontSize = opts.head ? 11 : 14;
    t.fills = solid(opts.head ? "#64798F" : "#DCEEF7", opts.head ? 1 : (i === 0 ? 1 : 0.78));
    if (opts.head) t.letterSpacing = { unit: "PERCENT", value: 12 };
    t.textAutoResize = "HEIGHT";
    r.appendChild(t);
    t.layoutSizingHorizontal = "FIXED";
    t.resize(widths[i] - 16, t.height);
  });
  return r;
}

const heading = figma.createText();
heading.fontName = anyFont;
heading.characters = "동적 표현 사양 — 한우물 이동형 얼음정수기 GUI";
heading.fontSize = 24;
heading.fills = solid("#DCEEF7");
board.appendChild(heading);

const gap = figma.createFrame();
gap.name = "여백";
gap.resize(1320, 20);
gap.fills = [];
board.appendChild(gap);

row(["레이어", "동작", "지속", "이징 / 루프", "트리거"], { head: true });
MOTION.forEach((m) => row(m, { head: false }));

return {
  createdNodeIds: created.map((c) => c.id).concat([board.id]),
  weatherScreens: created,
  specBoardId: board.id
};
