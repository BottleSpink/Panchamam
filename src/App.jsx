import { useState, useEffect, useRef, useMemo } from 'react'
import { RAAGAM, JANYA_BY_MELA, swaraLabel } from './data/ragam'
import { TAALAM } from './data/talam'

const KATTAI = [
  {l:"½",  w:"C",  f:130.81},
  {l:"1",  w:"C#", f:138.59},
  {l:"1½", w:"D",  f:146.83},
  {l:"2",  w:"D#", f:155.56},
  {l:"2½", w:"E",  f:164.81},
  {l:"3",  w:"F",  f:174.61},
  {l:"3½", w:"F#", f:185.00},
  {l:"4",  w:"G",  f:196.00},
  {l:"4½", w:"G#", f:207.65},
  {l:"5",  w:"A",  f:220.00},
  {l:"5½", w:"A#", f:233.08},
  {l:"6",  w:"B",  f:246.94}
]

const T = {
  bg:'#0a0a0a', sidebar:'#111111', surface:'#1a1a1a', border:'#2a2a2a',
  text:'#f0ebe0', muted:'#888', dim:'#444',
  amber:'#d4a843', amberBg:'#2a1f0a', amberBdr:'#5a3a0a',
  teal:'#3eb489', tealBg:'#0a2018', tealBdr:'#1a5038',
  blue:'#5a9fd4', blueBg:'#0a1828', blueBdr:'#1a3858',
  red:'#e24b4a', redBg:'#280a0a', redBdr:'#5a1a1a',
}

function hz(base, semi) { return base * Math.pow(2, semi / 12) }

function getAngaSegments(pat) {
  const segments = []
  let cur = null
  pat.forEach((p, i) => {
    if (p.s) {
      if (cur) segments.push(cur)
      cur = { type: p.a, startBeat: i, count: 1 }
    } else if (cur) { cur.count++ }
  })
  if (cur) segments.push(cur)
  return segments
}

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
  const dur = 0.6, t = ctx.currentTime
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
  const desc = [...asc].reverse()
  const rows = []
  const makeRow = (swaras, base) => {
  let lastFreq = null
  return {
    beats: tala.pat.map(p => {
      const sw = p.o !== null ? swaras[base + p.o] : null
      if (sw) lastFreq = hz(baseF, sw.v)
      return {
        freq: sw ? hz(baseF, sw.v) : lastFreq,
        label: sw ? sw.l : ',',
        isHeld: p.o === null,
        anga: p.a, angaStart: !!p.s
      }
    }),
    baseLabel: swaras[base].l
  }
}
  const n = asc.length
  for (let r = 0; r <= n - 4; r++) rows.push({...makeRow(asc, r), ascending: true})
  for (let r = 0; r <= n - 4; r++) rows.push({...makeRow(desc, r), ascending: false})
  return rows
}

// ── Pendulum ───────────────────────────────────────────────────
function Pendulum({ playing, bpm }) {
  const dur = playing ? 60 / bpm : 0.5
  return (
    <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:4}}>
      <div style={{position:'relative', width:40, height:52, display:'flex',
        justifyContent:'center', alignItems:'flex-start'}}>
        <div style={{
          width:2, height:44, borderRadius:1,
          background: playing ? T.amber : T.dim,
          transformOrigin:'top center',
          animation: playing ? `swing ${dur}s ease-in-out infinite alternate` : 'none',
          transition:'background 0.2s',
        }}>
          <div style={{
            position:'absolute', bottom:-3, left:'50%',
            transform:'translateX(-50%)',
            width:10, height:10, borderRadius:'50%',
            background: playing ? T.amber : T.dim,
          }}/>
        </div>
        <div style={{
          position:'absolute', bottom:0, left:'50%',
          transform:'translateX(-50%)',
          width:14, height:6, borderRadius:3,
          background:T.surface, border:`0.5px solid ${T.border}`,
        }}/>
      </div>
      <style>{`@keyframes swing { from { transform: rotate(28deg); } to { transform: rotate(-28deg); } }`}</style>
      <div style={{fontSize:11, fontWeight:600, color: playing ? T.amber : T.muted}}>{bpm}</div>
      <div style={{fontSize:9, color:T.dim, letterSpacing:'0.05em'}}>BPM</div>
    </div>
  )
}

