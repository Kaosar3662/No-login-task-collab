import { useState, useMemo, useRef, useEffect } from "react";
import { createClient } from "@liveblocks/client";
import { useMutation } from "../liveblocks.config";
import { useT, PALETTE } from "../theme";
import { useAccess } from "../AccessContext";
import {
  LIVEBLOCKS_KEY, LOBBY_ROOM, isPublicKey, saveLiveblocksKey,
  clearSavedLiveblocksKey, hasSavedLiveblocksKey, inviteLink,
} from "../config";
import { cloudinaryEnvLocked } from "../cloudinary";
import { cryptoAvailable, randomCode, MIN_PASSWORD_LENGTH } from "../crypto";
import {
  toLive, pickBoard, makeExport, parseExport, downloadText, writeBoard, waitSynced,
} from "../boardCopy";
import { enableProtection, changePassword, removeProtection, saveCloudinary, saveBrand, isAdmin, unlockAdmin, clearAdmin } from "../lobby";
import { Field, Btn, ErrorText, Note, CodeBox, CloudinaryFields } from "./Screens";
import { DEFAULT_BRAND, MAX_BRAND } from "../brand";
import Icon from "./Icon";

function Section({ title, children }) {
  const { C } = useT();
  return (
    <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

const Gap = () => <div style={{ height: 8 }} />;

export default function SecurityMenu() {
  const { C } = useT();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Board access, images and backup"
        style={{
          background: C.isLight ? "#ececec" : "#262626", border: `1px solid ${C.border}`,
          borderRadius: 20, cursor: "pointer", padding: "4px 10px", fontSize: 14, lineHeight: 1, color: C.text,
        }}
      >
        <Icon name="lock" size={16} />
      </button>
      {open && <Dialog onClose={() => setOpen(false)} />}
    </>
  );
}

function Dialog({ onClose }) {
  const { C } = useT();
  const { mode, lobby, write, roomId } = useAccess();
  const [view, setView] = useState("home");
  const [msg, setMsg] = useState("");
  const ref = useRef(null);
  const pressedOutside = useRef(false);

  useEffect(() => { ref.current?.showModal(); }, []);

  const back = () => { setView("home"); setMsg(""); };

  const outside = (e) => {
    const r = ref.current.getBoundingClientRect();
    return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
  };
  const noClosedBy = !("closedBy" in HTMLDialogElement.prototype);

  return (
    <dialog
      ref={ref}
      closedby="any"
      aria-labelledby="board-settings-title"
      onClose={onClose}
      onPointerDown={noClosedBy ? (e) => { pressedOutside.current = outside(e); } : undefined}
      onPointerUp={noClosedBy ? (e) => { if (pressedOutside.current && outside(e)) ref.current.close(); } : undefined}
      style={{
        width: view === "home" ? "min(clamp(560px, 40vw, 900px), 100%)" : "min(clamp(500px, 32vw, 700px), 100%)",
        maxHeight: "92vh", boxSizing: "border-box", background: C.colBg, color: C.text,
        border: `1px solid ${C.border}`, borderRadius: 14, padding: "clamp(16px, 4vw, 28px)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <h2 id="board-settings-title" style={{ fontSize: 17, fontWeight: 800 }}>Board settings</h2>
        <button type="button" onClick={() => ref.current.close()} aria-label="Close" style={{ background: "none", border: "none", color: C.muted, cursor: "pointer" }}>
          <Icon name="close" size={16} />
        </button>
      </div>

      {view === "home"    && <Home mode={mode} lobby={lobby} write={write} roomId={roomId} setView={setView} msg={msg} setMsg={setMsg} />}
      {view === "protect" && <ProtectView lobby={lobby} write={write} onBack={back} />}
      {view === "change"  && <ChangeView lobby={lobby} write={write} roomId={roomId} onBack={back} />}
      {view === "remove"  && <RemoveView lobby={lobby} write={write} roomId={roomId} onBack={back} />}
      {view === "move"    && <MoveView lobby={lobby} roomId={roomId} onBack={back} />}
    </dialog>
  );
}

function Home({ mode, lobby, write, roomId, setView, msg, setMsg }) {
  const { C } = useT();
  const locked = cloudinaryEnvLocked();
  const [cloud,  setCloud]  = useState(lobby?.cloud  ?? "");
  const [preset, setPreset] = useState(lobby?.preset ?? "");
  const [brandText, setBrandText] = useState(lobby?.brand ?? "");
  const [err, setErr] = useState("");
  const fileRef = useRef();
  const [, bump] = useState(0);
  const admin = isAdmin(lobby);

  const readBoard = useMutation(({ storage }) => pickBoard(storage.toImmutable()), []);
  const replaceBoard = useMutation(({ storage }, board) => {
    storage.set("categories", toLive(board.categories));
    storage.set("columns",    toLive(board.columns));
  }, []);

  const doExport = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadText(`board-${stamp}.json`, makeExport(readBoard()));
    setMsg("Board exported. The file is not encrypted, keep it somewhere private.");
  };

  const doImport = async (file) => {
    if (!file) return;
    setErr("");
    try {
      const board = parseExport(await file.text());
      if (!window.confirm(`Replace the whole board with the ${board.columns.length} lists in this file? This cannot be undone.`)) return;
      replaceBoard(board);
      setMsg("Board imported.");
    } catch (e) {
      setErr(e?.message || "Could not import that file.");
    }
  };

  const doSaveCloud = () => {
    saveCloudinary(write, { cloud, preset });
    setMsg(cloud && preset ? "Image uploads saved for everyone on this board." : "Image uploads turned off.");
  };

  const doSaveBrand = () => {
    saveBrand(write, brandText);
    setMsg(brandText.trim() ? "Board name saved for everyone." : "Board name reset to the default.");
  };

  const copyInvite = async () => {
    try { await navigator.clipboard.writeText(inviteLink()); setMsg("Invite link copied."); } catch { setErr("Could not copy the link."); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 10 }}>
      {(msg || err) && (
        <div>
          {msg && <div style={{ fontSize: 12.5, color: PALETTE.mint, margin: "8px 0 0" }}>{msg}</div>}
          <ErrorText>{err}</ErrorText>
        </div>
      )}

      <Section title="Access">
        <div style={{ fontSize: 13, marginBottom: admin ? 8 : 0 }}>
          {mode === "protected" ? "This board is protected with a password." : "This board is open. Anyone with the link can edit."}
        </div>
        {admin && (mode === "open" ? (
          <Btn kind="ghost" disabled={!cryptoAvailable()} onClick={() => setView("protect")}>Add a password</Btn>
        ) : (
          <>
            <Btn kind="ghost" onClick={() => setView("change")}>Change password</Btn>
            <Gap />
            <Btn kind="danger" onClick={() => setView("remove")}>Remove password</Btn>
          </>
        ))}
      </Section>

      {admin && (
        <Section title="Board name">
          <Field label="Name" value={brandText} onChange={(v) => setBrandText(v.slice(0, MAX_BRAND))} placeholder={DEFAULT_BRAND} />
          <Btn kind="ghost" onClick={doSaveBrand}>Save board name</Btn>
        </Section>
      )}

      {admin && <Section title="Image uploads">
        <CloudinaryFields cloud={locked ? "(set by host)" : cloud} preset={locked ? "(set by host)" : preset} setCloud={setCloud} setPreset={setPreset} locked={locked} />
        {!locked && <Btn kind="ghost" onClick={doSaveCloud}>Save image settings</Btn>}
      </Section>}

      <Section title="Backup">
        <Note>Board exports are plain JSON, not encrypted.{admin ? " Importing replaces the current board." : ""}</Note>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn kind="ghost" onClick={doExport}>Export JSON</Btn>
          {admin && <Btn kind="ghost" onClick={() => fileRef.current?.click()}>Import JSON</Btn>}
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: "none" }}
          onChange={(e) => { doImport(e.target.files[0]); e.target.value = ""; }} />
      </Section>

      <Section title="Liveblocks account">
        <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 8 }}>
          Key in use: <code>{LIVEBLOCKS_KEY.slice(0, 12)}…</code>
        </div>
        <Btn kind="ghost" onClick={copyInvite}>Copy invite link</Btn>
        {admin && (
          <>
            <Gap />
            <Btn kind="ghost" onClick={() => setView("move")}>Move to a new account</Btn>
          </>
        )}
        {admin && hasSavedLiveblocksKey() && (
          <>
            <Gap />
            <Btn kind="ghost" onClick={() => { clearSavedLiveblocksKey(); window.location.reload(); }}>Forget the key saved in this browser</Btn>
          </>
        )}
      </Section>

      <Section title="Admin tools">
        {admin ? (
          <>
            <Note>Admin tools are unlocked in this browser: password, image settings, import and moving accounts.</Note>
            <Btn kind="ghost" onClick={() => { clearAdmin(); bump((n) => n + 1); }}>Lock admin tools</Btn>
          </>
        ) : (
          <AdminUnlock lobby={lobby} mode={mode} onDone={() => { setMsg("Admin tools unlocked."); bump((n) => n + 1); }} />
        )}
      </Section>
    </div>
  );
}

