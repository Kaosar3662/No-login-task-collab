import { useState, useMemo, useRef } from "react";
import { useT, PALETTE } from "../theme";
import { inputStyle as baseInput } from "../utils";
import { isPublicKey, saveLiveblocksKey, ROOM_BASE } from "../config";
import { cryptoAvailable, randomCode, MIN_PASSWORD_LENGTH } from "../crypto";
import { downloadText } from "../boardCopy";
import { chooseOpen, protectBoard, unlock } from "../lobby";
import { WeboceanLogo } from "./ui";
import { DEFAULT_BRAND, MAX_BRAND } from "../brand";

export function Shell({ title, subtitle, children, wide = false }) {
  const { C } = useT();
  return (
    <div style={{
      position: "relative", zIndex: 1, minHeight: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center", padding: 16, boxSizing: "border-box",
    }}>
      <div style={{
        width: `min(${wide ? 580 : 440}px, 100%)`, background: C.colBg, color: C.text,
        border: `1px solid ${C.border}`, borderRadius: 14, padding: 26,
        boxShadow: "0 12px 40px rgba(0,0,0,0.3)", boxSizing: "border-box",
      }}>
        <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.3px" }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13, color: C.muted, margin: "6px 0 0", lineHeight: 1.5 }}>{subtitle}</div>}
        <div style={{ marginTop: 18 }}>{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, hint, type = "text", value, onChange, onEnter, autoFocus, placeholder, autoComplete }) {
  const { C } = useT();
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 5 }}>{label}</div>
      <input
        type={type}
        value={value}
        autoFocus={autoFocus}
        placeholder={placeholder}
        autoComplete={autoComplete ?? (type === "password" ? "new-password" : "off")}
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && onEnter) onEnter(); }}
        style={{ ...baseInput(C), padding: "9px 10px", fontSize: 13.5, boxSizing: "border-box" }}
      />
      {hint && <div style={{ fontSize: 11.5, color: C.muted, marginTop: 4 }}>{hint}</div>}
    </label>
  );
}

export function Btn({ kind = "primary", children, onClick, disabled, full = true, submit = false }) {
  const { C } = useT();
  const styles = {
    primary: { background: PALETTE.brand, color: "#111", border: `1px solid ${PALETTE.brand}` },
    ghost:   { background: "transparent", color: C.text, border: `1px solid ${C.border}` },
    danger:  { background: "transparent", color: PALETTE.coral, border: `1px solid ${PALETTE.coral}` },
  }[kind];
  return (
    <button
      type={submit ? "submit" : "button"}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles, width: full ? "100%" : "auto", borderRadius: 8, padding: "10px 14px",
        fontSize: 13.5, fontWeight: 700, cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}

export function ErrorText({ children }) {
  if (!children) return null;
  return <div style={{ color: PALETTE.coral, fontSize: 12.5, margin: "0 0 10px" }}>{children}</div>;
}

export function Note({ children }) {
  const { C } = useT();
  return <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, margin: "0 0 12px" }}>{children}</div>;
}

const srOnly = { position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" };

export function CodeBox({ label, code, filename, saved, onSaved }) {
  const { C } = useT();
  const [status, setStatus] = useState("");
  const timer = useRef(0);
  const copy = async () => {
    clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(code);
      setStatus("Copied");
    } catch {
      setStatus("Copy failed");
    }
    timer.current = setTimeout(() => setStatus(""), 2000);
  };
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 5 }}>{label}</div>
      <div style={{
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 16, letterSpacing: 1,
        background: C.isLight ? "#f5f5f5" : "#111", border: `1px dashed ${PALETTE.brand}`,
        borderRadius: 8, padding: "12px 10px", textAlign: "center", userSelect: "all",
      }}>{code}</div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <Btn kind="ghost" onClick={copy}>{status || "Copy"}</Btn>
        <Btn kind="ghost" onClick={() => downloadText(filename, `${label}\n${code}\n\nBoard: ${ROOM_BASE}\n`, "text/plain")}>Download</Btn>
      </div>
      <span role="status" style={srOnly}>{status}</span>
      <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12.5, marginTop: 10, cursor: "pointer" }}>
        <input type="checkbox" checked={saved} onChange={(e) => onSaved(e.target.checked)} />
        I saved this code somewhere safe
      </label>
    </div>
  );
}

