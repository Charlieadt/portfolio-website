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
const { useState, useEffect, useLayoutEffect, useRef, useCallback } = React;

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
   1. Dépose ton fichier .jpg dans le dossier  img/ (2000px max, ~400 Ko)
   2. Ajoute (ou enlève) son nom dans la liste ci-dessous.
   L'ordre de la liste = l'ordre d'affichage.
   ============================================================ */
const PHOTOS = [
  'img/01.jpg',
  'img/02.jpg',
  'img/03.jpg',
  'img/04.jpg',
  'img/05.jpg',
  'img/06.jpg',
  'img/07.jpg',
  'img/08.jpg',
  'img/09.jpg',
  'img/10.jpg',
  'img/11.jpg',
  'img/12.jpg',
  'img/13.jpg',
  'img/14.jpg',
  'img/15.jpg',
  'img/16.jpg',
  'img/17.jpg',
  'img/18.jpg',
  'img/19.jpg',
  'img/20.jpg',
  'img/21.jpg',
  'img/22.jpg',
  'img/23.jpg',
  'img/24.jpg',
  'img/25.jpg',
  'img/26.jpg',
  'img/27.jpg',
  'img/28.jpg',
  'img/29.jpg',
  'img/30.jpg',
  'img/31.jpg',
  'img/32.jpg',
  'img/33.jpg',
  'img/34.jpg',
  'img/35.jpg',
  'img/36.jpg',
  'img/37.jpg',
  'img/38.jpg',
  'img/39.jpg',
  'img/40.jpg',
  'img/41.jpg',
  'img/42.jpg',
  'img/43.jpg',
  'img/44.jpg',
  'img/45.jpg',
];
/* Ordre aléatoire re-tiré à chaque chargement de la page. */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const SHUFFLED = shuffle(PHOTOS);
const PHOTO_IDS = SHUFFLED;
const DEFAULT_CAPTIONS = Array.from({ length: SHUFFLED.length }, () => '');
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
            <div style={indexStyles.frame} onClick={(e) => openAt(i, e.currentTarget.firstChild.getBoundingClientRect())}>
              <img data-lb-idx={i} src={id} alt="" draggable={false} loading="lazy" decoding="async" fetchPriority={i < 4 ? 'high' : 'low'} style={indexStyles.img} />
            </div>
          </figure>
        ))}
      </div>
    </div>
  );
}

/* ---- lightbox --------------------------------------------- */
/* Opens FROM the grid thumbnail (FLIP), navigates by cursor half. */
const EASE = 'cubic-bezier(.16,1,.3,1)';
const CUR = (d) => 'url("data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34">' +
  '<circle cx="17" cy="17" r="16" fill="rgba(19,19,19,.06)"/>' +
  '<path d="' + (d === -1 ? 'M20 10 L13 17 L20 24' : 'M14 10 L21 17 L14 24') +
  '" fill="none" stroke="#131313" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
) + '") 17 17, pointer';

/* Where the full image lands: contain-fit inside the safe area. */
function targetRect(aspect) {
  const maxW = window.innerWidth * 0.80;
  const maxH = window.innerHeight * 0.86;
  let w = maxW, h = w / aspect;
  if (h > maxH) { h = maxH; w = h * aspect; }
  return { x: (window.innerWidth - w) / 2, y: (window.innerHeight - h) / 2, w, h };
}

const lbStyles = {
  scrim: { position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(252,252,251,0.97)',
    transition: 'opacity 200ms linear' },
  close: { position: 'fixed', zIndex: 102, background: 'none', border: 0, padding: 8,
    cursor: 'pointer', color: 'var(--ink)', display: 'flex', lineHeight: 0,
    transition: 'opacity 200ms linear' },
  zone: { position: 'fixed', top: 0, bottom: 0, width: '50%', zIndex: 101 },
};

