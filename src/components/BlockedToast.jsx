import { useEffect, useState } from "react";
import { useT, PALETTE } from "../theme";
import { BLOCKED_EVENT } from "../profanity";

export default function BlockedToast() {
  const { C } = useT();
  const [show, setShow] = useState(false);

  useEffect(() => {
    let timer;
    const onBlocked = () => {
      setShow(true);
      clearTimeout(timer);
      timer = setTimeout(() => setShow(false), 3000);
    };
    window.addEventListener(BLOCKED_EVENT, onBlocked);
    return () => {
      window.removeEventListener(BLOCKED_EVENT, onBlocked);
      clearTimeout(timer);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      role="alert"
      style={{
        position:     "fixed",
        bottom:       24,
        left:         "50%",
        transform:    "translateX(-50%)",
        zIndex:       10000,
        background:   C.isLight ? "#ffffff" : C.cardBg,
        color:        C.text,
        border:       `1.5px solid ${PALETTE.coral}`,
        borderRadius: 10,
        padding:      "10px 18px",
        fontSize:     13,
        boxShadow:    "0 6px 24px rgba(0,0,0,0.25)",
      }}
    >
      That text contains words that aren't allowed here.
    </div>
  );
}