export function CloudinaryFields({ cloud, preset, setCloud, setPreset, locked }) {
  return (
    <>
      <Field label="Cloudinary cloud name" value={cloud} onChange={setCloud} placeholder="your-cloud-name" />
      <Field
        label="Cloudinary unsigned upload preset" value={preset} onChange={setPreset} placeholder="unsigned_preset_name"
        hint={locked ? "Set by the host's environment variables." : "Create an unsigned preset in the Cloudinary dashboard. Leave both empty to hide the image buttons."}
      />
    </>
  );
}

function ChoiceCard({ title, text, onClick, disabled }) {
  const { C } = useT();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "block", width: "100%", textAlign: "left", marginBottom: 10, padding: 14,
        background: "transparent", color: C.text, border: `1px solid ${C.border}`, borderRadius: 10,
        cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>
      <div style={{ fontSize: 12.5, color: C.muted, marginTop: 3, lineHeight: 1.5 }}>{text}</div>
    </button>
  );
}

const extractKey = (text) => /pk_[A-Za-z0-9_-]+/.exec(text || "")?.[0] ?? "";

export function KeySetupScreen({ start = "choose" }) {
  const [step, setStep] = useState(start);
  const [key, setKey] = useState("");
  const [link, setLink] = useState("");
  const [err, setErr] = useState("");

  const save = (value, message) => {
    if (!isPublicKey(value)) { setErr(message); return; }
    saveLiveblocksKey(value);
    window.location.reload();
  };

  if (step === "choose") {
    return (
      <Shell title="Welcome" subtitle="Which one describes you?">
        <ChoiceCard title="I am setting up a new board" text="You have a Liveblocks public key, or you are about to create one." onClick={() => setStep("new")} />
        <ChoiceCard title="I am joining a team board" text="Someone already set this board up and shared it with you." onClick={() => setStep("join")} />
      </Shell>
    );
  }

  if (step === "join") {
    return (
      <Shell
        title="Join a team board"
        subtitle="Ask the person who set this board up for the invite link. They can copy it from the lock icon in Board settings. Open that link, or paste it below."
      >
        <form onSubmit={(e) => { e.preventDefault(); save(extractKey(link), "That does not look like an invite link. Ask the owner to copy it again from the lock icon."); }}>
          <Field label="Invite link" value={link} onChange={(v) => { setLink(v); setErr(""); }} placeholder="https://your-site/#k=pk_..." autoFocus />
          <ErrorText>{err}</ErrorText>
          <Btn submit disabled={!link.trim()}>Join the board</Btn>
          <div style={{ height: 8 }} />
          <Btn kind="ghost" onClick={() => { setStep("choose"); setErr(""); }}>Back</Btn>
        </form>
      </Shell>
    );
  }

  return (
    <Shell
      title="Connect Liveblocks"
      subtitle="This board needs a Liveblocks public key to sync in real time. Create a free project at liveblocks.io, open API keys and copy the public key."
    >
      <form onSubmit={(e) => { e.preventDefault(); save(key, "That does not look like a Liveblocks public key. It starts with pk_."); }}>
        <Field label="Liveblocks public key" value={key} onChange={(v) => { setKey(v); setErr(""); }} placeholder="pk_dev_..." autoFocus />
        <ErrorText>{err}</ErrorText>
        <Btn submit disabled={!key.trim()}>Save and continue</Btn>
        {start === "choose" && (
          <>
            <div style={{ height: 8 }} />
            <Btn kind="ghost" onClick={() => { setStep("choose"); setErr(""); }}>Back</Btn>
          </>
        )}
      </form>
      <div style={{ height: 12 }} />
      <Note>
        Not sure where to find the key?{" "}
        <a href="https://youtu.be/Ib5fhISTeYs" target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>
          Watch the 1 minute video
        </a>.
      </Note>
      <Note>
        The key is stored in this browser. Teammates open the invite link you get next from the lock icon, or you set
        <code> VITE_LIVEBLOCKS_PUBLIC_KEY </code> on your host so nobody needs a link.
      </Note>
    </Shell>
  );
}

