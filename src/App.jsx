import { useState, useEffect, useRef, useMemo } from 'react'
import { RAAGAM, JANYA_BY_MELA, swaraLabel } from './data/ragam'
import { SARALI, DATU, ADI_BEATS } from './data/varisai'
import { TAALAM } from './data/talam'
import { inject } from '@vercel/analytics'
inject()

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

// Adi talam: I₄ O₂ O₂ = 8 beats
// beat positions: 0-3 = Laghu, 4-5 = Dhrutam, 6-7 = Dhrutam
const ADI_ANGA = (bi) => ({
  anga: bi < 4 ? 'L' : 'D',
  angaStart: bi === 0 || bi === 4 || bi === 6,
})

function buildVarisaiRows(raga, baseF, type, patternIdx) {
  // Varisai only works for sampurna ragas (7 swaras)
  if (raga.s.length < 7) return []
  const upper = { l:'Ṡ', v:12 }
  const swaras = [...raga.s, upper] // indices 0-7

  const patterns = type === 'sarali' ? SARALI : DATU
  const pattern = patterns[patternIdx] || patterns[0]

  let lastFreq = null
  return pattern.rows.map(row => ({
    beats: row.degrees.map((deg, bi) => {
      const sw = deg !== null ? swaras[deg] : null
      if (sw) lastFreq = hz(baseF, sw.v)
      return {
        freq: sw ? hz(baseF, sw.v) : lastFreq,
        label: sw ? sw.l : ',',
        isHeld: deg === null,
        ...ADI_BEATS[bi],
      }
    }),
    ascending: row.ascending,
    baseLabel: null,
  }))
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

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
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

// ── Mode Selector ──────────────────────────────────────────────
function ModeSelector({ mode, setMode, onStop }) {
  return (
    <div style={{display:'flex', gap:6, padding:'10px 16px',
      borderBottom:`0.5px solid ${T.border}`, flexShrink:0}}>
      {[{label:'Alankāram', val:'alankaram'}, {label:'Varisai', val:'varisai'}].map(m => (
        <div key={m.val} onClick={() => { onStop(); setMode(m.val) }}
          style={{
            padding:'7px 18px', borderRadius:8, cursor:'pointer',
            fontSize:12, fontWeight:500,
            border:`0.5px solid ${mode===m.val ? T.amber : T.border}`,
            background: mode===m.val ? T.amberBg : T.surface,
            color: mode===m.val ? T.amber : T.muted,
            transition:'all 0.15s',
          }}>{m.label}</div>
      ))}
    </div>
  )
}

// ── Adi Talam Display (fixed, for varisai) ─────────────────────
function AdiTalamDisplay({ activeBeat }) {
  // I₄ O₂ O₂ = 8 beats
  const angas = [
    { type:'L', count:4, startBeat:0 },
    { type:'D', count:2, startBeat:4 },
    { type:'D', count:2, startBeat:6 },
  ]
  return (
    <div style={{padding:'10px 16px', borderBottom:`0.5px solid ${T.border}`, flexShrink:0}}>
      <div style={{fontSize:9, color:T.muted, letterSpacing:'0.05em', marginBottom:7}}>
        TĀLAM — Adi (I₄ O₂ O₂ · 8 beats)
      </div>
      <div style={{
        display:'inline-flex', gap:5, alignItems:'center',
        padding:'8px 10px', borderRadius:8,
        border:`0.5px solid ${T.amber}`, background:T.amberBg,
      }}>
        {angas.map((seg, si) => {
          if (seg.type === 'D') {
            const isActive = activeBeat != null &&
              activeBeat >= seg.startBeat && activeBeat < seg.startBeat + seg.count
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
    </div>
  )
}

// ── Varisai Type Selector ──────────────────────────────────────
function VarisaiSelector({ varisaiType, setVarisaiType, varisaiPattern, setVarisaiPattern, onStop, raga }) {
  const patterns = varisaiType === 'sarali' ? SARALI : DATU
  const notSampurna = raga.s.length < 7

  return (
    <div style={{borderBottom:`0.5px solid ${T.border}`, flexShrink:0}}>
      {/* Type tabs */}
      <div style={{display:'flex', gap:5, padding:'10px 16px 0'}}>
        {[{label:'Sarali', val:'sarali'}, {label:'Datu', val:'datu'}].map(v => (
          <div key={v.val} onClick={() => { onStop(); setVarisaiType(v.val); setVarisaiPattern(0) }}
            style={{
              padding:'6px 16px', borderRadius:'6px 6px 0 0', cursor:'pointer',
              fontSize:12, fontWeight:500,
              border:`0.5px solid ${varisaiType===v.val ? T.amber : T.border}`,
              borderBottom: varisaiType===v.val ? `0.5px solid ${T.amberBg}` : `0.5px solid ${T.border}`,
              background: varisaiType===v.val ? T.amberBg : T.surface,
              color: varisaiType===v.val ? T.amber : T.muted,
            }}>{v.label}</div>
        ))}
      </div>
      {/* Pattern numbers */}
      {notSampurna ? (
        <div style={{padding:'8px 16px 10px', fontSize:11, color:T.dim}}>
          Varisai available for sampurna ragas only (7 swaras)
        </div>
      ) : (
        <div style={{display:'flex', flexWrap:'wrap', gap:4, padding:'8px 16px 10px'}}>
          {patterns.map((p, i) => (
            <div key={i} onClick={() => { onStop(); setVarisaiPattern(i) }}
              style={{
                padding:'4px 10px', borderRadius:5, cursor:'pointer',
                fontSize:11, fontWeight:500,
                border:`0.5px solid ${varisaiPattern===i ? T.amber : T.border}`,
                background: varisaiPattern===i ? T.amberBg : T.surface,
                color: varisaiPattern===i ? T.amber : T.muted,
                transition:'all 0.1s',
              }}
              title={p.desc}>
              {p.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Tālam Cards — desktop wrap, mobile horizontal scroll ───────
function TalamCards({ talaIdx, setTalaIdx, activeBeat, onStop, mobile }) {
  return (
    <div style={{marginBottom:16}}>
      {!mobile && <div style={{fontSize:10, color:T.muted, letterSpacing:'0.05em', marginBottom:8}}>TĀLAM</div>}
      <div style={{
        display:'flex', gap:6,
        flexWrap: mobile ? 'nowrap' : 'wrap',
        overflowX: mobile ? 'auto' : 'visible',
        paddingBottom: mobile ? 4 : 0,
        scrollbarWidth:'none',
      }}>
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
                transition:'all 0.15s',
                minWidth: mobile ? 'auto' : (isSel ? 'auto' : 72),
                flexShrink: mobile ? 0 : 1,
              }}>
              <div style={{fontSize:11, fontWeight:500, marginBottom: isSel ? 8 : 4,
                color: isSel ? T.amber : T.text}}>{t.name}</div>
              {!isSel && <div style={{fontSize:9, color:T.dim}}>{t.beats} beats</div>}
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

// ── Kattai Panel — desktop ─────────────────────────────────────
function KattaiPanel({ kattaiIdx, setKattaiIdx }) {
  return (
    <div style={{
      borderLeft:`0.5px solid ${T.border}`, background:T.sidebar,
      padding:'16px 8px', display:'flex', flexDirection:'column', alignItems:'center', gap:3,
      overflowY:'auto', minWidth:68,
    }}>
      <div style={{fontSize:9, color:T.muted, letterSpacing:'0.05em',
        marginBottom:8, textAlign:'center', lineHeight:1.6}}>KATTAI<br/>SHRUTI</div>
      {KATTAI.map((k, i) => {
        const isSel = i === kattaiIdx
        return (
          <button key={i} onClick={() => setKattaiIdx(i)}
            style={{
              fontFamily:'inherit', cursor:'pointer', width:52, padding:'5px 4px', borderRadius:5,
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
function RAAGAMearch({ value, onChange, filter }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    const list = filter ? RAAGAM.filter(filter) : RAAGAM
    return list.filter(r => r.name.toLowerCase().includes(q))
  }, [query, filter])
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  return (
    <div ref={ref} style={{position:'relative'}}>
      <div style={{position:'absolute', left:10, top:'50%', transform:'translateY(-50%)',
        fontSize:14, color:T.muted, pointerEvents:'none'}}>🔍</div>
      <input
        value={open ? query : ''}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => { setQuery(''); setOpen(true) }}
        placeholder="Search rāgam..."
        style={{width:'100%', padding:'8px 10px 8px 32px',
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
                  {r.type === 'melakartha' ? `Melakartha · #${r.mela}` : `Janya · ${r.melaName} (${r.mela})`}
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
      <div style={{display:'flex', gap:5, marginBottom:8, flexWrap:'wrap'}}>
        {raga.type === 'melakartha'
          ? badge(`Melakartha · #${raga.mela}`, T.blueBg, T.blue, T.blueBdr)
          : badge(`Janya · ${raga.melaName} (${raga.mela})`, T.tealBg, T.teal, T.tealBdr)}
        {raga.vakra && badge('Vakra', T.amberBg, T.amber, T.amberBdr)}
      </div>
      <div style={{fontSize:11, color:T.dim, marginBottom:12}}>{swCount} notes · {swLabel}</div>
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
          <div style={{fontSize:11, color:T.dim, lineHeight:1.9}}>{janyaList.join(' · ')}</div>
        </div>
      )}
    </div>
  )
}

// ── About Modal ────────────────────────────────────────────────
function AboutModal({ onClose }) {
  return (
    <div style={{position:'fixed', inset:0, zIndex:300, display:'flex',
      alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.75)'}}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        style={{
          background:T.sidebar, border:`0.5px solid ${T.border}`, borderRadius:12,
          padding:'32px', maxWidth:420, width:'90%', color:T.text,
          maxHeight:'90vh', overflowY:'auto',
        }}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24}}>
          <div>
            <div style={{fontFamily:'"Cormorant Garamond", Georgia, serif',
              fontSize:22, color:T.amber, letterSpacing:'1px'}}>Panchamam</div>
            <div style={{fontSize:11, color:T.muted, marginTop:4,
              fontFamily:'"Noto Serif Tamil", serif'}}>பஞ்சமம்</div>
          </div>
          <button onClick={onClose}
            style={{background:'none', border:'none', color:T.dim,
              fontSize:20, cursor:'pointer', padding:'0 4px', lineHeight:1}}>✕</button>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:12, marginBottom:20}}>
          {[
            {
              q: 'What is Panchamam?',
              a: 'Panchamam is a companion in your Carnatic music journey. It is certainly not your trainer — but a practice guide.'
            },
            {
              q: 'Who is it for?',
              a: (
                <ul style={{margin:0, paddingLeft:16, lineHeight:1.9}}>
                  <li>Anyone looking to practice Carnatic music at home.</li>
                  <li>Beginners — get familiar with the sounds of different swarams, rāgams and tālams.</li>
                  <li>Mid- or senior-level learners — explore new rāgams and practice alankārams.</li>
                  <li>And the best part — you can sing along!</li>
                </ul>
              )
            },
            {
              q: 'Who built this?',
              a: 'A fellow Carnatic music learner. Built for herself originally, then opened it up to everyone. Happy learning!'
            },
          ].map(({q, a}) => (
            <div key={q} style={{
              background:T.bg, border:`0.5px solid ${T.border}`,
              borderRadius:8, padding:'14px 16px',
            }}>
              <div style={{fontSize:11, color:T.amber, fontWeight:500,
                letterSpacing:'0.03em', marginBottom:8}}>{q}</div>
              <div style={{fontSize:13, color:T.text, lineHeight:1.7}}>{a}</div>
            </div>
          ))}
        </div>
        <div style={{borderTop:`0.5px solid ${T.border}`, paddingTop:16, display:'flex',
          flexDirection:'column', gap:10}}>
          <a href="https://forms.gle/cVYK8dv6tx3ESsLZ9" target="_blank" rel="noreferrer"
            style={{fontSize:12, color:T.teal, textDecoration:'none'}}>
            For any feedback, corrections, requests — or if you just want to say hi
          </a>
          <a href="https://razorpay.me/@panchamam" target="_blank" rel="noreferrer"
            style={{fontSize:12, color:T.amber, textDecoration:'none'}}>
            If this helped your practice, you can support me here
          </a>
        </div>
        <div style={{marginTop:16, fontSize:10, color:T.dim}}>
          Phase 1 · Alankāram Practice · panchamam.app
        </div>
      </div>
    </div>
  )
}

// ── Mobile Drawer ──────────────────────────────────────────────
function MobileDrawer({ onClose, raga, ragaIdx, setRagaIdx, kattaiIdx, setKattaiIdx,
  metroOn, setMetroOn, droneOn, toggleDrone, swaraOn, setSwaraOn,
  baseF, ctxRef, stop, showAbout, startMetro, stopMetro, playing, mode }) {

  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    const list = mode === 'varisai'
      ? RAAGAM.filter(r => r.s.length === 7)
      : RAAGAM
    return list.filter(r => r.name.toLowerCase().includes(q))
  }, [query, mode])

  if (searchOpen) {
    return (
      <div style={{position:'fixed', inset:0, zIndex:300, background:T.bg,
        display:'flex', flexDirection:'column'}}>
        <div style={{padding:'16px', borderBottom:`0.5px solid ${T.border}`,
          display:'flex', gap:10, alignItems:'center'}}>
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search rāgam..."
            style={{flex:1, padding:'10px 12px',
              border:`0.5px solid ${T.amber}`, borderRadius:6, fontSize:14,
              background:T.surface, color:T.text}}
          />
          <button onClick={() => { setSearchOpen(false); setQuery('') }}
            style={{background:'none', border:'none', color:T.muted,
              fontSize:13, cursor:'pointer', padding:'0 4px'}}>Cancel</button>
        </div>
        <div style={{flex:1, overflowY:'auto'}}>
          {filtered.map((r, i) => {
            const idx = RAAGAM.indexOf(r)
            const isSel = idx === ragaIdx
            return (
              <div key={i} onClick={() => {
                stop(); setRagaIdx(idx); setSearchOpen(false); setQuery(''); onClose()
              }}
                style={{padding:'12px 16px', borderBottom:`0.5px solid ${T.border}`,
                  cursor:'pointer', background: isSel ? T.amberBg : 'transparent'}}>
                <div style={{fontSize:14, color: isSel ? T.amber : T.text,
                  fontWeight: isSel ? 500 : 400}}>{r.name}</div>
                <div style={{fontSize:11, color:T.muted, marginTop:2}}>
                  {r.type === 'melakartha' ? `Melakartha · #${r.mela}` : `Janya · ${r.melaName} (${r.mela})`}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div style={{position:'fixed', inset:0, zIndex:200, display:'flex'}}>
      <div style={{width:300, background:T.sidebar, display:'flex',
        flexDirection:'column', overflowY:'auto'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center',
          padding:'18px 16px 14px', borderBottom:`0.5px solid ${T.border}`, flexShrink:0}}>
          <div style={{fontSize:11, color:T.muted, letterSpacing:'0.1em'}}>SETTINGS</div>
          <button onClick={onClose}
            style={{background:'none', border:'none', color:T.dim,
              fontSize:20, cursor:'pointer'}}>✕</button>
        </div>
        <div style={{padding:'14px 16px', borderBottom:`0.5px solid ${T.border}`}}>
          <div style={{fontSize:9, color:T.muted, letterSpacing:'0.05em', marginBottom:10}}>RĀGAM</div>
          <div style={{position:'relative', marginBottom:10}}>
            <div style={{position:'absolute', left:10, top:'50%', transform:'translateY(-50%)',
              fontSize:14, color:T.muted, pointerEvents:'none'}}>🔍</div>
            <input
              readOnly
              onClick={() => setSearchOpen(true)}
              placeholder="Search rāgam..."
              style={{width:'100%', padding:'8px 10px 8px 32px',
                border:`0.5px solid ${T.border}`, borderRadius:6, fontSize:13,
                background:T.surface, color:T.text, boxSizing:'border-box', cursor:'pointer'}}
            />
          </div>
          <RagaPanel raga={raga} baseF={baseF} ctxRef={ctxRef} />
        </div>
        <div style={{padding:'14px 16px', borderBottom:`0.5px solid ${T.border}`}}>
          <div style={{fontSize:9, color:T.muted, letterSpacing:'0.05em', marginBottom:8}}>KATTAI / SHRUTI</div>
          <div style={{display:'flex', flexWrap:'wrap', gap:4}}>
            {KATTAI.map((k, i) => {
              const isSel = i === kattaiIdx
              return (
                <button key={i} onClick={() => setKattaiIdx(i)}
                  style={{
                    fontFamily:'inherit', cursor:'pointer', padding:'4px 8px', borderRadius:5,
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
        </div>
        <div style={{padding:'14px 16px', borderBottom:`0.5px solid ${T.border}`}}>
          <div style={{fontSize:9, color:T.muted, letterSpacing:'0.05em', marginBottom:12}}>AUDIO</div>
          {[
            { label:'Metronome', on:metroOn, toggle:() => {
                const next = !metroOn
                setMetroOn(next)
                if (next && !playing) startMetro()
                else stopMetro()
              }, color:T.blue },
            { label:'Shruti drone', on:droneOn, toggle:toggleDrone, color:T.teal },
            { label:'Swara audio', on:swaraOn, toggle:() => setSwaraOn(v => !v), color:T.amber },
          ].map(({label, on, toggle, color}) => (
            <div key={label} style={{display:'flex', justifyContent:'space-between',
              alignItems:'center', marginBottom:12}}>
              <span style={{fontSize:13, color:T.muted}}>{label}</span>
              <div onClick={toggle} style={{
                width:40, height:22, borderRadius:11, cursor:'pointer',
                background: on ? T.amberBg : T.surface,
                border:`0.5px solid ${on ? T.amberBdr : T.border}`,
                position:'relative', transition:'all 0.2s',
              }}>
                <div style={{
                  width:16, height:16, borderRadius:'50%',
                  background: on ? color : T.dim,
                  position:'absolute', top:3,
                  left: on ? 20 : 3,
                  transition:'all 0.2s',
                }}/>
              </div>
            </div>
          ))}
        </div>
        <div style={{padding:'14px 16px'}}>
          <button onClick={showAbout}
            style={{background:'none', border:`0.5px solid ${T.border}`, borderRadius:6,
              color:T.muted, fontSize:12, padding:'8px 14px', cursor:'pointer',
              width:'100%', fontFamily:'inherit'}}>
            About Panchamam
          </button>
        </div>
      </div>
      <div style={{flex:1, background:'rgba(0,0,0,0.5)'}} onClick={onClose}/>
    </div>
  )
}

// ── Main App ───────────────────────────────────────────────────
export default function App() {
  const [ragaIdx, setRagaIdx]       = useState(14)
  const [talaIdx, setTalaIdx]       = useState(0)
  const [kattaiIdx, setKattaiIdx]   = useState(8)
  const [bpm, setBpm]               = useState(60)
  const [kalam, setKalam]           = useState(1)
  const [playing, setPlaying]       = useState(false)
  const [droneOn, setDroneOn]       = useState(false)
  const [metroOn, setMetroOn]       = useState(false)
  const [swaraOn, setSwaraOn]       = useState(true)
  const [active, setActive]         = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [aboutOpen, setAboutOpen]   = useState(false)
  const [mode, setMode]             = useState('alankaram')
  const [varisaiType, setVarisaiType] = useState('sarali')
  const [varisaiPattern, setVarisaiPattern] = useState(0)

  const isMobile = useIsMobile()

  const ctxRef        = useRef(null)
  const droneRef      = useRef([])
  const timerRef      = useRef(null)
  const posRef        = useRef({row:0, swaraPos:0, talaPos:0})
  const stRef         = useRef({})
  const metroTimerRef = useRef(null)

  const raga   = RAAGAM[ragaIdx]
  const tala   = TAALAM[talaIdx]
  const baseF  = KATTAI[kattaiIdx].f

  const rows        = useMemo(() => buildRows(raga, tala, baseF), [ragaIdx, talaIdx, kattaiIdx])
  const varisaiRows = useMemo(
    () => buildVarisaiRows(raga, baseF, varisaiType, varisaiPattern),
    [ragaIdx, kattaiIdx, varisaiType, varisaiPattern]
  )
  const activeRows  = mode === 'alankaram' ? rows : varisaiRows
  const ascCount    = activeRows.filter(r => r.ascending).length

  useEffect(() => { stRef.current = {bpm, kalam, metroOn, swaraOn, rows: activeRows, playing} })

  function getCtx() {
    if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume()
    return ctxRef.current
  }

  function startMetro() {
    const ctx = getCtx()
    const tick = () => {
      if (!stRef.current.metroOn || stRef.current.playing) return
      playClick(ctx, ctx.currentTime, 'L', true)
      const dur = 60 / stRef.current.bpm
      metroTimerRef.current = setTimeout(tick, dur * 1000)
    }
    tick()
  }

  function stopMetro() { clearTimeout(metroTimerRef.current) }

  function playNote(ctx, f, t, dur) {
    if (!f) return
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.type = 'sine'; o.frequency.value = f
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.8, t + 0.015)
    g.gain.setValueAtTime(0.8, t + dur * 0.6)
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
    else                                { o.frequency.value = 330; g.gain.setValueAtTime(0.12, t) }
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
    for (let k = 0; k < s.kalam; k++) {
      const sp = (swaraPos + k) % s.rows[row].beats.length
      const b = s.rows[row].beats[sp]
      if (s.swaraOn && !b.isHeld) {
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
    const tb = s.rows[row].beats[talaPos]
    if (s.metroOn) playClick(ctx, now, tb.anga, tb.angaStart)
    setActive({row, beatStart: swaraPos, count: s.kalam, talaPos})
    let newSwaraPos = swaraPos + s.kalam
    let nr = row
    let newTalaPos = talaPos + 1
    if (newSwaraPos >= s.rows[row].beats.length) {
      newSwaraPos = newSwaraPos % s.rows[row].beats.length
      nr = (row + 1) % s.rows.length
    }
    if (newTalaPos >= s.rows[row].beats.length) newTalaPos = 0
    posRef.current = {row: nr, swaraPos: newSwaraPos, talaPos: newTalaPos}
    timerRef.current = setTimeout(tick, dur * 1000)
  }

  function start() {
    stopMetro()
    setMetroOn(true)
    const ctx = getCtx()
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
    if (stRef.current.metroOn) startMetro()
  }

  useEffect(() => () => stop(), [])

  useEffect(() => {
    if (droneOn) {
      droneRef.current.forEach(n => { try { if(n.stop) n.stop(); n.disconnect() } catch(e){} })
      droneRef.current = []
      const ctx = ctxRef.current
      if (!ctx) return
      const master = ctx.createGain()
      master.gain.value = 0.07
      master.connect(ctx.destination);
      [
        [baseF, 'sawtooth', 0.6],
        [baseF * 1.003, 'sawtooth', 0.4],
        [hz(baseF, 7), 'sawtooth', 0.5],
        [baseF * 2, 'sawtooth', 0.3],
      ].forEach(([f, type, g]) => {
        const o = ctx.createOscillator(), gn = ctx.createGain()
        const filter = ctx.createBiquadFilter()
        o.type = type; o.frequency.value = f
        filter.type = 'lowpass'; filter.frequency.value = f * 4; filter.Q.value = 0.5
        gn.gain.value = g
        o.connect(filter); filter.connect(gn); gn.connect(master); o.start()
        droneRef.current.push(o); droneRef.current.push(gn)
      })
      droneRef.current.push(master)
    }
  }, [baseF])

  function toggleDrone() {
    if (droneOn) {
      droneRef.current.forEach(n => { try { if(n.stop) n.stop(); n.disconnect() } catch(e){} })
      droneRef.current = []
      setDroneOn(false)
    } else {
      if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      const ctx = ctxRef.current
      ctx.resume().then(() => {
        const master = ctx.createGain()
        master.gain.value = 0.07
        master.connect(ctx.destination);
        [[baseF/2, 0.6], [hz(baseF,7), 0.5], [baseF, 0.7], [baseF*1.003, 0.4], [baseF*2, 0.3]]
          .forEach(([freq, gain]) => {
            const o = ctx.createOscillator(), gn = ctx.createGain()
            const filter = ctx.createBiquadFilter()
            o.type = 'sawtooth'; o.frequency.value = freq
            filter.type = 'lowpass'; filter.frequency.value = freq * 4; filter.Q.value = 0.5
            gn.gain.value = gain
            o.connect(filter); filter.connect(gn); gn.connect(master); o.start()
            droneRef.current.push(o); droneRef.current.push(gn)
          })
        droneRef.current.push(master)
        setDroneOn(true)
      })
    }
  }

  const chip = (rowIdx, bi, isActive, isActiveRow) => ({
    display:'inline-flex', alignItems:'center', justifyContent:'center',
    minWidth:30, padding:'4px 7px', borderRadius:5, fontSize:12,
    border: isActive ? `0.5px solid ${T.amber}` : `0.5px solid ${isActiveRow ? '#3a3a3a' : T.border}`,
    background: isActive ? T.amber : isActiveRow ? '#1e1e1e' : T.surface,
    color: isActive ? '#0a0a0a' : isActiveRow ? T.text : '#aaa',
    fontWeight: isActive ? 700 : isActiveRow ? 500 : 400,
    marginLeft: 2, transition: 'background 0.06s',
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

  const kalamOpts = [{label:'1×', val:1}, {label:'2×', val:2}, {label:'3×', val:4}]

  // ── Sequence rows ──────────────────────────────────────────
  const talaLabel = mode === 'varisai' ? 'Adi (I₄ O₂ O₂)' : `${tala.name} (${tala.struct})`

  const sequenceRows = (
    <>
      <div style={{fontSize:10, color:T.muted, letterSpacing:'0.05em', marginBottom:8}}>
        ↑ ĀROHANA — {talaLabel}
      </div>
      {activeRows.filter(r => r.ascending).map((row, ri) => {
        const isActiveRow = active?.row === ri
        return (
          <div key={ri} style={{
            display:'flex', alignItems:'center', marginBottom:4, flexWrap:'wrap',
            padding:'3px 4px', borderRadius:5,
            background: isActiveRow ? 'rgba(212,168,67,0.05)' : 'transparent',
            transition:'background 0.1s',
          }}>
            {row.baseLabel && (
              <span style={{fontSize:11, fontWeight:500, minWidth:22, marginRight:6,
                color: isActiveRow ? T.amber : T.dim}}>{row.baseLabel}</span>
            )}
            {row.beats.map((b, bi) => {
              const start = active?.beatStart ?? -1
              const count = active?.count ?? 0
              const overflow = Math.max(0, start + count - row.beats.length)
              const isActive = isActiveRow
                ? (bi >= start && bi < start + count)
                : (active?.row === ri - 1 && bi < overflow)
              return (
                <span key={bi} style={chip(ri, bi, isActive,
                  isActiveRow || (active?.row === ri - 1 && bi < overflow))}>
                  {b.label}
                </span>
              )
            })}
          </div>
        )
      })}
      <div style={{fontSize:10, color:T.muted, letterSpacing:'0.05em', margin:'12px 0 8px'}}>
        ↓ AVAROHANA — {talaLabel}
      </div>
      {activeRows.filter(r => !r.ascending).map((row, ri) => {
        const gr = ascCount + ri
        const isActiveRow = active?.row === gr
        return (
          <div key={ri} style={{
            display:'flex', alignItems:'center', marginBottom:4, flexWrap:'wrap',
            padding:'3px 4px', borderRadius:5,
            background: isActiveRow ? 'rgba(212,168,67,0.05)' : 'transparent',
            transition:'background 0.1s',
          }}>
            {row.baseLabel && (
              <span style={{fontSize:11, fontWeight:500, minWidth:22, marginRight:6,
                color: isActiveRow ? T.amber : T.dim}}>{row.baseLabel}</span>
            )}
            {row.beats.map((b, bi) => {
              const start = active?.beatStart ?? -1
              const count = active?.count ?? 0
              const overflow = Math.max(0, start + count - row.beats.length)
              const isActive = isActiveRow
                ? (bi >= start && bi < start + count)
                : (active?.row === gr - 1 && bi < overflow)
              return (
                <span key={bi} style={chip(gr, bi, isActive,
                  isActiveRow || (active?.row === gr - 1 && bi < overflow))}>
                  {b.label}
                </span>
              )
            })}
          </div>
        )
      })}
    </>
  )

  // ── MOBILE ─────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{minHeight:'100vh', background:T.bg, color:T.text,
        fontFamily:'system-ui, sans-serif', fontSize:13}}>

        {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}

        {drawerOpen && (
          <MobileDrawer
            onClose={() => setDrawerOpen(false)}
            raga={raga} ragaIdx={ragaIdx} setRagaIdx={setRagaIdx}
            kattaiIdx={kattaiIdx} setKattaiIdx={setKattaiIdx}
            metroOn={metroOn} setMetroOn={setMetroOn}
            droneOn={droneOn} toggleDrone={toggleDrone}
            swaraOn={swaraOn} setSwaraOn={setSwaraOn}
            baseF={baseF} ctxRef={ctxRef} stop={stop}
            showAbout={() => { setDrawerOpen(false); setAboutOpen(true) }}
            startMetro={startMetro} stopMetro={stopMetro} playing={playing}
          />
        )}

        {/* Header */}
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'14px 16px 12px', borderBottom:`0.5px solid ${T.border}`}}>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <div style={{
              width:32, height:32, borderRadius:'50%', background:T.amberBg,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:17, color:T.amber, fontFamily:'"Noto Serif Tamil", serif',
            }}>ப</div>
            <div>
              <div style={{fontSize:18, color:T.amber, lineHeight:1,
                fontFamily:'"Cormorant Garamond", Georgia, serif',
                fontWeight:400, letterSpacing:'1px'}}>Panchamam</div>
              <div style={{fontSize:10, color:T.muted, marginTop:2, letterSpacing:'0.05em'}}>
                {mode === 'alankaram' ? 'Alankāram' : 'Varisai'}
              </div>
            </div>
          </div>
          <button onClick={() => setDrawerOpen(true)}
            style={{background:'none', border:`0.5px solid ${T.border}`, borderRadius:6,
              color:T.muted, fontSize:12, padding:'5px 10px', cursor:'pointer',
              display:'flex', alignItems:'center', gap:6, flexShrink:0}}>
            ☰
            <span style={{color:T.amber, fontWeight:500, maxWidth:100,
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
              {raga.name}
            </span>
          </button>
        </div>

        {/* Mode selector */}
        <ModeSelector mode={mode} setMode={setMode} onStop={stop} />

        {/* Varisai type or Talam */}
        {mode === 'varisai' ? (
          <>
            <VarisaiSelector
              varisaiType={varisaiType} setVarisaiType={setVarisaiType}
              varisaiPattern={varisaiPattern} setVarisaiPattern={setVarisaiPattern}
              onStop={stop} raga={raga}
            />
            <AdiTalamDisplay activeBeat={active?.talaPos ?? null} />
          </>
        ) : (
          <div style={{padding:'10px 16px', borderBottom:`0.5px solid ${T.border}`}}>
            <div style={{fontSize:9, color:T.muted, letterSpacing:'0.05em', marginBottom:7}}>TĀLAM</div>
            <TalamCards talaIdx={talaIdx} setTalaIdx={setTalaIdx}
              activeBeat={active?.talaPos ?? null} onStop={stop} mobile={true} />
          </div>
        )}

        {/* Main scrollable content */}
        <div style={{padding:'14px 16px', paddingBottom:80, overflowY:'auto'}}>
          <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:16,
            background:T.surface, borderRadius:8, padding:'10px 12px',
            border:`0.5px solid ${T.border}`}}>
            <Pendulum playing={playing} bpm={bpm} />
            <input type="range" min="30" max="180" step="1" value={bpm}
              onChange={e => setBpm(+e.target.value)}
              style={{flex:1, accentColor:T.amber}} />
          </div>

          {sequenceRows}

          <div style={{marginTop:20, fontSize:10, color:T.dim}}>
            Phase 1 · {mode === 'alankaram' ? 'Alankāram' : 'Varisai'} Practice ·{' '}
            <span style={{cursor:'pointer', color:T.muted, textDecoration:'underline'}}
              onClick={() => setAboutOpen(true)}>About</span>
          </div>
        </div>

        {/* Sticky bottom bar */}
        <div style={{position:'fixed', bottom:0, left:0, right:0,
          background:T.sidebar, borderTop:`0.5px solid ${T.border}`,
          padding:'10px 14px', display:'flex', alignItems:'center', gap:8}}>
          <button onClick={playing ? stop : start}
            style={{
              flex:1, fontFamily:'inherit', fontSize:15, fontWeight:700,
              padding:'12px', borderRadius:8, cursor:'pointer',
              border:`0.5px solid ${playing ? T.redBdr : T.amberBdr}`,
              background: playing ? T.redBg : T.amberBg,
              color: playing ? T.red : T.amber,
            }}>
            {playing ? '■  Stop' : '▶  Play'}
          </button>
          <div style={{display:'flex', gap:4}}>
            {kalamOpts.map(k => (
              <button key={k.val} onClick={() => setKalam(k.val)}
                style={{
                  fontFamily:'inherit', padding:'10px 12px', borderRadius:6,
                  fontSize:13, fontWeight:700, cursor:'pointer',
                  border:`0.5px solid ${kalam===k.val ? T.amberBdr : T.border}`,
                  background: kalam===k.val ? T.amberBg : T.surface,
                  color: kalam===k.val ? T.amber : T.muted,
                }}>
                {k.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── DESKTOP ────────────────────────────────────────────────
  return (
    <div style={{display:'grid', gridTemplateColumns:'240px 1fr', minHeight:'100vh',
      fontFamily:'system-ui, sans-serif', fontSize:13, background:T.bg, color:T.text}}>

      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}

      {/* Sidebar */}
      <div style={{borderRight:`0.5px solid ${T.border}`, padding:'20px 16px',
        background:T.sidebar, overflowY:'auto', display:'flex', flexDirection:'column', gap:20}}>
        <div>
          <div style={{fontSize:10, color:T.muted, letterSpacing:'0.05em', marginBottom:5}}>RĀGAM</div>
          <RAAGAMearch
            value={ragaIdx}
            onChange={idx => { stop(); setRagaIdx(idx) }}
            filter={mode === 'varisai' ? (r => r.s.length === 7) : null}
          />
        </div>
        <div style={{borderTop:`0.5px solid ${T.border}`, paddingTop:16}}>
          <RagaPanel raga={raga} baseF={baseF} ctxRef={ctxRef} />
        </div>
      </div>

      {/* Main + Kattai */}
      <div style={{display:'flex', overflowY:'auto'}}>
        <div style={{padding:'24px 28px', flex:1, maxWidth:760, overflowY:'auto'}}>

          {/* Header */}
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between',
            paddingBottom:20, marginBottom:8, borderBottom:`0.5px solid ${T.border}`}}>
            <div style={{display:'flex', alignItems:'center', gap:12}}>
              <div style={{
                width:38, height:38, borderRadius:'50%', background:T.amberBg,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:20, color:T.amber, fontFamily:'"Noto Serif Tamil", serif',
              }}>ப</div>
              <div>
                <div style={{fontSize:22, color:T.amber, lineHeight:1,
                  fontFamily:'"Cormorant Garamond", Georgia, serif',
                  fontWeight:400, letterSpacing:'1px'}}>Panchamam</div>
                <div style={{fontSize:11, color:T.muted, marginTop:3, letterSpacing:'0.05em'}}>
                  {mode === 'alankaram' ? 'Alankāram' : 'Varisai'}
                </div>
              </div>
            </div>
            <button onClick={() => setAboutOpen(true)}
              style={{background:'none', border:`0.5px solid ${T.border}`, borderRadius:6,
                color:T.muted, fontSize:12, padding:'6px 14px', cursor:'pointer',
                fontFamily:'inherit'}}>
              About
            </button>
          </div>

          {/* Mode selector */}
          <div style={{marginBottom:16}}>
            <ModeSelector mode={mode} setMode={m => { stop(); setMode(m) }} onStop={stop} />
          </div>

          {/* Varisai type or Talam */}
          {mode === 'varisai' ? (
            <div style={{marginBottom:16}}>
              <VarisaiSelector
                varisaiType={varisaiType} setVarisaiType={setVarisaiType}
                varisaiPattern={varisaiPattern} setVarisaiPattern={setVarisaiPattern}
                onStop={stop} raga={raga}
              />
              <div style={{marginTop:12}}>
                <div style={{fontSize:10, color:T.muted, letterSpacing:'0.05em', marginBottom:8}}>TĀLAM</div>
                <AdiTalamDisplay activeBeat={active?.talaPos ?? null} />
              </div>
            </div>
          ) : (
            <TalamCards talaIdx={talaIdx} setTalaIdx={setTalaIdx}
              activeBeat={active?.talaPos ?? null} onStop={stop} mobile={false} />
          )}

          {/* Tempo + Kālam */}
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
                  <button key={k.val} onClick={() => setKalam(k.val)}
                    style={{...btn(kalam===k.val,'amber'), padding:'4px 10px', fontWeight:700}}>
                    {k.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Transport */}
          <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap',
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
            <button onClick={() => {
              const next = !metroOn
              setMetroOn(next)
              if (next && !playing) startMetro()
              else stopMetro()
            }} style={btn(metroOn,'blue')}>
              {metroOn ? '◉' : '○'} Metronome
            </button>
            <button onClick={() => setSwaraOn(v => !v)} style={btn(swaraOn,'amber')}>
              {swaraOn ? '◉' : '○'} Swara audio
            </button>
          </div>

          {sequenceRows}

          <div style={{marginTop:20, fontSize:10, color:T.dim}}>
            Phase 1 · {mode === 'alankaram' ? 'Alankāram' : 'Varisai'} Practice Guide
          </div>
        </div>

        <KattaiPanel kattaiIdx={kattaiIdx} setKattaiIdx={setKattaiIdx} />
      </div>
    </div>
  )
}