function Lightbox({ ids, index, setIndex, onClose, origin }) {
  const imgRef = useRef(null);
  const [ready, setReady] = useState(false);   // FLIP settled → chrome fades in
  const [closing, setClosing] = useState(false);
  const aspect = origin && origin.height ? origin.width / origin.height : 1.5;
  const step = useCallback((d) => setIndex((i) => (i + d + ids.length) % ids.length), [ids.length, setIndex]);

  /* Current rect of the grid thumbnail for a given index, if it is still in the DOM. */
  const gridRect = useCallback((i) => {
    const el = document.querySelector('[data-lb-idx="' + i + '"]');
    return el ? el.getBoundingClientRect() : null;
  }, []);

  /* FLIP in: render at final rect, transform back onto the thumbnail, release. */
  useLayoutEffect(() => {
    const el = imgRef.current;
    if (!el || !origin) { setReady(true); return; }
    const t = targetRect(aspect);
    const dx = origin.left - t.x, dy = origin.top - t.y, sc = origin.width / t.w;
    el.style.transition = 'none';
    el.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + sc + ')';
    const id = requestAnimationFrame(() => {
      el.style.transition = 'transform 440ms ' + EASE;
      el.style.transform = 'none';
      setReady(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  /* FLIP out: fly back to whichever thumbnail is now current. */
  const close = useCallback(() => {
    const el = imgRef.current;
    const r = gridRect(index);
    if (!el || !r) { onClose(); return; }
    const t = targetRect(aspect);
    setClosing(true);
    el.style.transition = 'transform 380ms ' + EASE + ', opacity 380ms linear';
    el.style.transform = 'translate(' + (r.left - t.x) + 'px,' + (r.top - t.y) + 'px) scale(' + (r.width / t.w) + ')';
    setTimeout(onClose, 360);
  }, [index, aspect, gridRect, onClose]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [step, close]);

  const t = targetRect(aspect);
  const chrome = ready && !closing ? 1 : 0;

  return (
    <>
      <div style={{ ...lbStyles.scrim, opacity: closing ? 0 : 1 }}></div>
      <img ref={imgRef} src={ids[index]} alt="" draggable={false}
        style={{ position: 'fixed', zIndex: 101, left: t.x, top: t.y, width: t.w, height: t.h,
          objectFit: 'contain', transformOrigin: 'top left', display: 'block',
          opacity: closing ? 0.001 : 1,
          boxShadow: '0 24px 64px -28px rgba(19,19,19,0.45)' }} />
      <div style={{ ...lbStyles.zone, left: 0, cursor: CUR(-1) }} onClick={() => step(-1)}></div>
      <div style={{ ...lbStyles.zone, right: 0, cursor: CUR(1) }} onClick={() => step(1)}></div>
      <button type="button" aria-label="Close" onClick={close}
        style={{ ...lbStyles.close, top: 'var(--frame-y)', right: 'var(--frame-x)', opacity: chrome }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.4" strokeLinecap="round">
          <circle cx="12" cy="12" r="10.4"></circle>
          <path d="M8.5 8.5 L15.5 15.5 M15.5 8.5 L8.5 15.5"></path>
        </svg>
      </button>
    </>
  );
}

/* ---- app -------------------------------------------------- */
function App() {
  const [view, setView] = useState('cover');           // cover | index
  const [coverIndex, setCoverIndex] = useState(0);
  const [lb, setLb] = useState({ open: false, i: 0, rect: null });
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
    let stop = false, i = 0;
    const next = () => {
      if (stop || i >= PHOTOS.length) return;
      const im = new Image(); im.decoding = 'async';
      im.onload = im.onerror = () => { i++; next(); };
      im.src = PHOTOS[i];
    };
    next();
    return () => { stop = true; };
  }, []);

  const setCaption = (i, t) => setCaptions((c) => { const n = c.slice(); n[i] = t; return n; });
  const go = (v) => { setLb({ open: false, i: 0, rect: null }); setView(v); };

  return (
    <>
      <Wordmark name={name} onName={setName} go={go} />
      {view === 'cover' && (
        <Cover ids={PHOTO_IDS} index={coverIndex} setIndex={setCoverIndex}
          onOpen={() => go('index')} />
      )}
      {view === 'index' && (
        <IndexGrid ids={PHOTO_IDS} captions={captions} setCaption={setCaption}
          openAt={(i, rect) => setLb({ open: true, i, rect })} />
      )}
      <Footer info={info} setInfo={setInfo} />
      {lb.open && (
        <Lightbox ids={PHOTO_IDS} captions={captions} index={lb.i}
          setIndex={(updater) => setLb((s) => ({ ...s, i: typeof updater === 'function' ? updater(s.i) : updater }))}
          origin={lb.rect}
          onClose={() => setLb({ open: false, i: 0, rect: null })} />
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
