import { createContext, useContext } from "react";

export const PALETTE = {
  coral:  "#FF4D5E",
  yellow: "#FFD000",
  mint:   "#5EFF00",
  brand:  "#FF7B00",
};

export const LIGHT = {
  pageBg:          "#f5f5f5",
  headerBg:        "rgba(255,255,255,0.85)",
  headerBlur:      "blur(16px)",
  headerBorder:    "#e4e4e4",
  colBg:           "#ffffff",
  colBgSoft:       "rgba(255,255,255,0.8)",
  colHdr:          "#fafafa",
  colShadow:       "none",
  cardBg:          "#ffffff",
  cardHover:       "#f5f5f5",
  cardShadow:      "none",
  cardShadowHover: "none",
  border:          "#e4e4e4",
  borderLit:       "#cfcfcf",
  text:            "#111111",
  muted:           "#6b6b6b",
  accent:          "#E5333F",
  tag:             "#efefef",
  isLight:         true,
};

export const DARK = {
  pageBg:          "#0a0a0a",
  headerBg:        "rgba(10,10,10,0.85)",
  headerBlur:      "blur(16px)",
  headerBorder:    "#2a2a2a",
  colBg:           "#131313",
  colBgSoft:       "rgba(19,19,19,0.8)",
  colHdr:          "#0f0f0f",
  colShadow:       "none",
  cardBg:          "#1b1b1b",
  cardHover:       "#242424",
  cardShadow:      "none",
  cardShadowHover: "none",
  border:          "#303030",
  borderLit:       "#454545",
  text:            "#ffffff",
  muted:           "#b3b3b3",
  accent:          "#FF7B00",
  tag:             "#0f0f0f",
  isLight:         false,
};

export const THEME_RING = [PALETTE.mint, "#00D1FF", "#FF3DA5", PALETTE.brand, "#B66DFF", PALETTE.yellow, "#3D7BFF", PALETTE.coral];

const PALETTES = {
  dark: {
    base:  { coral: "#FF4D5E", yellow: "#FFD000", mint: "#5EFF00", brand: "#FF7B00" },
    extra: ["#00D1FF", "#FF3DA5", "#B66DFF", "#3D7BFF"],
  },
  light: {
    base:  { coral: "#F38181", yellow: "#FCE38A", mint: "#A8E6A1", brand: "#E5333F" },
    extra: ["#9AD7F0", "#F4A6C8", "#C4B5F5", "#9DB8F5"],
  },
};

export function setPalette(mode, o = {}) {
  const { base, extra } = PALETTES[mode] ?? PALETTES.dark;
  const pick = (k, d) => (isHex(o[k]) ? o[k] : d);
  const p = {
    coral:  pick("critical", base.coral),
    yellow: pick("high",     base.yellow),
    mint:   pick("medium",   base.mint),
    brand:  pick("accent",   base.brand),
  };
  Object.assign(PALETTE, p, { low: pick("low", p.brand) });
  const ring = [p.mint, extra[0], extra[1], p.brand, extra[2], p.yellow, extra[3], p.coral];
  THEME_RING.splice(0, ring.length, ...ring.map((c, i) => pick("list" + i, c)));
  CURSOR_COLORS.splice(0, CURSOR_DEFAULTS.length, ...CURSOR_DEFAULTS.map((c, i) => pick("cur" + i, c)));
}

const isHex = (v) => /^#[0-9a-f]{6}$/i.test(v ?? "");

function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

function isLightColor(hex) {
  const n = parseInt(hex.slice(1), 16);
  return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 150;
}

export function buildTheme(base, o = {}) {
  const t = { ...base };
  if (isHex(o.page)) {
    t.pageBg   = o.page;
    t.headerBg = rgba(o.page, 0.85);
    t.isLight  = isLightColor(o.page);
  }
  if (isHex(o.column)) {
    t.colBg     = o.column;
    t.colBgSoft = rgba(o.column, 0.8);
    t.colHdr    = o.column;
  }
  if (isHex(o.card)) {
    t.cardBg    = o.card;
    t.cardHover = o.card;
  }
  if (isHex(o.text)) {
    t.text         = o.text;
    t.muted        = rgba(o.text, 0.6);
    t.border       = rgba(o.text, 0.15);
    t.borderLit    = rgba(o.text, 0.28);
    t.headerBorder = t.border;
  }
  if (isHex(o.accent)) t.accent = o.accent;
  return t;
}
export const CURSOR_COLORS = [
  "#5EFF00", "#00D1FF", "#FF3DA5", "#FF7B00",
  "#B66DFF", "#FFD000", "#3D7BFF", "#FF4D5E",
];

const CURSOR_DEFAULTS = [...CURSOR_COLORS];

export const ThemeCtx = createContext({});
export const useT     = () => useContext(ThemeCtx);
