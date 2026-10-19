import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import statusRight from './assets/status-right.svg';
import arrowLeft from './assets/arrow-left.svg';

/* Rolling amount: the top of the WeChat Pay loan page, where every digit change moves.
   Typed digits rise in, deleted ones drop out, and a preset spins each column like an odometer. */

const CREDIT = 9550;
const TRY = [
  { v: '8000', label: '8,000' },
  { v: '1500', label: '1,500' },
  { v: '800', label: '800' },
];
const RECORD = typeof location !== 'undefined' && location.hash.startsWith('#record');
const TOUCH = typeof matchMedia !== 'undefined' && matchMedia('(hover: none)').matches;

const PlayIcon = () => (<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.8v8.4a.6.6 0 0 0 .9.5l6.6-4.2a.6.6 0 0 0 0-1L3.9 1.3a.6.6 0 0 0-.9.5Z" fill="currentColor" /></svg>);
const ResetIcon = () => (<svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.8 8a5.2 5.2 0 1 0 1.6-3.75M2.6 1.9v2.8h2.8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>);

const ROLL_SCRIPT = [
  ['type', '8000'], ['wait', 900], ['del'], ['wait', 500], ['del'], ['wait', 700],
  ['set', '1500'], ['wait', 1300], ['set', '800'], ['wait', 1300], ['set', '8000'], ['wait', 1400],
  ['clear'], ['wait', 700],
];

const CROP = 330; // px of the 864px phone that stay visible
export default function RollPage() {
  const [raw, setRaw] = useState('');
  const [tried, setTried] = useState(null);
  const [focus, setFocus] = useState(RECORD); // the recording shows the caret so it can be seen gliding
  const [z, setZ] = useState(1);
  const run = useRef(0);
  const input = useRef(null);
  const rawRef = useRef(raw); rawRef.current = raw;

  const press = (k) => {
    const cur = rawRef.current;
    if (k === 'del') return setRaw(cur.slice(0, -1));
    if (k === '.' && (cur.includes('.') || cur === '')) return;
    if (cur.includes('.') && cur.split('.')[1].length >= 2) return;
    const next = cur === '0' && k !== '.' ? k : cur + k;
    if (Number(next) > CREDIT) return;
    setRaw(next);
  };
  const stop = () => { run.current++; };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const play = async () => {
    const id = ++run.current; setTried(null); setRaw('');
    await wait(500);
    do {
      for (const [op, arg] of ROLL_SCRIPT) {
        if (run.current !== id) return;
        if (op === 'type') { for (const k of arg) { if (run.current !== id) return; press(k); await wait(170); } }
        else if (op === 'del') press('del');
        else if (op === 'set') { setTried(arg); setRaw(arg); }
        else if (op === 'clear') { setTried(null); setRaw(''); }
        else await wait(arg);
      }
    } while (RECORD && run.current === id);
  };

  useEffect(() => {
    const fit = () => setZ(Math.min(RECORD ? 2.2 : 1.6, (window.innerWidth - 32) / 410, (window.innerHeight - (RECORD ? 48 : 200)) / CROP));
    fit(); window.addEventListener('resize', fit);
    const key = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      let k = null;
      if (/^[0-9]$/.test(e.key)) k = e.key;
      else if (e.key === '.') k = '.';
      else if (e.key === 'Backspace' || e.key === 'Delete') k = 'del';
      if (!k) return;
      // On a phone the hidden input is focused: digits arrive as input events (handled there),
      // so only Backspace is taken here. Handling both would type every digit twice.
      if (document.activeElement === input.current && k !== 'del') return;
      e.preventDefault(); stop(); setTried(null); setFocus(true); press(k);
    };
    if (!RECORD) window.addEventListener('keydown', key);
    if (RECORD) play();
    return () => { window.removeEventListener('resize', fit); window.removeEventListener('keydown', key); stop(); };
  }, []);

  const preset = (v) => { stop(); setTried(v); setRaw(v); };

  return (
    <main className={RECORD ? 'page record roll-page' : 'page roll-page'}>
      {/* The top of the real phone: frame, status bar, nav and the amount. The rest is cropped away. */}
      <div className="roll-stage" style={{ width: 410 * z, height: CROP * z }}>
        <div className="roll-crop" style={{ transform: `scale(${z})` }} onClick={() => { setFocus(true); if (TOUCH) input.current?.focus({ preventScroll: true }); }}>
          <div className="phone" role="img" aria-label="Loan amount, top of the loan page">
            <div className="screen">
              <StatusBar />
              <div className="nav"><img src={arrowLeft} width="12" height="24" alt="" /></div>
              <div className="amount-block">
                <div className="label">Loan Amount</div>
                <div className="amount" aria-live="polite">
                  <span className="yen">¥</span>
                  <RollingDigits value={raw} />
                  {(focus || raw === '') && <span className="caret" />}
                </div>
                <div className="credit">Available Credit ¥{CREDIT.toFixed(2)}</div>
              </div>
            </div>
          </div>
          {/* Phones: tapping the amount brings up the number pad. Keys are read from the window listener. */}
          <input ref={input} className="roll-input" inputMode="decimal" aria-label="Loan amount" value="" onChange={() => {}}
            onInput={(e) => { const ev = e.nativeEvent; stop(); setTried(null); if (ev.inputType === 'deleteContentBackward') return; else for (const c of ev.data || '') if (/[0-9.]/.test(c)) press(c); }} />
        </div>
      </div>

      {!RECORD && (
        <header className="meta">
          <div className="meta-title">Rolling amount</div>
          <div className="meta-sub">WeChat Pay · Shuyi Yuan</div>
        </header>
      )}

      {!RECORD && (
        <div className="dock-area">
          <p className="caption">{TOUCH ? 'Tap the amount to type, or jump to an amount.' : 'Type on your keyboard, or jump to an amount.'}</p>
          <div className="dock" role="toolbar" aria-label="Demo controls">
            <span className="dock-label">Jump to</span>
            {TRY.map((t) => (
              <button key={t.v} className={tried === t.v ? 'chip on' : 'chip'} onClick={() => preset(t.v)}>¥{t.label}</button>
            ))}
            <span className="dock-sep" aria-hidden="true" />
            <button className="dock-btn" onClick={play}><PlayIcon /><span>Replay</span></button>
            <button className="dock-icon" onClick={() => { stop(); setTried(null); setRaw(''); }} aria-label="Clear" title="Clear"><ResetIcon /></button>
          </div>
        </div>
      )}
    </main>
  );
}

