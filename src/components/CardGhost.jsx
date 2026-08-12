import { useT, PALETTE } from "../theme";
import { getPriority } from "../constants";

export default function CardGhost({ card }) {
  const { C } = useT();
  const prio = getPriority(card.priority);
  return (
    <div style={{
      background:    C.isLight ? "#ffffff" : "#2c2c58",
      border:        `2px solid ${prio.color || PALETTE.teal}`,
      borderRadius:  8,
      overflow:      "hidden",
      width:         228,
      boxShadow:     "0 18px 50px rgba(0,0,0,0.25)",
      transform:     "rotate(1.5deg) scale(1.03)",
      opacity:       0.93,
      pointerEvents: "none",
    }}>
      {card.image && (
        <img
          src={card.image}
          alt=""
          style={{ width: "100%", maxHeight: 100, objectFit: "cover", display: "block" }}
        />
      )}
      <p style={{ fontSize: 13, color: C.text, margin: 0, padding: "9px 10px" }}>
        {card.title}
      </p>
    </div>
  );
}