function AdminUnlock({ lobby, mode, onDone }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const label = mode === "protected" ? "Recovery code" : "Setup code";
  const submit = async () => {
    if (!code || busy) return;
    setBusy(true); setErr("");
    try {
      if (await unlockAdmin(lobby, code)) onDone();
      else setErr(`That ${label.toLowerCase()} is not correct.`);
    } catch (e) { setErr(e?.message || "Could not check the code."); }
    setBusy(false);
  };
  return (
    <>
      <Note>Changing the password, image settings, importing a board and moving accounts need the {label.toLowerCase()}.</Note>
      <Field label={label} value={code} onChange={(v) => { setCode(v); setErr(""); }} onEnter={submit} />
      <ErrorText>{err}</ErrorText>
      <Btn kind="ghost" disabled={!code || busy} onClick={submit}>{busy ? "Checking…" : "Unlock admin tools"}</Btn>
    </>
  );
}

function ProtectView({ lobby, write, onBack }) {
  const recoveryCode = useMemo(() => randomCode(), []);
  const [setupCode, setSetupCode] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const valid = setupCode && pw.length >= MIN_PASSWORD_LENGTH && pw === pw2 && saved;

  const submit = async () => {
    setBusy(true); setErr("");
    try { await enableProtection(write, lobby, { setupCode, password: pw, recoveryCode }); }
    catch (e) { setErr(e?.message || "Something went wrong."); setBusy(false); }
  };

  return (
    <div style={{ marginTop: 12 }}>
      <Note>The setup code is the one you saved when you chose to keep the board open. The current cards move into the protected board.</Note>
      <Field label="Setup code" value={setupCode} onChange={setSetupCode} autoFocus />
      <Field label="New password" type="password" value={pw} onChange={setPw} hint={`At least ${MIN_PASSWORD_LENGTH} characters.`} />
      <Field label="Repeat password" type="password" value={pw2} onChange={setPw2} />
      {pw2 && pw !== pw2 && <ErrorText>The passwords do not match.</ErrorText>}
      <CodeBox label="Recovery code" code={recoveryCode} filename="board-recovery-code.txt" saved={saved} onSaved={setSaved} />
      <ErrorText>{err}</ErrorText>
      <Btn disabled={!valid || busy} onClick={submit}>{busy ? "Protecting…" : "Protect the board"}</Btn>
      <Gap />
      <Btn kind="ghost" disabled={busy} onClick={onBack}>Back</Btn>
    </div>
  );
}

