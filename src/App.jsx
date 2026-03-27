import { useState, useEffect, useRef, useMemo } from 'react'

const KATTAI = [
  {l:"½",f:130.81},{l:"1",f:138.59},{l:"1½",f:146.83},{l:"2",f:155.56},
  {l:"2½",f:164.81},{l:"3",f:174.61},{l:"3½",f:185.00},{l:"4",f:196.00},
  {l:"4½",f:207.65},{l:"5",f:220.00},{l:"5½",f:233.08},{l:"6",f:246.94}
]

const RAGAS = [
  {name:"Mayamalavagowla", s:[{l:"S",v:0},{l:"R₁",v:1},{l:"G₃",v:4},{l:"M₁",v:5},{l:"P",v:7},{l:"D₁",v:8},{l:"N₃",v:11}]},
  {name:"Shankarabharanam", s:[{l:"S",v:0},{l:"R₂",v:2},{l:"G₃",v:4},{l:"M₁",v:5},{l:"P",v:7},{l:"D₂",v:9},{l:"N₃",v:11}]},
  {name:"Kalyani", s:[{l:"S",v:0},{l:"R₂",v:2},{l:"G₃",v:4},{l:"M₂",v:6},{l:"P",v:7},{l:"D₂",v:9},{l:"N₃",v:11}]},
  {name:"Kharaharapriya", s:[{l:"S",v:0},{l:"R₂",v:2},{l:"G₂",v:3},{l:"M₁",v:5},{l:"P",v:7},{l:"D₂",v:9},{l:"N₂",v:10}]},
  {name:"Harikambhoji", s:[{l:"S",v:0},{l:"R₂",v:2},{l:"G₃",v:4},{l:"M₁",v:5},{l:"P",v:7},{l:"D₂",v:9},{l:"N₂",v:10}]},
  {name:"Mohanam", s:[{l:"S",v:0},{l:"R₂",v:2},{l:"G₃",v:4},{l:"P",v:7},{l:"D₂",v:9}]},
  {name:"Hamsadhwani", s:[{l:"S",v:0},{l:"R₂",v:2},{l:"G₃",v:4},{l:"P",v:7},{l:"N₃",v:11}]},
  {name:"Hindolam", s:[{l:"S",v:0},{l:"G₂",v:3},{l:"M₁",v:5},{l:"D₁",v:8},{l:"N₂",v:10}]},
  {name:"Abhogi", s:[{l:"S",v:0},{l:"R₂",v:2},{l:"G₂",v:3},{l:"M₁",v:5},{l:"D₂",v:9}]},
]

// o = swara offset from row base (null=rest), a = anga type, s = is anga start
// Patterns derived from Purandara Dasa sapta tala alankaram reference
const TALAS = [
  {
    name:"Eka", struct:"I₄", beats:4,
    pat:[{o:0,a:'L',s:1},{o:1,a:'L',s:0},{o:2,a:'L',s:0},{o:3,a:'L',s:0}]
  },
  {
    name:"Rupaka", struct:"O I₄", beats:6,
    pat:[
      {o:0,a:'D',s:1},{o:1,a:'D',s:0},
      {o:0,a:'L',s:1},{o:1,a:'L',s:0},{o:2,a:'L',s:0},{o:3,a:'L',s:0}
    ]
  },
  {
    name:"Triputa", struct:"I₃ O O", beats:7,
    pat:[
      {o:0,a:'L',s:1},{o:1,a:'L',s:0},{o:2,a:'L',s:0},
      {o:0,a:'D',s:1},{o:1,a:'D',s:0},
      {o:2,a:'D',s:1},{o:3,a:'D',s:0}
    ]
  },
  {
    name:"Matya", struct:"I₄ O I₄", beats:10,
    pat:[
      {o:0,a:'L',s:1},{o:1,a:'L',s:0},{o:2,a:'L',s:0},{o:1,a:'L',s:0},
      {o:0,a:'D',s:1},{o:1,a:'D',s:0},
      {o:0,a:'L',s:1},{o:1,a:'L',s:0},{o:2,a:'L',s:0},{o:3,a:'L',s:0}
    ]
  },
  {
    name:"Jhumpa", struct:"I₇ U O", beats:10,
    pat:[
      {o:0,a:'L',s:1},{o:1,a:'L',s:0},{o:2,a:'L',s:0},
      {o:0,a:'L',s:0},{o:1,a:'L',s:0},{o:0,a:'L',s:0},{o:1,a:'L',s:0},
      {o:2,a:'U',s:1},
      {o:3,a:'D',s:1},{o:null,a:'D',s:0}
    ]
  },
  {
    name:"Dhruva", struct:"I₄ O I₄ I₄", beats:14,
    pat:[
      {o:0,a:'L',s:1},{o:1,a:'L',s:0},{o:2,a:'L',s:0},{o:3,a:'L',s:0},
      {o:2,a:'D',s:1},{o:1,a:'D',s:0},
      {o:0,a:'L',s:1},{o:1,a:'L',s:0},{o:2,a:'L',s:0},{o:1,a:'L',s:0},
      {o:0,a:'L',s:1},{o:1,a:'L',s:0},{o:2,a:'L',s:0},{o:3,a:'L',s:0}
    ]
  },
  {
    name:"Ata", struct:"I₅ I₅ O O", beats:14,
    pat:[
      {o:0,a:'L',s:1},{o:1,a:'L',s:0},{o:null,a:'L',s:0},{o:2,a:'L',s:0},{o:null,a:'L',s:0},
      {o:0,a:'L',s:1},{o:null,a:'L',s:0},{o:1,a:'L',s:0},{o:2,a:'L',s:0},{o:null,a:'L',s:0},
      {o:3,a:'D',s:1},{o:null,a:'D',s:0},
      {o:3,a:'D',s:1},{o:null,a:'D',s:0}
    ]
  },
]

