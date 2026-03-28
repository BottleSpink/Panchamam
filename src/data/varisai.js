// varisai.js
// Scale degree indices: 0=Sa 1=Ri 2=Ga 3=Ma 4=Pa 5=Dha 6=Ni 7=Ṡ
// null = hold previous note (karvai)
// Raga must have 7 swaras (sampurna) for varisai to work

// Adi talam beat template (I₄ O₂ O₂ = 8 beats)
export const ADI_BEATS = [
  {anga:'L', angaStart:true},
  {anga:'L', angaStart:false},
  {anga:'L', angaStart:false},
  {anga:'L', angaStart:false},
  {anga:'D', angaStart:true},
  {anga:'D', angaStart:false},
  {anga:'D', angaStart:true},
  {anga:'D', angaStart:false},
]

// Sarali Varisai — 14 patterns
// Source: Chitraveena Ravi Kiran / shivkumar.org / carnatic-circle.com
// Each row has 8 beats (Adi talam)
export const SARALI = [
  {
    label: '1',
    desc: 'Simple ascent / descent',
    rows: [
      { degrees: [0,1,2,3,4,5,6,7], ascending: true  },
      { degrees: [7,6,5,4,3,2,1,0], ascending: false },
    ]
  },
  {
    label: '2',
    desc: 'Focus on R and N',
    rows: [
      { degrees: [0,1,0,1,0,1,2,3], ascending: true  },
      { degrees: [0,1,2,3,4,5,6,7], ascending: true  },
      { degrees: [7,6,7,6,7,6,5,4], ascending: false },
      { degrees: [7,6,5,4,3,2,1,0], ascending: false },
    ]
  },
  {
    label: '3',
    desc: 'Focus on G and D',
    rows: [
      { degrees: [0,1,2,0,1,2,0,1], ascending: true  },
      { degrees: [0,1,2,3,4,5,6,7], ascending: true  },
      { degrees: [7,6,5,7,6,5,7,6], ascending: false },
      { degrees: [7,6,5,4,3,2,1,0], ascending: false },
    ]
  },
  {
    label: '4',
    desc: 'Focus on M and P',
    rows: [
      { degrees: [0,1,2,3,0,1,2,3], ascending: true  },
      { degrees: [0,1,2,3,4,5,6,7], ascending: true  },
      { degrees: [7,6,5,4,7,6,5,4], ascending: false },
      { degrees: [7,6,5,4,3,2,1,0], ascending: false },
    ]
  },
  {
    label: '5',
    desc: 'Dheergam at P and M, Focus on R and N',
    rows: [
      { degrees: [0,1,2,3,4,null,0,1], ascending: true  },
      { degrees: [0,1,2,3,4,5,6,7],   ascending: true  },
      { degrees: [7,6,5,4,3,null,7,6], ascending: false },
      { degrees: [7,6,5,4,3,2,1,0],   ascending: false },
    ]
  },
  {
    label: '6',
    desc: 'Focus on G and D (second pattern)',
    rows: [
      { degrees: [0,1,2,3,4,5,0,1], ascending: true  },
      { degrees: [0,1,2,3,4,5,6,7], ascending: true  },
      { degrees: [7,6,5,4,3,2,7,6], ascending: false },
      { degrees: [7,6,5,4,3,2,1,0], ascending: false },
    ]
  },
  {
    label: '7',
    desc: 'Dheergam at N and R',
    rows: [
      { degrees: [0,1,2,3,4,5,6,null], ascending: true  },
      { degrees: [0,1,2,3,4,5,6,7],    ascending: true  },
      { degrees: [7,6,5,4,3,2,1,null], ascending: false },
      { degrees: [7,6,5,4,3,2,1,0],    ascending: false },
    ]
  },
  {
    label: '8',
    desc: 'Zigzag — pmgr / mpdn',
    rows: [
      { degrees: [0,1,2,3,4,3,2,1], ascending: true  },
      { degrees: [0,1,2,3,4,5,6,7], ascending: true  },
      { degrees: [7,6,5,4,3,4,5,6], ascending: false },
      { degrees: [7,6,5,4,3,2,1,0], ascending: false },
    ]
  },
  {
    label: '9',
    desc: 'Zigzag — pmdp / mpgm',
    rows: [
      { degrees: [0,1,2,3,4,3,5,4], ascending: true  },
      { degrees: [0,1,2,3,4,5,6,7], ascending: true  },
      { degrees: [7,6,5,4,3,4,2,3], ascending: false },
      { degrees: [7,6,5,4,3,2,1,0], ascending: false },
    ]
  },
  {
    label: '10',
    desc: 'Dheergam at P · nyaasa on G',
    rows: [
      { degrees: [0,1,2,3,4,null,2,3],         ascending: true  },
      { degrees: [4,null,null,null,4,null,null,null], ascending: true  },
      { degrees: [2,3,4,5,6,5,4,3],             ascending: false },
      { degrees: [2,3,4,2,3,2,1,0],             ascending: false },
    ]
  },
  {
    label: '11',
    desc: 'Dheergam at S N D P',
    rows: [
      { degrees: [7,null,6,5,6,null,5,4], ascending: true  },
      { degrees: [5,null,4,3,4,null,4,null], ascending: true },
      { degrees: [2,3,4,5,6,5,4,3],        ascending: false },
      { degrees: [2,3,4,2,3,2,1,0],        ascending: false },
    ]
  },
  {
    label: '12',
    desc: 'Janta preview — SS nn dd pp',
    rows: [
      { degrees: [7,7,6,5,6,6,5,4],        ascending: true  },
      { degrees: [5,5,4,3,4,null,4,null],   ascending: true  },
      { degrees: [2,3,4,5,6,5,4,3],        ascending: false },
      { degrees: [2,3,4,2,3,2,1,0],        ascending: false },
    ]
  },
  {
    label: '13',
    desc: 'Zigzag — srgr G · gmpm P',
    rows: [
      { degrees: [0,1,2,1,2,null,2,3],   ascending: true  },
      { degrees: [4,3,4,null,5,4,5,null], ascending: true  },
      { degrees: [3,4,5,4,5,6,5,4],      ascending: false },
      { degrees: [6,5,4,3,2,3,1,0],      ascending: false },
    ]
  },
  {
    label: '14',
    desc: 'Dheergam at P and S · Janta at D and M',
    rows: [
      { degrees: [0,1,2,3,4,null,6,7],   ascending: true  },
      { degrees: [0,1,2,3,4,5,6,7],      ascending: true  },
      { degrees: [7,6,5,5,4,null,3,3],   ascending: false },
      { degrees: [7,6,5,4,3,2,1,0],      ascending: false },
    ]
  },
]