function ChangeView({ lobby, write, roomId, onBack }) {
  const recoveryCode = useMemo(() => randomCode(), []);
  const [current, setCurrent] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const valid = current && pw.length >= MIN_PASSWORD_LENGTH && pw === pw2 && saved;

  const submit = async () => {
    setBusy(true); setErr("");
    try { await changePassword(write, lobby, { current, password: pw, recoveryCode, currentRoomId: roomId }); }
    catch (e) { setErr(e?.message || "Something went wrong."); setBusy(false); }
  };

  return (
    <div style={{ marginTop: 12 }}>
      <Note>Everyone else will be asked for the new password. Changing it also makes a new recovery code, and the old one stops working.</Note>
      <Field label="Current password" type="password" value={current} onChange={setCurrent} autoFocus autoComplete="current-password" />
      <Field label="New password" type="password" value={pw} onChange={setPw} hint={`At least ${MIN_PASSWORD_LENGTH} characters.`} />
      <Field label="Repeat new password" type="password" value={pw2} onChange={setPw2} />
      {pw2 && pw !== pw2 && <ErrorText>The passwords do not match.</ErrorText>}
      <CodeBox label="New recovery code" code={recoveryCode} filename="board-recovery-code.txt" saved={saved} onSaved={setSaved} />
      <ErrorText>{err}</ErrorText>
      <Btn disabled={!valid || busy} onClick={submit}>{busy ? "Changing…" : "Change password"}</Btn>
      <Gap />
      <Btn kind="ghost" disabled={busy} onClick={onBack}>Back</Btn>
    </div>
  );
}

