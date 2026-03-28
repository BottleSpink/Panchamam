export const TAALAM = [
  {
    name:"Eka", struct:"I₄", beats:4,
    angas:[{type:'L', count:4}],
    pat:[{o:0,a:'L',s:1},{o:1,a:'L',s:0},{o:2,a:'L',s:0},{o:3,a:'L',s:0}]
  },
  {
    name:"Rupaka", struct:"O I₄", beats:6,
    angas:[{type:'D', count:1},{type:'L', count:4}],
    pat:[
      {o:0,a:'D',s:1},{o:1,a:'D',s:0},
      {o:0,a:'L',s:1},{o:1,a:'L',s:0},{o:2,a:'L',s:0},{o:3,a:'L',s:0}
    ]
  },
  {
    name:"Triputa", struct:"I₃ O O", beats:7,
    angas:[{type:'L', count:3},{type:'D', count:1},{type:'D', count:1}],
    pat:[
      {o:0,a:'L',s:1},{o:1,a:'L',s:0},{o:2,a:'L',s:0},
      {o:0,a:'D',s:1},{o:1,a:'D',s:0},
      {o:2,a:'D',s:1},{o:3,a:'D',s:0}
    ]
  },
  {
    name:"Matya", struct:"I₄ O I₄", beats:10,
    angas:[{type:'L', count:4},{type:'D', count:1},{type:'L', count:4}],
    pat:[
      {o:0,a:'L',s:1},{o:1,a:'L',s:0},{o:2,a:'L',s:0},{o:1,a:'L',s:0},
      {o:0,a:'D',s:1},{o:1,a:'D',s:0},
      {o:0,a:'L',s:1},{o:1,a:'L',s:0},{o:2,a:'L',s:0},{o:3,a:'L',s:0}
    ]
  },
  {
    name:"Jhumpa", struct:"I₇ U O", beats:10,
    angas:[{type:'L', count:7},{type:'U', count:1},{type:'D', count:1}],
    pat:[
      {o:0,a:'L',s:1},{o:1,a:'L',s:0},{o:2,a:'L',s:0},
      {o:0,a:'L',s:0},{o:1,a:'L',s:0},{o:0,a:'L',s:0},{o:1,a:'L',s:0},
      {o:2,a:'U',s:1},
      {o:3,a:'D',s:1},{o:null,a:'D',s:0}
    ]
  },
  {
    name:"Dhruva", struct:"I₄ O I₄ I₄", beats:14,
    angas:[{type:'L', count:4},{type:'D', count:1},{type:'L', count:4},{type:'L', count:4}],
    pat:[
      {o:0,a:'L',s:1},{o:1,a:'L',s:0},{o:2,a:'L',s:0},{o:3,a:'L',s:0},
      {o:2,a:'D',s:1},{o:1,a:'D',s:0},
      {o:0,a:'L',s:1},{o:1,a:'L',s:0},{o:2,a:'L',s:0},{o:1,a:'L',s:0},
      {o:0,a:'L',s:1},{o:1,a:'L',s:0},{o:2,a:'L',s:0},{o:3,a:'L',s:0}
    ]
  },
  {
    name:"Ata", struct:"I₅ I₅ O O", beats:14,
    angas:[{type:'L', count:5},{type:'L', count:5},{type:'D', count:1},{type:'D', count:1}],
    pat:[
      {o:0,a:'L',s:1},{o:1,a:'L',s:0},{o:null,a:'L',s:0},{o:2,a:'L',s:0},{o:null,a:'L',s:0},
      {o:0,a:'L',s:1},{o:null,a:'L',s:0},{o:1,a:'L',s:0},{o:2,a:'L',s:0},{o:null,a:'L',s:0},
      {o:3,a:'D',s:1},{o:null,a:'D',s:0},
      {o:3,a:'D',s:1},{o:null,a:'D',s:0}
    ]
  },
]