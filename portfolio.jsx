/* ============================================================
   Charlie — Portfolio
   Modelled faithfully on giovannicorabi.com:
   • Home (cover): name centred at top, ONE photograph centred in
     the viewport that auto-advances on its own; footer with an
     Instagram link (left) and the studio email (right).
   • Index (Evan-style): every photograph in a responsive grid;
     click any frame for the lightbox.
   Photographs are user-droppable <image-slot>s; the name, captions
   and footer lines are inline-editable and persist to localStorage.
   ============================================================ */
const { useState, useEffect, useRef, useCallback } = React;

/* ---- persistence helpers ---------------------------------- */
const LS = {
  get(k, fallback) {
    try { const v = localStorage.getItem(k); return v == null ? fallback : JSON.parse(v); }
    catch { return fallback; }
  },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

/* ============================================================
   Charlie's photographs, in display order.
   ---> POUR AJOUTER / RETIRER UNE PHOTO :
   1. Dépose ton fichier .jpg dans le dossier  images/
   2. Ajoute (ou enlève) son nom dans la liste ci-dessous.
   L'ordre de la liste = l'ordre d'affichage.
   ============================================================ */
const PHOTOS = [
  'images/01.jpg',
  'images/02.jpg',
  'images/03.jpg',
  'images/04.jpg',
  'images/05.jpg',
  'images/06.jpg',
  'images/07.jpg',
  'images/08.jpg',
  'images/09.jpg',
  'images/10.jpg',
  'images/11.jpg',
  'images/12.jpg',
  'images/13.jpg',
  'images/14.jpg',
  'images/15.jpg',
];
const PHOTO_IDS = PHOTOS;
const DEFAULT_CAPTIONS = Array.from({ length: PHOTOS.length }, () => '');
const AUTOPLAY_MS = 700;

/* ---- inline-editable text --------------------------------- */
function Editable({ value, onCommit, placeholder, style, as = 'span', ...rest }) {
  const ref = useRef(null);
  const Tag = as;
  const commit = () => onCommit(ref.current ? ref.current.textContent.trim() : '');
  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }}
      data-placeholder={placeholder}
      className={value ? '' : 'is-empty'}
      style={{ outline: 'none', cursor: 'text', ...style }}
      {...rest}
    >
      {value}
    </Tag>
  );
}

/* ---- wordmark: centred at the very top -------------------- */
const wordStyle = {
  position: 'fixed', top: 'var(--frame-y)', left: 0, right: 0, zIndex: 50,
  display: 'flex', justifyContent: 'center', pointerEvents: 'none',
};
function Wordmark({ name, onName, go }) {
  return (
    <div style={wordStyle}>
      <button
        type="button"
        onClick={() => go('cover')}
        style={{
          pointerEvents: 'auto', background: 'none', border: 0, padding: '4px 8px',
          cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text-strong)',
          fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-medium)',
          letterSpacing: 'var(--track-wide)', textTransform: 'uppercase', whiteSpace: 'nowrap',
        }}
      >
        <Editable value={name} onCommit={onName} placeholder="Your name"
          onClick={(e) => e.stopPropagation()} />
      </button>
    </div>
  );
}

/* ---- footer: Instagram (left) · email (right) ------------- */
const footStyle = {
  position: 'fixed', left: 0, right: 0, bottom: 'var(--frame-y)', zIndex: 50,
  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
  padding: '0 var(--frame-x)',
  fontSize: 'var(--text-sm)', color: 'var(--text-strong)',
};
function Footer({ info, setInfo }) {
  return (
    <div style={footStyle}>
      <Editable value={info.social} placeholder="Instagram"
        style={{ textDecoration: 'underline', textUnderlineOffset: '3px' }}
        onCommit={(t) => setInfo({ ...info, social: t })} />
      <Editable value={info.email} placeholder="studio@email.com"
        onCommit={(t) => setInfo({ ...info, email: t })} />
    </div>
  );
}

