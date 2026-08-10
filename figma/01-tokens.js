// ─────────────────────────────────────────────────────────────
// 01 — 디자인 토큰 생성
// use_figma / fileKey: HEjWMZVZ0OBZKyylUZkisI
//
// 의도적으로 변수 "모드"를 쓰지 않습니다. Figma 변수 모드는 Starter 1개,
// Professional 4개로 제한되는데 추출 모드가 5개라 어느 쪽에서도 안 들어갑니다.
// 대신 mode/{키}/{역할} 네이밍으로 단일 모드 컬렉션에 담습니다.
// ─────────────────────────────────────────────────────────────

const TOKENS = {
  hot:      { base: "#0A0503", w1: "#FF7A3C", w2: "#E23C1E", w3: "#7A1B08", accent: "#FF6A35", glow: "#FF9A5C" },
  pure:     { base: "#030E16", w1: "#BFE9FF", w2: "#5FB8E8", w3: "#0E3A57", accent: "#59B7FF", glow: "#CFEEFF" },
  cold:     { base: "#020B1C", w1: "#4FB3FF", w2: "#1560D8", w3: "#082A63", accent: "#2B8CFF", glow: "#58B4FF" },
  ice:      { base: "#02121A", w1: "#8AE3FF", w2: "#26A8D4", w3: "#06364A", accent: "#2FC6EA", glow: "#A8F0FF" },
  icewater: { base: "#020E1E", w1: "#96E1FF", w2: "#2E8CF0", w3: "#072C58", accent: "#3F9DFF", glow: "#8FD8FF" }
};

const WEATHER_TINT = {
  clear:  "#2B6FA8",
  heat:   "#C6602A",
  cloudy: "#4A5A6B",
  rain:   "#39566E",
  snow:   "#5B7C97",
  freeze: "#2E4E7A"
};

const NEUTRAL = {
  "text/primary":   "#FFFFFF",
  "text/secondary": "#FFFFFF",   // 60% 불투명도로 사용
  "surface/tabbar": "#000000",
  "line/hairline":  "#FFFFFF"    // 14% 불투명도로 사용
};

const hexToRgb = (h) => ({
  r: parseInt(h.slice(1, 3), 16) / 255,
  g: parseInt(h.slice(3, 5), 16) / 255,
  b: parseInt(h.slice(5, 7), 16) / 255
});

const existing = await figma.variables.getLocalVariableCollectionsAsync();
let col = existing.find((c) => c.name === "GUI Tokens");
if (!col) col = figma.variables.createVariableCollection("GUI Tokens");

const known = await figma.variables.getLocalVariablesAsync("COLOR");
const byName = new Map(known.filter((v) => v.variableCollectionId === col.id).map((v) => [v.name, v]));
const modeId = col.modes[0].modeId;
const created = [];

function put(name, hex, scopes) {
  let v = byName.get(name);
  if (!v) {
    v = figma.variables.createVariable(name, col, "COLOR");
    created.push(name);
  }
  v.scopes = scopes;
  v.setValueForMode(modeId, hexToRgb(hex));
  return v.id;
}

const ids = {};

for (const [key, t] of Object.entries(TOKENS)) {
  ids[key + "/base"]   = put(`mode/${key}/base`,   t.base,   ["FRAME_FILL", "SHAPE_FILL"]);
  ids[key + "/wave-1"] = put(`mode/${key}/wave-1`, t.w1,     ["SHAPE_FILL", "STROKE_COLOR"]);
  ids[key + "/wave-2"] = put(`mode/${key}/wave-2`, t.w2,     ["SHAPE_FILL", "STROKE_COLOR"]);
  ids[key + "/wave-3"] = put(`mode/${key}/wave-3`, t.w3,     ["SHAPE_FILL", "STROKE_COLOR"]);
  ids[key + "/accent"] = put(`mode/${key}/accent`, t.accent, ["FRAME_FILL", "SHAPE_FILL", "TEXT_FILL"]);
  ids[key + "/glow"]   = put(`mode/${key}/glow`,   t.glow,   ["EFFECT_COLOR", "STROKE_COLOR", "TEXT_FILL"]);
}

for (const [key, hex] of Object.entries(WEATHER_TINT)) {
  ids["weather/" + key] = put(`weather/${key}/tint`, hex, ["FRAME_FILL", "SHAPE_FILL"]);
}

for (const [name, hex] of Object.entries(NEUTRAL)) {
  const scopes = name.startsWith("text/")
    ? ["TEXT_FILL"]
    : name.startsWith("line/")
      ? ["STROKE_COLOR"]
      : ["FRAME_FILL", "SHAPE_FILL"];
  ids[name] = put(name, hex, scopes);
}

return {
  collectionId: col.id,
  collectionName: col.name,
  createdCount: created.length,
  created,
  totalVariables: Object.keys(ids).length,
  variableIds: ids
};
