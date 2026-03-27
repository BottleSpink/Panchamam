import { useState, useEffect, useRef, useMemo } from 'react'
import { RAAGAM, JANYA_BY_MELA, swaraLabel } from './data/ragam'
import { TAALAM } from './data/talam'

const KATTAI = [
  {l:"½",f:130.81},{l:"1",f:138.59},{l:"1½",f:146.83},{l:"2",f:155.56},
  {l:"2½",f:164.81},{l:"3",f:174.61},{l:"3½",f:185.00},{l:"4",f:196.00},
  {l:"4½",f:207.65},{l:"5",f:220.00},{l:"5½",f:233.08},{l:"6",f:246.94}
]

// ── Theme ──────────────────────────────────────────────────────
const T = {
  bg:       '#0a0a0a',
  sidebar:  '#111111',
  surface:  '#1a1a1a',
  border:   '#2a2a2a',
  text:     '#f0ebe0',
  muted:    '#888',
  dim:      '#444',
  amber:    '#d4a843',
  amberBg:  '#2a1f0a',
  amberBdr: '#5a3a0a',
  teal:     '#3eb489',
  tealBg:   '#0a2018',
  tealBdr:  '#1a5038',
  blue:     '#5a9fd4',
  blueBg:   '#0a1828',
  blueBdr:  '#1a3858',
  red:      '#e24b4a',
  redBg:    '#280a0a',
  redBdr:   '#5a1a1a',
}

function hz(base, semi) { return base * Math.pow(2, semi / 12) }

function playSequence(notes, baseF, ctxRef) {
  const ctx = ctxRef.current || (ctxRef.current = new (window.AudioContext || window.webkitAudioContext)())
  if (ctx.state === 'suspended') ctx.resume()
  const dur = 0.4
  notes.forEach((semi, i) => {
    const t = ctx.currentTime + i * dur
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.type = 'sine'; o.frequency.value = hz(baseF, semi)
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.22, t + 0.02)
    g.gain.setValueAtTime(0.22, t + dur * 0.6)
    g.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.95)
    o.start(t); o.stop(t + dur)
  })
}

function playSingle(semi, baseF, ctxRef) {
  const ctx = ctxRef.current || (ctxRef.current = new (window.AudioContext || window.webkitAudioContext)())
  if (ctx.state === 'suspended') ctx.resume()
  const dur = 0.6
  const t = ctx.currentTime
  const o = ctx.createOscillator(), g = ctx.createGain()
  o.connect(g); g.connect(ctx.destination)
  o.type = 'sine'; o.frequency.value = hz(baseF, semi)
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(0.22, t + 0.02)
  g.gain.setValueAtTime(0.22, t + dur * 0.6)
  g.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.95)
  o.start(t); o.stop(t + dur)
}

function buildRows(raga, tala, baseF) {
  const upper = {l:'Ṡ', v:12}
  const asc = [...raga.s, upper]
  const rows = []
  const makeRow = (swaras, base) => ({
    beats: tala.pat.map(p => {
      const sw = p.o !== null ? swaras[base + p.o] : null
      return { freq: sw ? hz(baseF, sw.v) : null, label: sw ? sw.l : '·', anga: p.a, angaStart: !!p.s }
    }),
    baseLabel: swaras[base].l
  })
  const n = asc.length
  const desc = [...asc].reverse()
  for (let r = 0; r <= n - 4; r++) rows.push({...makeRow(asc, r), ascending: true})
  for (let r = 0; r <= n - 4; r++) rows.push({...makeRow(desc, r), ascending: false})
  return rows
}