export function LobbyErrorScreen({ message, onRetry, onImportKey }) {
  return (
    <Shell title="Can't reach the board" subtitle={message}>
      <Btn onClick={onRetry}>Try again</Btn>
      <div style={{ height: 8 }} />
      <Btn kind="ghost" onClick={onImportKey}>Use a different Liveblocks key</Btn>
    </Shell>
  );
}

export function LoadingScreen({ text = "Connecting…" }) {
  const { C } = useT();
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      position: "fixed", inset: 0, zIndex: 5, background: C.pageBg, flexDirection: "column", gap: 12,
    }}>
      <WeboceanLogo size={22} />
      <div style={{ color: C.accent, fontSize: 13 }}>{text}</div>
    </div>
  );
}

export function WelcomeScreen({ write }) {
  const { C } = useT();
  const canPw = cryptoAvailable();
  const [step, setStep] = useState("choose");
  const setupCode    = useMemo(() => randomCode(), []);
  const recoveryCode = useMemo(() => randomCode(), []);
  const [saved, setSaved] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [cloud, setCloud] = useState("");
  const [preset, setPreset] = useState("");
  const [brand, setBrandText] = useState("");
  const [imgOn, setImgOn] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const imgReady = !imgOn || (cloud.trim() !== "" && preset.trim() !== "");
  const cloudinary = imgOn ? { cloud: cloud.trim(), preset: preset.trim() } : { cloud: "", preset: "" };

  const run = async (fn) => {
    setBusy(true); setErr("");
    try { await fn(); } catch (e) { setErr(e?.message || "Something went wrong."); setBusy(false); }
  };

  if (step === "choose") {
    return (
      <Shell title="Set up this board" subtitle="You are the first one here, so you decide how people get in. You can change this later.">
        <ChoiceCard title="Keep it open" text="Anyone with the link can view and edit. No password." onClick={() => setStep("open")} />
        <Card
          title="Protect it with a password"
          text={canPw ? "Every new browser has to enter the password first." : "Needs https or localhost, this page does not allow it."}
          onClick={() => setStep("password")}
          disabled={!canPw}
        />
      </Shell>
    );
  }

  const brandBlock = (
    <Field
      label="Board name"
      value={brand}
      onChange={(v) => setBrandText(v.slice(0, MAX_BRAND))}
      placeholder={DEFAULT_BRAND}
      hint="Shown at the top of the board and in the browser tab. You can change it later."
    />
  );

  const cloudBlock = (
    <div style={{ marginBottom: 14, padding: 12, border: `1px solid ${C.border}`, borderRadius: 10 }}>
      <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}>
        <input type="checkbox" checked={imgOn} onChange={(e) => setImgOn(e.target.checked)} style={{ marginTop: 3 }} />
        <span>
          <span style={{ fontSize: 13.5, fontWeight: 700 }}>Enable image uploads </span>
          <span style={{
            fontSize: 10.5, fontWeight: 800, padding: "2px 7px", borderRadius: 99, marginLeft: 4,
            background: PALETTE.brand, color: "#111", verticalAlign: "middle",
          }}>Recommended</span>
          <span style={{ display: "block", fontSize: 12, color: C.muted, marginTop: 3, lineHeight: 1.5 }}>
            Lets your team attach and paste images on cards. Uses a free Cloudinary account. Untick this to skip it, you can turn it on later from Board settings.
          </span>
        </span>
      </label>
      {imgOn && (
        <div style={{ marginTop: 12 }}>
          <CloudinaryFields cloud={cloud} preset={preset} setCloud={setCloud} setPreset={setPreset} />
          {!imgReady && <div style={{ fontSize: 11.5, color: C.muted }}>Fill in both fields, or untick the box to skip image uploads.</div>}
        </div>
      )}
    </div>
  );

  if (step === "open") {
    return (
      <Shell title="Keep it open" subtitle="Save this setup code. You will need it if you ever want to add a password.">
        <CodeBox label="Setup code" code={setupCode} filename="board-setup-code.txt" saved={saved} onSaved={setSaved} />
        {brandBlock}
        {cloudBlock}
        <ErrorText>{err}</ErrorText>
        <Btn disabled={!saved || busy || !imgReady} onClick={() => run(() => chooseOpen(write, setupCode, cloudinary, brand))}>
          {busy ? "Saving…" : "Open the board"}
        </Btn>
        <div style={{ height: 8 }} />
        <Btn kind="ghost" disabled={busy} onClick={() => setStep("choose")}>Back</Btn>
      </Shell>
    );
  }

  const mismatch = pw2 !== "" && pw !== pw2;
  const valid = pw.length >= MIN_PASSWORD_LENGTH && pw === pw2 && saved && imgReady;
  return (
    <Shell title="Choose a password" subtitle="Share the password with your team. If the board already has cards, they move into the protected board.">
      <form onSubmit={(e) => { e.preventDefault(); if (valid && !busy) run(() => protectBoard(write, { password: pw, recoveryCode, fromRoomId: ROOM_BASE, cloudinary, brand })); }}>
        <Field label="Password" type="password" value={pw} onChange={setPw} autoFocus hint={`At least ${MIN_PASSWORD_LENGTH} characters. A short passphrase works well.`} />
        <Field label="Repeat password" type="password" value={pw2} onChange={setPw2} />
        {mismatch && <ErrorText>The passwords do not match.</ErrorText>}
        <Note>If everyone forgets the password, this recovery code is the only way back in. There is no reset.</Note>
        <CodeBox label="Recovery code" code={recoveryCode} filename="board-recovery-code.txt" saved={saved} onSaved={setSaved} />
        {brandBlock}
        {cloudBlock}
        <ErrorText>{err}</ErrorText>
        <Btn submit disabled={!valid || busy}>
          {busy ? "Protecting…" : "Protect the board"}
        </Btn>
        <div style={{ height: 8 }} />
        <Btn kind="ghost" disabled={busy} onClick={() => setStep("choose")}>Back</Btn>
      </form>
    </Shell>
  );
}

