'use strict';
const Rules = (() => {
  const names = ['Янтарь','Изумруд','Сапфир','Алмаз','Рубин','Гранит','Кварц','Топаз','Жемчуг','Нефрит','Опал','Агат','Оникс','Кедр','Лотос','Клевер','Рассвет','Родник','Ветер','Прибой'];
  const sets = ['Для всей семьи','Посложнее','Словосочетания'];
  function shuffle(items) {
    for (let i=items.length-1;i>0;i--) {
      const j=Math.floor(Math.random()*(i+1));
      [items[i],items[j]]=[items[j],items[i]];
    }
    return items;
  }
  function fresh(){
    return {version:1,dictionary:2,teams:shuffle([...names]).slice(0,2),seconds:30,goal:30,deduct:false,set:0,
      scores:[],turn:0,round:1,phase:'order',history:[],remaining:0,order:[],cursor:0};
  }
  function start(s){
    s.scores=s.teams.map(()=>0);
    s.order=shuffle(WORDS[s.set].map((_,i)=>i));
  }
  function word(s,index){return (s.dictionary!==2 && PREVIOUS_WORDS[s.set][index]) || WORDS[s.set][index];}
  function current(s){return word(s,s.order[s.cursor]);}
  function advance(s){
    const last=s.order[s.cursor++];
    if(s.cursor===s.order.length){
      shuffle(s.order);
      if(s.order[0]===last) [s.order[0],s.order[1]]=[s.order[1],s.order[0]];
      s.cursor=0;
    }
  }
  function answer(s,ok){
    if(s.phase!=='play')return;
    s.history.push({word:s.order[s.cursor],ok});
    advance(s);
    if(s.remaining===0)s.phase='review';
  }
  function points(s){return s.history.reduce((n,r)=>n+(r.ok?1:s.deduct?-1:0),0);}
  function confirm(s){
    if(s.phase!=='review')return;
    s.scores[s.turn]+=points(s);
    s.turn=(s.turn+1)%s.teams.length;
    s.history=[];
    if(s.turn===0 && Math.max(...s.scores)>=s.goal){s.phase='finish';return;}
    if(s.turn===0)s.round++;
    s.phase='order';
  }
  function valid(s){
    if(!s||s.version!==1||!Array.isArray(s.teams)||s.teams.length<2||s.teams.length>names.length||
      !s.teams.every(n=>typeof n==='string'&&n.trim()&&n.length<=28)||!sets[s.set]||
      !Array.isArray(s.scores)||s.scores.length!==s.teams.length||!s.scores.every(Number.isInteger)||
      !Number.isInteger(s.turn)||!s.teams[s.turn]||!Number.isInteger(s.round)||s.round<1||
      !Number.isInteger(s.seconds)||s.seconds<10||s.seconds>120||!Number.isInteger(s.goal)||s.goal<10||s.goal>100||
      !Number.isFinite(s.remaining)||s.remaining<0||s.remaining>s.seconds*1000||
      !['order','ready','play','pause','review'].includes(s.phase))return false;
    const n=WORDS[s.set].length;
    return Array.isArray(s.order)&&s.order.length===n&&new Set(s.order).size===n&&
      s.order.every(i=>Number.isInteger(i)&&i>=0&&i<n)&&Number.isInteger(s.cursor)&&s.cursor>=0&&s.cursor<n&&
      Array.isArray(s.history)&&s.history.every(r=>r&&Number.isInteger(r.word)&&r.word>=0&&r.word<n&&typeof r.ok==='boolean');
  }
  return {names,sets,shuffle,fresh,start,current,word,answer,points,confirm,valid};
})();