// ── Raga Search ────────────────────────────────────────────────
function RAAGAMearch({ value, onChange }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return RAAGAM.filter(r => r.name.toLowerCase().includes(q))
  }, [query])

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = RAAGAM[value]

  return (
    <div ref={ref} style={{position:'relative'}}>
      <input
        value={open ? query : selected?.name || ''}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => { setQuery(''); setOpen(true) }}
        placeholder="Search rāgam..."
        style={{width:'100%', padding:'8px 10px',
          border:`0.5px solid ${T.border}`, borderRadius:6, fontSize:13,
          background:T.surface, color:T.text, boxSizing:'border-box'}}
      />
      {open && filtered.length > 0 && (
        <div style={{position:'absolute', top:'100%', left:0, right:0, zIndex:100,
          background:T.surface, border:`0.5px solid ${T.border}`, borderRadius:6,
          maxHeight:260, overflowY:'auto', marginTop:2,
          boxShadow:'0 4px 16px rgba(0,0,0,0.5)'}}>
          {filtered.map((r, i) => {
            const idx = RAAGAM.indexOf(r)
            const isSelected = idx === value
            return (
              <div key={i} onMouseDown={() => { onChange(idx); setOpen(false); setQuery('') }}
                style={{padding:'8px 12px', cursor:'pointer', fontSize:13,
                  background: isSelected ? T.amberBg : 'transparent',
                  borderBottom:`0.5px solid ${T.border}`}}>
                <div style={{fontWeight: isSelected ? 500 : 400,
                  color: isSelected ? T.amber : T.text}}>{r.name}</div>
                <div style={{fontSize:11, color:T.muted, marginTop:1}}>
                  {r.type === 'melakartha'
                    ? `Melakartha · #${r.mela}`
                    : `Janya · ${r.melaName} (${r.mela})`}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Raga Info Panel ────────────────────────────────────────────
function RagaPanel({ raga, baseF, ctxRef }) {
  if (!raga) return null
  const swCount = raga.s.length
  const swLabel = swaraLabel(swCount)
  const janyaList = raga.type === 'melakartha' ? (JANYA_BY_MELA[raga.mela] || []) : []

  const upper = { l: 'Ṡ', v: 12 }
  const aroSwaras = [...raga.s, upper]
  const avoSwaras = [upper, ...[...raga.s].reverse()]

  const badge = (label, bg, color, border) => (
    <span style={{fontSize:11, padding:'2px 8px', borderRadius:5, fontWeight:500,
      background:bg, color, border:`0.5px solid ${border}`}}>
      {label}
    </span>
  )

  const playBtn = (swaras) => (
    <button
      onClick={() => playSequence(swaras.map(s => s.v), baseF, ctxRef)}
      style={{background:'none', border:`0.5px solid ${T.border}`, borderRadius:4,
        color:T.amber, fontSize:10, padding:'1px 7px', cursor:'pointer',
        letterSpacing:'0.05em'}}>
      ▶
    </button>
  )

  const swaraChip = (sw, i) => (
    <span key={i}
      onClick={() => playSingle(sw.v, baseF, ctxRef)}
      style={{display:'inline-flex', alignItems:'center', justifyContent:'center',
        minWidth:28, padding:'2px 7px', borderRadius:5, fontSize:12, fontWeight:500,
        background:T.surface, border:`0.5px solid ${T.border}`,
        color:T.text, margin:'0 2px 3px', cursor:'pointer',
        transition:'background 0.1s'}}
      onMouseEnter={e => e.currentTarget.style.background = T.amberBg}
      onMouseLeave={e => e.currentTarget.style.background = T.surface}>
      {sw.l}
    </span>
  )

  return (
    <div style={{fontSize:13, color:T.text}}>
      <div style={{fontWeight:500, fontSize:15, marginBottom:8, color:T.text}}>
        {raga.name}
      </div>

      <div style={{display:'flex', gap:5, marginBottom:14, flexWrap:'wrap'}}>
        {raga.type === 'melakartha'
          ? badge(`Melakartha · #${raga.mela}`, T.blueBg, T.blue, T.blueBdr)
          : badge(`Janya · ${raga.melaName} (${raga.mela})`, T.tealBg, T.teal, T.tealBdr)}
        {raga.vakra && badge('Vakra', T.amberBg, T.amber, T.amberBdr)}
      </div>

      <div style={{marginBottom:12}}>
        <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:5}}>
          <div style={{fontSize:10, color:T.muted, letterSpacing:'0.05em'}}>ĀROHANA</div>
          {playBtn(aroSwaras)}
        </div>
        <div style={{display:'flex', flexWrap:'wrap'}}>
          {aroSwaras.map((sw, i) => swaraChip(sw, i))}
        </div>
      </div>

      <div style={{marginBottom:12}}>
        <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:5}}>
          <div style={{fontSize:10, color:T.muted, letterSpacing:'0.05em'}}>AVAROHANA</div>
          {playBtn(avoSwaras)}
        </div>
        <div style={{display:'flex', flexWrap:'wrap'}}>
          {avoSwaras.map((sw, i) => swaraChip(sw, i))}
        </div>
      </div>

      <div style={{borderTop:`0.5px solid ${T.border}`, paddingTop:10, marginBottom:12}}>
        <div style={{fontSize:10, color:T.muted, letterSpacing:'0.05em', marginBottom:4}}>SWARAS</div>
        <div style={{fontSize:12, color:T.dim}}>{swCount} notes · {swLabel}</div>
      </div>

      {raga.vakra && (
        <div style={{background:T.amberBg, borderRadius:6, padding:'8px 10px', marginBottom:12,
          fontSize:11, color:T.amber, border:`0.5px solid ${T.amberBdr}`}}>
          Avarohana differs — learn the correct descent from your teacher.
        </div>
      )}

      {janyaList.length > 0 && (
        <div style={{borderTop:`0.5px solid ${T.border}`, paddingTop:10}}>
          <div style={{fontSize:10, color:T.muted, letterSpacing:'0.05em', marginBottom:6}}>
            JANYA RAAGAM ({janyaList.length})
          </div>
          <div style={{fontSize:11, color:T.dim, lineHeight:1.9}}>
            {janyaList.join(' · ')}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main App ───────────────────────────────────────────────────
export default function App() {
  const [ragaIdx, setRagaIdx]     = useState(14)
  const [talaIdx, setTalaIdx]     = useState(0)
  const [kattaiIdx, setKattaiIdx] = useState(4)
  const [bpm, setBpm]             = useState(60)
  const [playing, setPlaying]     = useState(false)
  const [droneOn, setDroneOn]     = useState(false)
  const [metroOn, setMetroOn]     = useState(true)
  const [swaraOn, setSwaraOn]     = useState(true)
  const [active, setActive]       = useState(null)

  const ctxRef   = useRef(null)
  const droneRef = useRef([])
  const timerRef = useRef(null)
  const posRef   = useRef({row:0, beat:0})
  const stRef    = useRef({})

  const raga  = RAAGAM[ragaIdx]
  const tala  = TAALAM[talaIdx]
  const baseF = KATTAI[kattaiIdx].f
  const rows  = useMemo(() => buildRows(raga, tala, baseF), [ragaIdx, talaIdx, kattaiIdx])
  const ascCount = rows.filter(r => r.ascending).length

  useEffect(() => { stRef.current = {bpm, metroOn, swaraOn, rows, playing} })

  function getCtx() {
    if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume()
    return ctxRef.current
  }

  function playNote(ctx, f, t, dur) {
    if (!f) return
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.type = 'sine'; o.frequency.value = f
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.2, t + 0.015)
    g.gain.setValueAtTime(0.2, t + dur * 0.6)
    g.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.95)
    o.start(t); o.stop(t + dur)
  }

  function playClick(ctx, t, anga, angaStart) {
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.type = 'square'
    if (angaStart && anga === 'L')      { o.frequency.value = 880; g.gain.setValueAtTime(0.12, t) }
    else if (angaStart && anga === 'D') { o.frequency.value = 660; g.gain.setValueAtTime(0.09, t) }
    else if (angaStart && anga === 'U') { o.frequency.value = 550; g.gain.setValueAtTime(0.09, t) }
    else                                { o.frequency.value = 330; g.gain.setValueAtTime(0.04, t) }
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.03)
    o.start(t); o.stop(t + 0.04)
  }

  function tick() {
    const s = stRef.current
    if (!s.playing) return
    const ctx = getCtx()
    const {row, beat} = posRef.current
    const b = s.rows[row].beats[beat]
    const dur = 60 / s.bpm
    const now = ctx.currentTime
    if (s.swaraOn) playNote(ctx, b.freq, now, dur)
    if (s.metroOn) playClick(ctx, now, b.anga, b.angaStart)
    setActive({row, beat})
    let nr = row, nb = beat + 1
    if (nb >= s.rows[row].beats.length) { nb = 0; nr = (row + 1) % s.rows.length }
    posRef.current = {row: nr, beat: nb}
    timerRef.current = setTimeout(tick, dur * 1000)
  }

  function start() { posRef.current = {row:0,beat:0}; setActive(null); setPlaying(true) }
  useEffect(() => { if (playing) tick() }, [playing])

  function stop() {
    setPlaying(false); clearTimeout(timerRef.current)
    setActive(null); posRef.current = {row:0, beat:0}
  }

  useEffect(() => () => stop(), [])

  function toggleDrone() {
    getCtx()
    if (droneOn) {
      droneRef.current.forEach(n => { try { if(n.stop) n.stop(); n.disconnect() } catch(e){} })
      droneRef.current = []; setDroneOn(false)
    } else {
      const ctx = getCtx()
      const master = ctx.createGain(); master.gain.value = 0.12; master.connect(ctx.destination)
      [[baseF,'sine',1],[baseF*1.002,'triangle',0.3],[hz(baseF,7),'sine',0.35],[baseF*2,'sine',0.18]]
        .forEach(([f,type,g]) => {
          const o = ctx.createOscillator(), gn = ctx.createGain()
          o.type=type; o.frequency.value=f; gn.gain.value=g
          o.connect(gn); gn.connect(master); o.start()
          droneRef.current.push(o)
        })
      droneRef.current.push(master); setDroneOn(true)
    }
  }

  const chip = (isActive, angaStart, beatIdx) => ({
    display:'inline-flex', alignItems:'center', justifyContent:'center',
    minWidth:28, padding:'3px 6px', borderRadius:5, fontSize:12,
    border: isActive ? `0.5px solid ${T.amber}` : `0.5px solid ${T.border}`,
    background: isActive ? T.amber : T.surface,
    color: isActive ? '#0a0a0a' : T.text,
    fontWeight: isActive ? 600 : 400,
    marginLeft: (angaStart && beatIdx !== 0) ? 8 : 2,
    transition: 'background 0.06s',
  })

  const btn = (isActive, color) => {
    const c = {
      teal:  [T.tealBg,  T.teal,  T.tealBdr],
      blue:  [T.blueBg,  T.blue,  T.blueBdr],
      amber: [T.amberBg, T.amber, T.amberBdr],
      red:   [T.redBg,   T.red,   T.redBdr],
    }[color]
    return {
      fontFamily:'inherit', fontSize:12, padding:'6px 12px', borderRadius:6, cursor:'pointer',
      border: isActive ? `0.5px solid ${c[2]}` : `0.5px solid ${T.border}`,
      background: isActive ? c[0] : T.surface,
      color: isActive ? c[1] : T.muted,
    }
  }

  const sel = {
    width:'100%', padding:'6px 8px',
    border:`0.5px solid ${T.border}`, borderRadius:6,
    fontSize:12, background:T.surface, color:T.text,
  }

  const lbl = {fontSize:10, color:T.muted, letterSpacing:'0.05em', marginBottom:4}

  return (
    <div style={{display:'grid', gridTemplateColumns:'240px 1fr', minHeight:'100vh',
      fontFamily:'system-ui, sans-serif', fontSize:13,
      background:T.bg, color:T.text}}>

      {/* ── Sidebar ── */}
      <div style={{borderRight:`0.5px solid ${T.border}`, padding:'20px 16px',
        background:T.sidebar, overflowY:'auto',
        display:'flex', flexDirection:'column', gap:20}}>

        <div style={{paddingBottom:8, borderBottom:`0.5px solid ${T.border}`}}>
          <div style={{fontSize:18, fontWeight:600, color:T.amber, letterSpacing:'-0.01em'}}>
            Panchamam
          </div>
          <div style={{fontSize:11, color:T.muted, marginTop:2}}>
            Sapta Tāla Alankāram · Phase 1
          </div>
        </div>

        <div>
          <div style={lbl}>RĀGAM</div>
          <RAAGAMearch value={ragaIdx} onChange={idx => { stop(); setRagaIdx(idx) }} />
        </div>

        <div style={{borderTop:`0.5px solid ${T.border}`, paddingTop:16}}>
          <RagaPanel raga={raga} baseF={baseF} ctxRef={ctxRef} />
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{padding:'24px 32px', maxWidth:720, overflowY:'auto'}}>

        {/* Controls */}
        <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:10, marginBottom:14}}>
          <div>
            <div style={lbl}>TĀLAM</div>
            <select style={sel} value={talaIdx}
              onChange={e => { stop(); setTalaIdx(+e.target.value) }}>
              {TAALAM.map((t, i) =>
                <option key={i} value={i}>{t.name} — {t.struct} ({t.beats} beats)</option>)}
            </select>
          </div>
          <div>
            <div style={lbl}>KATTAI</div>
            <select style={sel} value={kattaiIdx}
              onChange={e => setKattaiIdx(+e.target.value)}>
              {KATTAI.map((k, i) => <option key={i} value={i}>Kattai {k.l}</option>)}
            </select>
          </div>
        </div>

        {/* Tempo */}
        <div style={{background:T.surface, borderRadius:8, padding:'10px 14px',
          marginBottom:14, display:'flex', alignItems:'center', gap:14,
          border:`0.5px solid ${T.border}`}}>
          <span style={{fontSize:10, color:T.muted, letterSpacing:'0.05em', whiteSpace:'nowrap'}}>
            TEMPO
          </span>
          <input type="range" min="30" max="180" step="1" value={bpm}
            onChange={e => setBpm(+e.target.value)}
            style={{flex:1, accentColor:T.amber}} />
          <span style={{fontSize:13, fontWeight:600, minWidth:55,
            color:T.amber, textAlign:'right'}}>{bpm} BPM</span>
        </div>

        {/* Transport */}
        <div style={{display:'flex', gap:7, flexWrap:'wrap', paddingBottom:16,
          marginBottom:16, borderBottom:`0.5px solid ${T.border}`}}>
          <button onClick={playing ? stop : start}
            style={{...btn(playing,'red'), padding:'7px 20px', fontSize:13, fontWeight:600}}>
            {playing ? '■ Stop' : '▶ Play'}
          </button>
          <button onClick={toggleDrone} style={btn(droneOn,'teal')}>
            {droneOn ? '◉' : '○'} Shruti drone
          </button>
          <button onClick={() => setMetroOn(v => !v)} style={btn(metroOn,'blue')}>
            {metroOn ? '◉' : '○'} Metronome
          </button>
          <button onClick={() => setSwaraOn(v => !v)} style={btn(swaraOn,'amber')}>
            {swaraOn ? '◉' : '○'} Swara audio
          </button>
        </div>

        {/* Sequence */}
        <div style={{fontSize:10, color:T.muted, letterSpacing:'0.05em', marginBottom:8}}>
          ↑ ĀROHANA — {tala.name} ({tala.struct})
        </div>
        {rows.filter(r => r.ascending).map((row, ri) => (
          <div key={ri} style={{display:'flex', alignItems:'center',
            marginBottom:5, flexWrap:'wrap'}}>
            <span style={{fontSize:10, color:T.dim, minWidth:20, marginRight:6}}>
              {row.baseLabel}
            </span>
            {row.beats.map((b, bi) => (
              <span key={bi} style={chip(active?.row === ri && active?.beat === bi, b.angaStart, bi)}>
                {b.label}
              </span>
            ))}
          </div>
        ))}

        <div style={{fontSize:10, color:T.muted, letterSpacing:'0.05em', margin:'12px 0 8px'}}>
          ↓ AVAROHANA — {tala.name} ({tala.struct})
        </div>
        {rows.filter(r => !r.ascending).map((row, ri) => {
          const gr = ascCount + ri
          return (
            <div key={ri} style={{display:'flex', alignItems:'center',
              marginBottom:5, flexWrap:'wrap'}}>
              <span style={{fontSize:10, color:T.dim, minWidth:20, marginRight:6}}>
                {row.baseLabel}
              </span>
              {row.beats.map((b, bi) => (
                <span key={bi}
                  style={chip(active?.row === gr && active?.beat === bi, b.angaStart, bi)}>
                  {b.label}
                </span>
              ))}
            </div>
          )
        })}

        <div style={{marginTop:20, fontSize:10, color:T.dim}}>
          Phase 1 · Phase 2: mic + pitch detection · Phase 3: gamaka ear training
        </div>
      </div>
    </div>
  )
}