export function PasswordGate({ lobby, onUnlocked }) {
  const [secret, setSecret] = useState("");
  const [recovery, setRecovery] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    if (!secret || busy) return;
    setBusy(true); setErr("");
    try {
      const roomId = await unlock(lobby, secret);
      if (roomId) onUnlocked(roomId);
      else { setErr(recovery ? "That recovery code is not correct." : "That password is not correct."); setBusy(false); }
    } catch (e) {
      setErr(e?.message || "Could not unlock."); setBusy(false);
    }
  };

  return (
    <Shell title="This board is protected" subtitle={recovery ? "Enter the recovery code you saved when the password was set." : "Enter the password to open the board in this browser."}>
      <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <Field
          label={recovery ? "Recovery code" : "Password"}
          type={recovery ? "text" : "password"}
          value={secret} onChange={(v) => { setSecret(v); setErr(""); }}
          autoFocus autoComplete={recovery ? "off" : "current-password"}
        />
        <ErrorText>{err}</ErrorText>
        <Btn submit disabled={!secret || busy}>{busy ? "Checking…" : "Unlock"}</Btn>
      </form>
      <div style={{ height: 10 }} />
      <button
        onClick={() => { setRecovery((r) => !r); setSecret(""); setErr(""); }}
        style={{ background: "none", border: "none", color: PALETTE.brand, cursor: "pointer", fontSize: 12.5, padding: 0 }}
      >
        {recovery ? "Use the password instead" : "Use a recovery code instead"}
      </button>
    </Shell>
  );
}