// Datu Varisai — 2 patterns (zigzag sequences)
// Source: Chitraveena Ravi Kiran / shivkumar.org
// Each pattern has 20 rows (10 ascending + 10 descending)
export const DATU = [
  {
    label: '1',
    desc: 'smgm — rgsr pattern',
    rows: [
      // Ascending
      { degrees: [0,3,2,3,1,2,0,1], ascending: true  },
      { degrees: [0,2,1,2,0,1,2,3], ascending: true  },
      { degrees: [1,4,3,4,2,3,1,2], ascending: true  },
      { degrees: [1,3,2,3,1,2,3,4], ascending: true  },
      { degrees: [2,5,4,5,3,4,2,3], ascending: true  },
      { degrees: [2,4,3,4,2,3,4,5], ascending: true  },
      { degrees: [3,6,5,6,4,5,3,4], ascending: true  },
      { degrees: [3,5,4,5,3,4,5,6], ascending: true  },
      { degrees: [4,7,6,7,5,6,4,5], ascending: true  },
      { degrees: [4,6,5,6,4,5,6,7], ascending: true  },
      // Descending
      { degrees: [7,4,5,4,6,5,7,6], ascending: false },
      { degrees: [7,5,6,5,7,6,5,4], ascending: false },
      { degrees: [6,3,4,3,5,4,6,5], ascending: false },
      { degrees: [6,4,5,4,6,5,4,3], ascending: false },
      { degrees: [5,2,3,2,4,3,5,4], ascending: false },
      { degrees: [5,3,4,3,5,4,3,2], ascending: false },
      { degrees: [4,1,2,1,3,2,4,3], ascending: false },
      { degrees: [4,2,3,2,4,3,2,1], ascending: false },
      { degrees: [3,0,1,0,2,1,3,2], ascending: false },
      { degrees: [3,1,2,1,3,2,1,0], ascending: false },
    ]
  },
  {
    label: '2',
    desc: 'srsg — rgrm pattern',
    rows: [
      // Ascending
      { degrees: [0,1,0,2,1,2,1,3], ascending: true  },
      { degrees: [0,3,2,1,0,1,2,3], ascending: true  },
      { degrees: [1,2,1,3,2,3,2,4], ascending: true  },
      { degrees: [1,4,3,2,1,2,3,4], ascending: true  },
      { degrees: [2,3,2,4,3,4,3,5], ascending: true  },
      { degrees: [2,5,4,3,2,3,4,5], ascending: true  },
      { degrees: [3,4,3,5,4,5,4,6], ascending: true  },
      { degrees: [3,6,5,4,3,4,5,6], ascending: true  },
      { degrees: [4,5,4,6,5,6,5,7], ascending: true  },
      { degrees: [4,7,6,5,4,5,6,7], ascending: true  },
      // Descending
      { degrees: [7,6,7,5,6,5,6,4], ascending: false },
      { degrees: [7,4,5,6,7,6,5,4], ascending: false },
      { degrees: [6,5,6,4,5,4,5,3], ascending: false },
      { degrees: [6,3,4,5,6,5,4,3], ascending: false },
      { degrees: [5,4,5,3,4,3,4,2], ascending: false },
      { degrees: [5,2,3,4,5,4,3,2], ascending: false },
      { degrees: [4,3,4,2,3,2,3,1], ascending: false },
      { degrees: [4,1,2,3,4,3,2,1], ascending: false },
      { degrees: [3,2,3,1,2,1,2,0], ascending: false },
      { degrees: [3,0,1,2,3,2,1,0], ascending: false },
    ]
  },
]