/* ---- cover: one photo, auto-advancing --------------------- */
const coverStyles = {
  wrap: { position: 'fixed', inset: 0, display: 'flex', alignItems: 'center',
    justifyContent: 'center', padding: 'calc(var(--frame-y) + 40px) var(--frame-x)' },
  box: { position: 'relative', width: 'min(86vw, 1080px)', height: 'min(72vh, 820px)', cursor: 'pointer' },
};
function Cover({ ids, index, setIndex, onOpen }) {
  const step = useCallback((d) => setIndex((i) => (i + d + ids.length) % ids.length), [ids.length, setIndex]);

  /* autoplay — steady, never pauses on hover */
  useEffect(() => {
    const t = setInterval(() => step(1), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [step]);

  /* keyboard stepping */
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step]);

  return (
    <div style={coverStyles.wrap}>
      <div style={coverStyles.box} onClick={onOpen}>
        {ids.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            draggable={false}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%', objectFit: 'contain', display: 'block',
              opacity: i === index ? 1 : 0,
              transition: 'none',
              pointerEvents: 'none',
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ---- index: the grid (Evan-style) ------------------------- */
/* Deterministic vertical offsets so the grid feels hand-placed, not aligned. */
const STAGGER = [0, 90, 30, 130, 10, 70, 150, 40, 0, 110, 50, 95, 20, 140, 60];
const indexStyles = {
  page: { minHeight: '100vh', padding: 'calc(var(--frame-y) + 64px) 6vw calc(var(--frame-y) + 80px)' },
  grid: { columnWidth: '23rem', columnGap: '5.5vw' },
  fig: { margin: '0 0 7vh', breakInside: 'avoid',
    display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' },
  frame: { width: '100%', cursor: 'zoom-in' },
  img: { width: '100%', height: 'auto', display: 'block' },
  cap: { fontStyle: 'italic', fontSize: 'var(--text-sm)', color: 'var(--text-body)',
    letterSpacing: 'var(--track-normal)' },
};
function IndexGrid({ ids, captions, setCaption, openAt }) {
  return (
    <div style={indexStyles.page}>
      <div style={indexStyles.grid}>
        {ids.map((id, i) => (
          <figure key={id} style={{ ...indexStyles.fig, marginTop: (STAGGER[i % STAGGER.length]) + 'px' }}>
            <div style={indexStyles.frame} onClick={() => openAt(i)}>
              <img src={id} alt="" draggable={false} loading="lazy" style={indexStyles.img} />
            </div>
          </figure>
        ))}
      </div>
    </div>
  );
}

/* ---- lightbox (Evan-style: light, centred, minimal chrome) ---- */
const lbStyles = {
  scrim: { position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(252,252,251,0.97)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '6vh 9vw', cursor: 'zoom-out',
    animation: 'lb-fade var(--dur) var(--ease)' },
  img: { maxWidth: '100%', maxHeight: '88vh', objectFit: 'contain', display: 'block',
    cursor: 'default', boxShadow: '0 24px 64px -28px rgba(19,19,19,0.45)' },
  icon: { position: 'fixed', zIndex: 101, background: 'none', border: 0, padding: 8,
    cursor: 'pointer', color: 'var(--ink)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', lineHeight: 0 },
};
function Chevron({ dir }) {
  const d = dir === 'left' ? 'M15 5 L8 12 L15 19' : 'M9 5 L16 12 L9 19';
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d={d}></path>
    </svg>
  );
}
function Lightbox({ ids, index, setIndex, onClose }) {
  const step = useCallback((d) => setIndex((i) => (i + d + ids.length) % ids.length), [ids.length, setIndex]);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, onClose]);
  return (
    <div style={lbStyles.scrim} onClick={onClose}>
      <button type="button" aria-label="Close" onClick={onClose}
        style={{ ...lbStyles.icon, top: 'var(--frame-y)', right: 'var(--frame-x)' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.4" strokeLinecap="round">
          <circle cx="12" cy="12" r="10.4"></circle>
          <path d="M8.5 8.5 L15.5 15.5 M15.5 8.5 L8.5 15.5"></path>
        </svg>
      </button>
      <button type="button" aria-label="Previous" onClick={(e) => { e.stopPropagation(); step(-1); }}
        style={{ ...lbStyles.icon, left: 'calc(var(--frame-x) - 4px)', top: '50%', transform: 'translateY(-50%)' }}>
        <Chevron dir="left" />
      </button>
      <button type="button" aria-label="Next" onClick={(e) => { e.stopPropagation(); step(1); }}
        style={{ ...lbStyles.icon, right: 'calc(var(--frame-x) - 4px)', top: '50%', transform: 'translateY(-50%)' }}>
        <Chevron dir="right" />
      </button>
      <img key={ids[index]} src={ids[index]} alt="" draggable={false}
        onClick={(e) => e.stopPropagation()} style={lbStyles.img} />
    </div>
  );
}

/* ---- app -------------------------------------------------- */
function App() {
  const [view, setView] = useState('cover');           // cover | index
  const [coverIndex, setCoverIndex] = useState(0);
  const [lb, setLb] = useState({ open: false, i: 0 });
  const [name, setName] = useState(() => LS.get('charlie.name', 'Charlie Andreota'));
  const [captions, setCaptions] = useState(() => LS.get('charlie.captions', DEFAULT_CAPTIONS));
  const [info, setInfo] = useState(() => LS.get('charlie.info', {
    email: 'hello@charlieandreota.com', social: '@charlieant',
  }));

  useEffect(() => LS.set('charlie.name', name), [name]);
  useEffect(() => LS.set('charlie.captions', captions), [captions]);
  useEffect(() => LS.set('charlie.info', info), [info]);

  /* Preload + decode every photograph up front so cover swaps appear
     instantly instead of painting progressively top-to-bottom. */
  useEffect(() => {
    PHOTOS.forEach((src) => { const im = new Image(); im.decoding = 'async'; im.src = src; });
  }, []);

  const setCaption = (i, t) => setCaptions((c) => { const n = c.slice(); n[i] = t; return n; });
  const go = (v) => { setLb({ open: false, i: 0 }); setView(v); };

  return (
    <>
      <Wordmark name={name} onName={setName} go={go} />
      {view === 'cover' && (
        <Cover ids={PHOTO_IDS} index={coverIndex} setIndex={setCoverIndex}
          onOpen={() => go('index')} />
      )}
      {view === 'index' && (
        <IndexGrid ids={PHOTO_IDS} captions={captions} setCaption={setCaption}
          openAt={(i) => setLb({ open: true, i })} />
      )}
      <Footer info={info} setInfo={setInfo} />
      {lb.open && (
        <Lightbox ids={PHOTO_IDS} captions={captions} index={lb.i}
          setIndex={(updater) => setLb((s) => ({ ...s, i: typeof updater === 'function' ? updater(s.i) : updater }))}
          onClose={() => setLb({ open: false, i: 0 })} />
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