const StatusBar = () => (
  <div className="status">
    <span>9:41</span>
    <img src={statusRight} width="78" height="13" alt="" />
  </div>
);

/* Each position is a 0–9 strip behind a 44px window. Columns grow from 0 width on entry
   and shrink to 0 on exit, so the caret glides. */
let rollId = 0;
function RollingDigits({ value }) {
  const [items, setItems] = useState(() => [...value].map((ch) => ({ id: ++rollId, ch, state: 'idle' })));
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current; prev.current = value;
    if (from === value) return;
    setItems((cur) => {
      const live = cur.filter((it) => it.state !== 'out');
      const next = [...value].map((ch, i) => (live[i] ? { ...live[i], ch, state: 'idle' } : { id: ++rollId, ch, state: 'in' }));
      const leaving = live.slice(value.length).map((it) => ({ ...it, state: 'out' }));
      return [...next, ...leaving];
    });
    const t = setTimeout(() => setItems((cur) => cur.filter((it) => it.state !== 'out')), 260);
    return () => clearTimeout(t);
  }, [value]);
  // Measure a digit and a dot once, so each column's width can animate (the caret glides with it).
  const probe = useRef(null);
  const [w, setW] = useState({ d: 0, dot: 0 });
  useLayoutEffect(() => {
    // Layout px, unaffected by the page's scale. Measured again once web fonts finish loading,
    // otherwise the columns keep the fallback font's (wider) digit width.
    const measure = () => { const [d, dot] = probe.current.children; setW({ d: d.offsetWidth, dot: dot.offsetWidth }); };
    measure();
    document.fonts?.ready.then(measure);
    document.fonts?.addEventListener('loadingdone', measure);
    return () => document.fonts?.removeEventListener('loadingdone', measure);
  }, []);
  const n = items.filter((it) => it.state !== 'out').length;
  return (
    <span className="digits roll" aria-label={value} style={w.d ? { '--cw': w.d + 'px', '--dw': w.dot + 'px' } : undefined}>
      <span ref={probe} className="probe" aria-hidden="true"><span>0</span><span>.</span></span>
      {items.map((it, i) => (
        <span key={it.id} className={'col ' + it.state + (/\d/.test(it.ch) ? '' : ' dot')} style={{ '--d': /\d/.test(it.ch) ? it.ch : 0, '--delay': Math.max(0, n - 1 - i) * 30 + 'ms' }} aria-hidden="true">
          {/\d/.test(it.ch)
            ? <span className="strip">{'0123456789'.split('').map((d) => <span key={d}>{d}</span>)}</span>
            : <span className="strip">{it.ch}</span>}
        </span>
      ))}
    </span>
  );
}