function RemoveView({ lobby, write, roomId, onBack }) {
  const setupCode = useMemo(() => randomCode(), []);
  const [current, setCurrent] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setBusy(true); setErr("");
    try { await removeProtection(write, lobby, { current, setupCode, currentRoomId: roomId }); }
    catch (e) { setErr(e?.message || "Something went wrong."); setBusy(false); }
  };

  return (
    <div style={{ marginTop: 12 }}>
      <Note>The board becomes open: anyone with the link can edit. Save the new setup code, you need it to add a password again.</Note>
      <Field label="Current password" type="password" value={current} onChange={setCurrent} autoFocus autoComplete="current-password" />
      <CodeBox label="Setup code" code={setupCode} filename="board-setup-code.txt" saved={saved} onSaved={setSaved} />
      <ErrorText>{err}</ErrorText>
      <Btn kind="danger" disabled={!current || !saved || busy} onClick={submit}>{busy ? "Removing…" : "Remove the password"}</Btn>
      <Gap />
      <Btn kind="ghost" disabled={busy} onClick={onBack}>Back</Btn>
    </div>
  );
}

function MoveView({ lobby, roomId, onBack }) {
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(null);

  const readBoard = useMutation(({ storage }) => pickBoard(storage.toImmutable()), []);

  const submit = async () => {
    const newKey = key.trim();
    if (!isPublicKey(newKey)) { setErr("That does not look like a Liveblocks public key. It starts with pk_."); return; }
    if (newKey === LIVEBLOCKS_KEY) { setErr("That is the key already in use."); return; }
    setBusy(true); setErr("");
    try {
      const board = readBoard();
      const target = createClient({ publicApiKey: newKey });

      const { room, leave } = target.enterRoom(LOBBY_ROOM, { initialPresence: {}, initialStorage: { mode: "new" } });
      try {
        const { root } = await room.getStorage();
        root.update(lobby);
        await waitSynced(room);
      } finally { leave(); }

      await writeBoard(target, roomId, board);
      saveLiveblocksKey(newKey);
      setDone(inviteLink(newKey));
    } catch (e) {
      setErr((e?.message || "Something went wrong.") + " Nothing was changed on the current account.");
    }
    setBusy(false);
  };

  if (done) {
    return (
      <div style={{ marginTop: 12 }}>
        <Note>Done. The board and its settings now exist on the new account, and this browser uses the new key.</Note>
        <Note>Send teammates this invite link once. If you set <code>VITE_LIVEBLOCKS_PUBLIC_KEY</code> on your host, change it there too and redeploy.</Note>
        <div style={{ fontSize: 12, wordBreak: "break-all", userSelect: "all", padding: 10, border: `1px dashed ${PALETTE.brand}`, borderRadius: 8, marginBottom: 12 }}>{done}</div>
        <Btn onClick={() => window.location.reload()}>Reload with the new account</Btn>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 12 }}>
      <Note>Copies the board (and these settings) from the current Liveblocks account to a new one. Use your new project's public key. The old data stays where it is. If the old account is over its limit this may fail, so export a JSON backup first.</Note>
      <Field label="New Liveblocks public key" value={key} onChange={(v) => { setKey(v); setErr(""); }} placeholder="pk_dev_..." autoFocus />
      <ErrorText>{err}</ErrorText>
      <Btn disabled={!key || busy} onClick={submit}>{busy ? "Copying…" : "Copy to the new account"}</Btn>
      <Gap />
      <Btn kind="ghost" disabled={busy} onClick={onBack}>Back</Btn>
    </div>
  );
}