function hz(base, semi) { return base * Math.pow(2, semi / 12) }

function buildRows(raga, tala, baseF) {
  const upper = {l:'Ṡ', v:12}
  const asc = [...raga.s, upper]
  const desc = [...asc].reverse()
  const rows = []

  const makeRow = (swaras, base, ascending) => ({
    beats: tala.pat.map(p => {
      const sw = p.o !== null ? swaras[base + p.o] : null
      return {
        freq: sw ? hz(baseF, sw.v) : null,
        label: sw ? sw.l : '·',
        anga: p.a,
        angaStart: !!p.s,
        isRest: p.o === null,
      }
    }),
    ascending,
    baseLabel: swaras[base].l
  })

  const n = asc.length
  for (let r = 0; r <= n - 4; r++) rows.push(makeRow(asc, r, true))
  for (let r = 0; r <= n - 4; r++) rows.push(makeRow(desc, r, false))
  return rows
}

export default function App() {
  const [ragaIdx, setRagaIdx]   = useState(0)
  const [talaIdx, setTalaIdx]   = useState(0)
  const [kattaiIdx, setKattaiIdx] = useState(4)
  const [bpm, setBpm]           = useState(60)
  const [playing, setPlaying]   = useState(false)
  const [droneOn, setDroneOn]   = useState(false)
  const [metroOn, setMetroOn]   = useState(true)
  const [swaraOn, setSwaraOn]   = useState(true)
  const [active, setActive]     = useState(null) // {row, beat}

  const ctxRef   = useRef(null)
  const droneRef = useRef([])
  const timerRef = useRef(null)
  const posRef   = useRef({row:0, beat:0})
  const stRef    = useRef({})

  const raga  = RAGAS[ragaIdx]
  const tala  = TALAS[talaIdx]
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
    setPlaying(false)
    clearTimeout(timerRef.current)
    setActive(null)
    posRef.current = {row:0, beat:0}
  }

  useEffect(() => () => stop(), [])

  function toggleDrone() {
    getCtx()
    if (droneOn) {
      droneRef.current.forEach(n => { try { if(n.stop) n.stop(); n.disconnect() } catch(e){} })
      droneRef.current = []
      setDroneOn(false)
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
      droneRef.current.push(master)
      setDroneOn(true)
    }
  }

  // Chip style — anga separators shown as left margin
  const chip = (isActive, angaStart, beatIdx) => ({
    display:'inline-flex', alignItems:'center', justifyContent:'center',
    minWidth:30, padding:'3px 6px', borderRadius:5, fontSize:13,
    border: isActive ? '0.5px solid #ba7517' : '0.5px solid #e8e8e8',
    background: isActive ? '#854F0B' : '#fff',
    color: isActive ? '#fff' : '#1a1a1a',
    fontWeight: isActive ? 500 : 400,
    marginLeft: (angaStart && beatIdx !== 0) ? 10 : 2,
    borderLeft: (angaStart && beatIdx !== 0) ? '2px solid #d0d0d0' : undefined,
    paddingLeft: (angaStart && beatIdx !== 0) ? 8 : 6,
    transition: 'background 0.06s',
  })

  const btn = (active, color) => {
    const c = {teal:['#e1f5ee','#085041','#0f6e56'],blue:['#e6f1fb','#0c447c','#185fa5'],amber:['#faeeda','#633806','#ba7517'],red:['#fcebeb','#a32d2d','#e24b4a']}[color]
    return {fontFamily:'inherit',fontSize:13,padding:'7px 14px',borderRadius:6,cursor:'pointer',
      border: active ? `0.5px solid ${c[2]}` : '0.5px solid #e2e2e2',
      background: active ? c[0] : '#f7f7f5',
      color: active ? c[1] : '#555'}
  }

  const sel = {width:'100%',padding:'6px 8px',border:'0.5px solid #e2e2e2',borderRadius:6,fontSize:13,background:'#fff',color:'#1a1a1a'}
  const lbl = {fontSize:11,color:'#999',letterSpacing:'0.05em',marginBottom:5}

  return (
    <div style={{padding:'1.25rem 1rem',maxWidth:920,margin:'0 auto',fontFamily:'system-ui,sans-serif'}}>

      <div style={{display:'flex',alignItems:'baseline',gap:12,marginBottom:'1.25rem',paddingBottom:'1rem',borderBottom:'0.5px solid #e2e2e2'}}>
        <h1 style={{fontSize:20,fontWeight:500,color:'#1a1a1a',margin:0}}>Panchamam</h1>
        <span style={{fontSize:12,color:'#bbb'}}>Sapta Tāla Alankāram · Phase 1</span>
      </div>

      {/* Selectors */}
      <div style={{display:'grid',gridTemplateColumns:'2fr 2fr 1fr',gap:10,marginBottom:12}}>
        <div>
          <div style={lbl}>RĀGAM</div>
          <select style={sel} value={ragaIdx} onChange={e=>{stop();setRagaIdx(+e.target.value)}}>
            {RAGAS.map((r,i)=><option key={i} value={i}>{r.name}</option>)}
          </select>
        </div>
        <div>
          <div style={lbl}>TĀLAM</div>
          <select style={sel} value={talaIdx} onChange={e=>{stop();setTalaIdx(+e.target.value)}}>
            {TALAS.map((t,i)=><option key={i} value={i}>{t.name} — {t.struct} ({t.beats} beats)</option>)}
          </select>
        </div>
        <div>
          <div style={lbl}>KATTAI (SHRUTI)</div>
          <select style={sel} value={kattaiIdx} onChange={e=>setKattaiIdx(+e.target.value)}>
            {KATTAI.map((k,i)=><option key={i} value={i}>Kattai {k.l}</option>)}
          </select>
        </div>
      </div>

      {/* Tempo */}
      <div style={{background:'#f7f7f5',borderRadius:8,padding:'10px 14px',marginBottom:12,display:'flex',alignItems:'center',gap:16}}>
        <div style={lbl}>TEMPO</div>
        <input type="range" min="30" max="180" step="1" value={bpm}
          onChange={e=>setBpm(+e.target.value)}
          style={{flex:1,accentColor:'#854F0B'}}/>
        <span style={{fontSize:13,fontWeight:500,minWidth:60,color:'#1a1a1a'}}>{bpm} BPM</span>
      </div>

      {/* Transport */}
      <div style={{display:'flex',gap:8,flexWrap:'wrap',paddingBottom:14,marginBottom:14,borderBottom:'0.5px solid #e2e2e2'}}>
        <button onClick={playing ? stop : start} style={{...btn(playing,'red'),padding:'8px 24px',fontSize:14,fontWeight:500}}>
          {playing ? '■ Stop' : '▶ Play'}
        </button>
        <button onClick={toggleDrone} style={btn(droneOn,'teal')}>{droneOn?'◉':'○'} Shruti drone</button>
        <button onClick={()=>setMetroOn(v=>!v)} style={btn(metroOn,'blue')}>{metroOn?'◉':'○'} Metronome</button>
        <button onClick={()=>setSwaraOn(v=>!v)} style={btn(swaraOn,'amber')}>{swaraOn?'◉':'○'} Swara audio</button>
      </div>

      {/* Sequence */}
      <div>
        <div style={{fontSize:11,color:'#999',letterSpacing:'0.05em',marginBottom:8}}>
          ↑ ĀROHANA — {tala.name} ({tala.struct})
        </div>
        {rows.filter(r=>r.ascending).map((row,ri)=>(
          <div key={ri} style={{display:'flex',alignItems:'center',marginBottom:5,flexWrap:'wrap'}}>
            <span style={{fontSize:11,color:'#bbb',minWidth:22,marginRight:6,fontWeight:500}}>{row.baseLabel}</span>
            {row.beats.map((b,bi)=>(
              <span key={bi} style={chip(active?.row===ri && active?.beat===bi, b.angaStart, bi)}>
                {b.label}
              </span>
            ))}
          </div>
        ))}

        <div style={{fontSize:11,color:'#999',letterSpacing:'0.05em',margin:'12px 0 8px'}}>
          ↓ AVAROHANA — {tala.name} ({tala.struct})
        </div>
        {rows.filter(r=>!r.ascending).map((row,ri)=>{
          const globalR = ascCount + ri
          return (
            <div key={ri} style={{display:'flex',alignItems:'center',marginBottom:5,flexWrap:'wrap'}}>
              <span style={{fontSize:11,color:'#bbb',minWidth:22,marginRight:6,fontWeight:500}}>{row.baseLabel}</span>
              {row.beats.map((b,bi)=>(
                <span key={bi} style={chip(active?.row===globalR && active?.beat===bi, b.angaStart, bi)}>
                  {b.label}
                </span>
              ))}
            </div>
          )
        })}
      </div>

      <div style={{marginTop:14,fontSize:11,color:'#ccc'}}>
        Phase 1 complete · Phase 2: mic + pitch detection · Phase 3: gamaka ear training
      </div>

    </div>
  )
}