// ── Tālam Cards ────────────────────────────────────────────────
function TalamCards({ talaIdx, setTalaIdx, activeBeat, onStop }) {
  return (
    <div style={{marginBottom:16}}>
      <div style={{fontSize:10, color:T.muted, letterSpacing:'0.05em', marginBottom:8}}>TĀLAM</div>
      <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
        {TAALAM.map((t, i) => {
          const isSel = i === talaIdx
          let beatCursor = 0
          const angasWithBeats = t.angas.map(seg => {
            const start = beatCursor
            const beats = seg.type === 'L' ? seg.count : seg.type === 'D' ? 2 : 1
            beatCursor += beats
            return { ...seg, startBeat: start, beats }
          })
          return (
            <div key={i} onClick={() => { onStop(); setTalaIdx(i) }}
              style={{
                padding:'8px 10px', borderRadius:8, cursor:'pointer',
                border:`0.5px solid ${isSel ? T.amber : T.border}`,
                background: isSel ? T.amberBg : T.surface,
                transition:'all 0.15s', minWidth: isSel ? 'auto' : 72,
              }}>
              <div style={{fontSize:11, fontWeight:500, marginBottom: isSel ? 8 : 4,
                color: isSel ? T.amber : T.text}}>{t.name}</div>
              {!isSel && (
                <div style={{fontSize:9, color:T.dim}}>{t.beats} beats</div>
              )}
              {isSel && (
                <>
                  <div style={{display:'flex', gap:5, alignItems:'center', marginBottom:6}}>
                    {angasWithBeats.map((seg, si) => {
                      if (seg.type === 'D') {
                        const isActive = activeBeat != null &&
                          activeBeat >= seg.startBeat && activeBeat < seg.startBeat + seg.beats
                        return (
                          <div key={si} style={{
                            width:24, height:28, borderRadius:4,
                            border:`0.5px solid ${isActive ? T.amber : T.border}`,
                            background: isActive ? T.amber : T.bg,
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:13, fontWeight:700,
                            color: isActive ? '#0a0a0a' : T.muted,
                            transition:'background 0.06s',
                          }}>O</div>
                        )
                      }
                      if (seg.type === 'U') {
                        const isActive = activeBeat != null &&
                          activeBeat >= seg.startBeat && activeBeat < seg.startBeat + seg.beats
                        return (
                          <div key={si} style={{
                            width:24, height:28, borderRadius:4,
                            border:`0.5px solid ${isActive ? T.amber : T.border}`,
                            background: isActive ? T.amber : T.bg,
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:13, fontWeight:700,
                            color: isActive ? '#0a0a0a' : T.muted,
                            transition:'background 0.06s',
                          }}>U</div>
                        )
                      }
                      return (
                        <div key={si} style={{display:'flex', gap:2}}>
                          {Array.from({length: seg.count}).map((_, ai) => {
                            const beatIdx = seg.startBeat + ai
                            const isActive = activeBeat === beatIdx
                            return (
                              <div key={ai} style={{
                                width:18, height:28, borderRadius:4,
                                border:`0.5px solid ${isActive ? T.amber : T.border}`,
                                background: isActive ? T.amber : T.bg,
                                display:'flex', alignItems:'center', justifyContent:'center',
                                transition:'background 0.06s',
                              }}>
                                <div style={{width:1.5, height:14, borderRadius:1,
                                  background: isActive ? '#0a0a0a' : T.dim}}/>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                  <div style={{fontSize:9, color:T.dim}}>{t.struct} · {t.beats} beats</div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Kattai Panel ───────────────────────────────────────────────
function KattaiPanel({ kattaiIdx, setKattaiIdx }) {
  return (
    <div style={{
      borderLeft:`0.5px solid ${T.border}`,
      background:T.sidebar,
      padding:'16px 8px',
      display:'flex', flexDirection:'column', alignItems:'center', gap:3,
      overflowY:'auto', minWidth:68,
    }}>
      <div style={{fontSize:9, color:T.muted, letterSpacing:'0.05em',
        marginBottom:8, textAlign:'center', lineHeight:1.6}}>
        KATTAI<br/>SHRUTI
      </div>
      {KATTAI.map((k, i) => {
        const isSel = i === kattaiIdx
        return (
          <button key={i} onClick={() => setKattaiIdx(i)}
            style={{
              fontFamily:'inherit', cursor:'pointer', width:52,
              padding:'5px 4px', borderRadius:5,
              border:`0.5px solid ${isSel ? T.amber : T.border}`,
              background: isSel ? T.amber : T.surface,
              display:'flex', flexDirection:'column', alignItems:'center', gap:1,
            }}>
            <span style={{fontSize:11, fontWeight: isSel ? 700 : 400,
              color: isSel ? '#0a0a0a' : T.text}}>{k.l}</span>
            <span style={{fontSize:9, color: isSel ? '#3a2a00' : T.dim}}>{k.w}</span>
          </button>
        )
      })}
    </div>
  )
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
            const isSel = idx === value
            return (
              <div key={i} onMouseDown={() => { onChange(idx); setOpen(false); setQuery('') }}
                style={{padding:'8px 12px', cursor:'pointer', fontSize:13,
                  background: isSel ? T.amberBg : 'transparent',
                  borderBottom:`0.5px solid ${T.border}`}}>
                <div style={{fontWeight: isSel ? 500 : 400,
                  color: isSel ? T.amber : T.text}}>{r.name}</div>
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
  const upper = { l:'Ṡ', v:12 }
  const aroSwaras = [...raga.s, upper]
  const avoSwaras = [upper, ...[...raga.s].reverse()]

  const badge = (label, bg, color, border) => (
    <span style={{fontSize:11, padding:'2px 8px', borderRadius:5, fontWeight:500,
      background:bg, color, border:`0.5px solid ${border}`}}>{label}</span>
  )
  const playBtn = (swaras) => (
    <button onClick={() => playSequence(swaras.map(s => s.v), baseF, ctxRef)}
      style={{background:'none', border:`0.5px solid ${T.border}`, borderRadius:4,
        color:T.amber, fontSize:10, padding:'1px 7px', cursor:'pointer'}}>▶</button>
  )
  const swaraChip = (sw, i) => (
    <span key={i} onClick={() => playSingle(sw.v, baseF, ctxRef)}
      style={{display:'inline-flex', alignItems:'center', justifyContent:'center',
        minWidth:28, padding:'2px 7px', borderRadius:5, fontSize:12, fontWeight:500,
        background:T.surface, border:`0.5px solid ${T.border}`,
        color:T.text, margin:'0 2px 3px', cursor:'pointer', transition:'background 0.1s'}}
      onMouseEnter={e => e.currentTarget.style.background = T.amberBg}
      onMouseLeave={e => e.currentTarget.style.background = T.surface}>
      {sw.l}
    </span>
  )

  return (
    <div style={{fontSize:13, color:T.text}}>
      <div style={{fontWeight:500, fontSize:15, marginBottom:8}}>{raga.name}</div>
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
        <div style={{display:'flex', flexWrap:'wrap'}}>{aroSwaras.map(swaraChip)}</div>
      </div>
      <div style={{marginBottom:12}}>
        <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:5}}>
          <div style={{fontSize:10, color:T.muted, letterSpacing:'0.05em'}}>AVAROHANA</div>
          {playBtn(avoSwaras)}
        </div>
        <div style={{display:'flex', flexWrap:'wrap'}}>{avoSwaras.map(swaraChip)}</div>
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
  const [kattaiIdx, setKattaiIdx] = useState(8)
  const [bpm, setBpm]             = useState(60)
  const [kalam, setKalam]         = useState(1)
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

  useEffect(() => { stRef.current = {bpm, kalam, metroOn, swaraOn, rows, playing} })

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
    const {row, swaraPos, talaPos} = posRef.current
    const dur = 60 / s.bpm
    const now = ctx.currentTime

    // play kālam swaras within this akshara
    for (let k = 0; k < s.kalam; k++) {
      const sp = (swaraPos + k) % s.rows[row].beats.length
      const b = s.rows[row].beats[sp]
      if (s.swaraOn && !b.isHeld) {
        // count how many held beats follow
        let holdCount = 1
        let next = (sp + 1) % s.rows[row].beats.length
        while (s.rows[row].beats[next]?.isHeld && holdCount < 8) {
          holdCount++
          next = (next + 1) % s.rows[row].beats.length
        }
        const noteDur = (dur / s.kalam) * holdCount
        const t = now + (k * dur / s.kalam)
        playNote(ctx, b.freq, t, noteDur)
      }
    }

    // metronome on akshara start
    const tb = s.rows[row].beats[talaPos]
    if (s.metroOn) playClick(ctx, now, tb.anga, tb.angaStart)

    // highlight kālam swaras
    setActive({row, beatStart: swaraPos, count: s.kalam, talaPos})

    // advance swara position by kālam
    let newSwaraPos = swaraPos + s.kalam
    let nr = row

    // advance tala position by 1 always
    let newTalaPos = talaPos + 1

    if (newSwaraPos >= s.rows[row].beats.length) {
      newSwaraPos = newSwaraPos % s.rows[row].beats.length
      nr = (row + 1) % s.rows.length
    }
    if (newTalaPos >= s.rows[row].beats.length) {
      newTalaPos = 0
    }

    posRef.current = {row: nr, swaraPos: newSwaraPos, talaPos: newTalaPos}
    timerRef.current = setTimeout(tick, dur * 1000)
  }


  function start() {
  const ctx = getCtx() // create + resume inside the click handler
  ctx.resume().then(() => {
    posRef.current = {row:0, swaraPos:0, talaPos:0}
    setActive(null)
    setPlaying(true)
  })
}

  useEffect(() => { if (playing) tick() }, [playing])

  function stop() {
    setPlaying(false); clearTimeout(timerRef.current)
    setActive(null)
    posRef.current = {row:0, swaraPos:0, talaPos:0}
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

  const chip = (rowIdx, bi, isActive, isActiveRow) => ({
    display:'inline-flex', alignItems:'center', justifyContent:'center',
    minWidth:30, padding:'4px 7px', borderRadius:5, fontSize:12,
    border: isActive ? `0.5px solid ${T.amber}` : `0.5px solid ${isActiveRow ? '#3a3a3a' : T.border}`,
    background: isActive ? T.amber : isActiveRow ? '#1e1e1e' : T.surface,
    color: isActive ? '#0a0a0a' : isActiveRow ? T.text : '#aaa',
    fontWeight: isActive ? 700 : isActiveRow ? 500 : 400,
    marginLeft: 2,
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

  const kalamOpts = [
    {label:'1×', val:1, sub:'1 note/beat'},
    {label:'2×', val:2, sub:'2 notes/beat'},
    {label:'3×', val:4, sub:'4 notes/beat'},
  ]

  return (
    <div style={{display:'grid', gridTemplateColumns:'240px 1fr', minHeight:'100vh',
      fontFamily:'system-ui, sans-serif', fontSize:13, background:T.bg, color:T.text}}>

      {/* ── Left Sidebar ── */}
      <div style={{borderRight:`0.5px solid ${T.border}`, padding:'20px 16px',
        background:T.sidebar, overflowY:'auto', display:'flex', flexDirection:'column', gap:20}}>
        <div style={{paddingBottom:12, borderBottom:`0.5px solid ${T.border}`}}>
        <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:4}}>


        </div>
      </div>
        <div>
          <div style={{fontSize:10, color:T.muted, letterSpacing:'0.05em', marginBottom:5}}>RĀGAM</div>
          <RAAGAMearch value={ragaIdx} onChange={idx => { stop(); setRagaIdx(idx) }} />
        </div>
        <div style={{borderTop:`0.5px solid ${T.border}`, paddingTop:16}}>
          <RagaPanel raga={raga} baseF={baseF} ctxRef={ctxRef} />
        </div>
      </div>

      {/* ── Main + Kattai ── */}
      <div style={{display:'flex', overflowY:'auto'}}>

        
        {/* Content */}
        <div style={{padding:'24px 28px', flex:1, maxWidth:760, overflowY:'auto'}}>

          {/* Header */}
          <div style={{
            display:'flex', alignItems:'center', gap:12,
            paddingBottom:20, marginBottom:8,
            borderBottom:`0.5px solid ${T.border}`,
          }}>
            <div style={{
              width:38, height:38, borderRadius:'50%',
              background:T.amberBg,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:20, color:T.amber,
              fontFamily:'"Noto Serif Tamil", serif',
            }}>ப</div>
            <div>
              <div style={{
                fontSize:22, color:T.amber, lineHeight:1,
                fontFamily:'"Cormorant Garamond", Georgia, serif',
                fontWeight:400, letterSpacing:'1px',
              }}>Panchamam</div>
              <div style={{fontSize:11, color:T.muted, marginTop:3, letterSpacing:'0.05em'}}>
                Alankāram
              </div>
            </div>
          </div>
                

          <TalamCards
            talaIdx={talaIdx}
            setTalaIdx={setTalaIdx}
            activeBeat={active?.talaPos ?? null}
            onStop={stop}
          />

          {/* Tempo + Pendulum + Kālam */}
          <div style={{display:'flex', alignItems:'center', gap:20, marginBottom:16,
            padding:'12px 16px', background:T.surface, borderRadius:8,
            border:`0.5px solid ${T.border}`}}>
            <Pendulum playing={playing} bpm={bpm} />
            <div style={{flex:1, maxWidth:240}}>
              <input type="range" min="30" max="180" step="1" value={bpm}
                onChange={e => setBpm(+e.target.value)}
                style={{width:'100%', accentColor:T.amber}} />
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:4, alignItems:'flex-end'}}>
              <div style={{fontSize:9, color:T.muted, letterSpacing:'0.05em'}}>KĀLAM / SPEED</div>
              <div style={{display:'flex', gap:4}}>
                {kalamOpts.map(k => (
                  <div key={k.val} style={{display:'flex', flexDirection:'column',
                    alignItems:'center', gap:2}}>
                    <button onClick={() => setKalam(k.val)}
                      style={{...btn(kalam===k.val,'amber'), padding:'4px 10px', fontWeight:700}}>
                      {k.label}
                    </button>
                    <span style={{fontSize:8, color:T.dim, whiteSpace:'nowrap'}}>{k.sub}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Play + Transport */}
          <div style={{display:'flex', gap:8, alignItems:'center',
            paddingBottom:16, marginBottom:16, borderBottom:`0.5px solid ${T.border}`}}>
            <button onClick={playing ? stop : start}
              style={{
                fontFamily:'inherit', fontSize:15, fontWeight:700,
                padding:'12px 36px', borderRadius:8, cursor:'pointer',
                border:`0.5px solid ${playing ? T.redBdr : T.amberBdr}`,
                background: playing ? T.redBg : T.amberBg,
                color: playing ? T.red : T.amber,
                letterSpacing:'0.05em',
              }}>
              {playing ? '■  Stop' : '▶  Play'}
            </button>
            <div style={{width:1, height:28, background:T.border, margin:'0 4px'}}/>
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
          {rows.filter(r => r.ascending).map((row, ri) => {
            const isActiveRow = active?.row === ri
            return (
              <div key={ri} style={{
                display:'flex', alignItems:'center', marginBottom:4, flexWrap:'wrap',
                padding:'3px 4px', borderRadius:5,
                background: isActiveRow ? 'rgba(212,168,67,0.05)' : 'transparent',
                transition:'background 0.1s',
              }}>
                <span style={{fontSize:11, fontWeight:500, minWidth:22, marginRight:6,
                  color: isActiveRow ? T.amber : T.dim}}>
                  {row.baseLabel}
                </span>
                {row.beats.map((b, bi) => {
                  const start = active?.beatStart ?? -1
                  const count = active?.count ?? 0
                  const rowLen = row.beats.length
                  const overflow = Math.max(0, start + count - rowLen)

                  const isActive = isActiveRow
                    ? (bi >= start && bi < start + count)
                    : (active?.row === ri - 1 && bi < overflow)

                  return (
                    <span key={bi} style={chip(ri, bi, isActive, isActiveRow || (active?.row === ri - 1 && bi < overflow))}>
                      {b.label}
                    </span>
                  )
                })}
              </div>
            )
          })}

          <div style={{fontSize:10, color:T.muted, letterSpacing:'0.05em', margin:'12px 0 8px'}}>
            ↓ AVAROHANA — {tala.name} ({tala.struct})
          </div>
          {rows.filter(r => !r.ascending).map((row, ri) => {
            const gr = ascCount + ri
            const isActiveRow = active?.row === gr
            return (
              <div key={ri} style={{
                display:'flex', alignItems:'center', marginBottom:4, flexWrap:'wrap',
                padding:'3px 4px', borderRadius:5,
                background: isActiveRow ? 'rgba(212,168,67,0.05)' : 'transparent',
                transition:'background 0.1s',
              }}>
                <span style={{fontSize:11, fontWeight:500, minWidth:22, marginRight:6,
                  color: isActiveRow ? T.amber : T.dim}}>
                  {row.baseLabel}
                </span>
                {row.beats.map((b, bi) => {
                  const start = active?.beatStart ?? -1
                  const count = active?.count ?? 0
                  const rowLen = row.beats.length
                  const overflow = Math.max(0, start + count - rowLen)

                  const isActive = isActiveRow
                    ? (bi >= start && bi < start + count)
                    : (active?.row === gr - 1 && bi < overflow)

                  return (
                    <span key={bi} style={chip(gr, bi, isActive, isActiveRow || (active?.row === gr - 1 && bi < overflow))}>
                      {b.label}
                    </span>
                  )
                })}
              </div>
            )
          })}

          <div style={{marginTop:20, fontSize:10, color:T.dim}}>
            Phase 1 · Phase 2: mic + pitch detection · Phase 3: gamaka ear training
          </div>

        </div>

        {/* Kattai — right of content */}
        <KattaiPanel kattaiIdx={kattaiIdx} setKattaiIdx={setKattaiIdx} />

      </div>

    </div>
  )
}