import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useT, PALETTE } from "../theme";
import { getPriority } from "../constants";
import { darken } from "../utils";
import { uploadToCloudinary } from "../cloudinary";
import EditCardForm from "./EditCardForm";
import MoveCardModal from "./MoveCardModal";
import { IconBtn } from "./ui";

export default function Card({
  card, columnId, accentColor, isActiveCard,
  onDelete, onToggle, onEditCard, onCyclePriority,
  categories, allColumns, currentCategoryId, onMoveCard,
}) {
  const { C } = useT();
  const [hover,        setHover]        = useState(false);
  const [editing,      setEditing]      = useState(false);
  const [imgDropOver,  setImgDropOver]  = useState(false);
  const [imgUploading, setImgUploading] = useState(false);
  const [lightbox,     setLightbox]     = useState(false);
  const [movingCard,   setMovingCard]   = useState(false);

  const isFileDrag = (e) => e.dataTransfer.types.includes("Files");

  const handleDragOver = (e) => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    setImgDropOver(true);
  };
  const handleDragLeave = (e) => {
    // Only clear when truly leaving this card (not entering a child)
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setImgDropOver(false);
  };
  const handleDrop = async (e) => {
    if (!isFileDrag(e)) return;
    // Don't stopPropagation — let column reset its own state.
    // Column checks data-card to avoid creating a duplicate card.
    e.preventDefault();
    setImgDropOver(false);
    const file = [...e.dataTransfer.files].find((f) => f.type.startsWith("image/"));
    if (!file) return;
    setImgUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      onEditCard({ title: card.title, priority: card.priority, date: card.date, author: card.author, image: url });
    } catch { /* silent */ }
    setImgUploading(false);
  };

  const prio = getPriority(card.priority);

  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({
    id:   card.id,
    data: { type: "card", columnId, card },
  });

  const transformStyle = {
    transform:    CSS.Transform.toString(transform),
    transition:   [transition, "background 0.1s, border-color 0.1s, box-shadow 0.15s"].filter(Boolean).join(", "),
    opacity:      isDragging || isActiveCard ? 0 : 1,
    marginBottom: 8,
  };

  if (editing) {
    return (
      <div ref={setNodeRef} style={transformStyle} onPointerDown={(e) => e.stopPropagation()}>
        <EditCardForm
          card={card}
          accentColor={accentColor}
          onSave={(d) => { onEditCard(d); setEditing(false); }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  const borderLeftColor = prio.color ?? (hover ? C.borderLit : C.border);

  return (
    <div
      ref={setNodeRef}
      style={{
        ...transformStyle,
        background:   hover ? C.cardHover : C.cardBg,
        border:       imgDropOver
          ? `2px dashed ${PALETTE.teal}`
          : `1px solid ${hover ? C.borderLit : C.border}`,
        borderLeft:   imgDropOver ? `2px dashed ${PALETTE.teal}` : `3px solid ${borderLeftColor}`,
        borderRadius: 8,
        padding:      '9px 10px',
        cursor:       isDragging ? 'grabbing' : 'grab',
        position:     'relative',
        boxShadow:    imgDropOver
          ? `0 0 0 2px ${PALETTE.teal}55`
          : (hover ? C.cardShadowHover : C.cardShadow),
        userSelect:   'none',
        transition:   'border-color 0.1s, box-shadow 0.1s',
      }}
      data-card
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      {...attributes}
      {...listeners}
    >
      {imgUploading && (
        <div style={{
          position:       'absolute', inset: 0, borderRadius: 8,
          background:     'rgba(0,0,0,0.35)',
          display:        'flex', alignItems: 'center', justifyContent: 'center',
          zIndex:         20, pointerEvents: 'none',
          color:          '#fff', fontSize: 12, fontWeight: 600,
        }}>
          ⏳ Uploading…
        </div>
      )}
      {imgDropOver && (
        <div style={{
          position:       'absolute', inset: 0, borderRadius: 8,
          background:     PALETTE.teal + '18',
          display:        'flex', alignItems: 'center', justifyContent: 'center',
          zIndex:         19, pointerEvents: 'none',
          color:          PALETTE.teal, fontSize: 12, fontWeight: 700,
        }}>
          🖼 Drop to set image
        </div>
      )}
      {/* Lightbox */}
      {lightbox && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setLightbox(false)}
          onKeyDown={(e) => e.key === "Escape" && setLightbox(false)}
          tabIndex={-1}
          style={{
            position:       'fixed', inset: 0, zIndex: 9999,
            background:     'rgba(0,0,0,0.85)',
            display:        'flex', alignItems: 'center', justifyContent: 'center',
            cursor:         'zoom-out',
            backdropFilter: 'blur(6px)',
          }}
        >
          <img
            src={card.image}
            alt=""
            style={{
              maxWidth:     '90vw',
              maxHeight:    '90vh',
              objectFit:    'contain',
              borderRadius: 8,
              boxShadow:    '0 8px 48px rgba(0,0,0,0.6)',
              userSelect:   'none',
            }}
          />
          <button
            onClick={() => setLightbox(false)}
            style={{
              position:     'fixed', top: 18, right: 22,
              background:   'rgba(255,255,255,0.12)',
              border:       'none',
              color:        '#fff',
              fontSize:     22,
              width:        36, height: 36,
              borderRadius: '50%',
              cursor:       'pointer',
              display:      'flex', alignItems: 'center', justifyContent: 'center',
              lineHeight:   1,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Image */}
      {card.image && (
        <div
          style={{
            margin: '-9px -10px 9px',
            borderRadius: '6px 6px 0 0',
            overflow: 'hidden',
            lineHeight: 0,
          }}
        >
          <img
            src={card.image}
            alt=""
            onClick={(e) => { e.stopPropagation(); setLightbox(true); }}
            style={{
              width:   '100%',
              maxHeight: 130,
              objectFit: 'cover',
              display:  'block',
              cursor:   'zoom-in',
            }}
          />
        </div>
      )}

      {/* Priority badge */}
      {prio.color && (
        <div
          onClick={e => {
            e.stopPropagation();
            onCyclePriority();
          }}
          title="Click to cycle priority"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: prio.color + (C.isLight ? '22' : '28'),
            color: C.isLight ? darken(prio.color) : prio.color,
            border: `1px solid ${prio.color}55`,
            borderRadius: 4,
            padding: '2px 8px',
            fontSize: 10.5,
            marginBottom: 5,
            cursor: 'pointer',
            fontWeight: 700,
            letterSpacing: '0.3px',
            textTransform: 'uppercase',
          }}
        >
          ● {prio.label}
        </div>
      )}

      {/* Title (optional — image-only cards have no title) */}
      {card.title ? (
        <p
          onDoubleClick={() => setEditing(true)}
          style={{
            fontSize:       13,
            color:          card.done ? PALETTE.teal : C.text,
            textDecoration: card.done ? 'line-through' : 'none',
            lineHeight:     1.45,
            margin:         0,
            wordBreak:      'break-word',
            whiteSpace:     'pre-line',
          }}
        >
          {card.done && (
            <span style={{ color: PALETTE.teal, marginRight: 5, fontWeight: 800 }}>✓</span>
          )}
          {card.title}
        </p>
      ) : !card.image && (
        <p
          onDoubleClick={() => setEditing(true)}
          style={{ fontSize: 12, color: C.muted, margin: 0, fontStyle: 'italic' }}
        >
          Untitled
        </p>
      )}

      {/* Date */}
      {card.date && (
        <div style={{ marginTop: 7 }}>
          <span
            style={{
              background: C.isLight ? PALETTE.teal + '18' : C.tag,
              color: C.isLight ? darken(PALETTE.teal) : C.muted,
              border: `1px solid ${C.isLight ? PALETTE.teal + '44' : C.border}`,
              borderRadius: 4,
              padding: '1px 7px',
              fontSize: 11,
            }}
          >
            📅 {card.date}
          </span>
        </div>
      )}

      {/* Details */}
      {card.author && (
        <div style={{ marginTop: 6 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'flex-start',
              gap: 4,
              background: C.isLight
                ? PALETTE.yellow + '22'
                : PALETTE.yellow + '18',
              color: C.isLight ? darken(PALETTE.yellow) : PALETTE.yellow,
              border: `1px solid ${PALETTE.yellow}44`,
              borderRadius: 4,
              padding: '1px 7px',
              fontSize: 11,
              cursor: 'pointer',
              maxWidth: '100%',
              boxSizing: 'border-box',
              whiteSpace: 'pre-line',
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
            }}
          >
            {card.author}
          </span>
        </div>
      )}

      {/* Hover actions */}
      {hover && (
        <div
          style={{
            position: 'absolute',
            background: "#00000060",
            borderRadius: 6,
            padding: 4,
            top: 7,
            right: 7,
            display: 'flex',
            gap: 2,
            zIndex: 10,
          }}
          onPointerDown={e => e.stopPropagation()}
        >
          <IconBtn
            label="✓"
            title={card.done ? 'Unmark' : 'Mark done'}
            color={PALETTE.teal}
            light={C.isLight}
            onClick={e => {
              e.stopPropagation();
              onToggle();
            }}
          />
          <IconBtn
            label="✎"
            title="Edit card"
            color={accentColor}
            light={C.isLight}
            onClick={e => {
              e.stopPropagation();
              setEditing(true);
            }}
          />
          <IconBtn
            label="📁"
            title="Move to category"
            color={accentColor}
            light={C.isLight}
            onClick={e => {
              e.stopPropagation();
              setMovingCard(true);
            }}
          />
          <IconBtn
            label="✕"
            title="Delete card"
            color={PALETTE.coral}
            light={C.isLight}
            onClick={e => {
              e.stopPropagation();
              onDelete();
            }}
          />
        </div>
      )}

      {movingCard && (
        <div onPointerDown={(e) => e.stopPropagation()}>
          <MoveCardModal
            categories={categories}
            columns={allColumns}
            currentCategoryId={currentCategoryId}
            onMove={(toColId) => { onMoveCard(toColId); setMovingCard(false); }}
            onClose={() => setMovingCard(false)}
          />
        </div>
      )}
    </div>
  );
}
