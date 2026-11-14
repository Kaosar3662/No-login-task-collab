import { useT } from "../theme";

export default function BackgroundArt() {
  const { C } = useT();
  const fade = "linear-gradient(to bottom, #000 0%, #000 52%, transparent 88%)";

  return (
    <div
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}
    >
      <div style={{ position: "absolute", inset: 0, background: C.pageBg }} />
      <div
        style={{
          position:           "absolute",
          inset:              0,
          backgroundImage:    "url(/bg-girl.webp)",
          backgroundRepeat:   "no-repeat",
          backgroundPosition: "center 68%",
          backgroundSize:     "auto 62%",
          opacity:            C.isLight ? 0.22 : 0.42,
          mixBlendMode:       C.isLight ? "multiply" : "screen",
          filter:             C.isLight ? "none" : "invert(1)",
          WebkitMaskImage:    fade,
          maskImage:          fade,
        }}
      />
    </div>
  );
}
