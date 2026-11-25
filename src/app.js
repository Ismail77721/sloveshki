'use strict';
(() => {
  const game=document.querySelector('#game'),ui=document.querySelector('#ui');
  const saveKey='sloveshki.game.v1', soundKey='sloveshki.sound.v1';
  let memory=null,s=null,screen='home',deadline=0,timer=0,motion=null,drag=null;
  const get=k=>{try{return localStorage.getItem(k);}catch{return null;}};
  function write(k,v){try{if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v);}catch{/* In private webviews memory still supports continuing. */}}
  function load(){
    try{const v=JSON.parse(memory||get(saveKey));return Rules.valid(v)?v:null;}catch{return null;}
  }
  function save(){memory=JSON.stringify(s);write(saveKey,memory);}
  function clearSave(){memory=null;write(saveKey,null);}
  let sound=get(soundKey)!=='off',ctx=null;
  const effects=['01-button','02-guessed','03-skipped','04-time-up'];
  const players=effects.map(n=>{const a=new Audio('./assets/'+n+'.wav');a.preload='auto';return a;});
  const buffers=[],sources=[];
  function unlock(){
    if(!sound)return;
    try{
      const AC=window.AudioContext||window.webkitAudioContext;
      if(!ctx&&AC){
        ctx=new AC();
        effects.forEach((v,i)=>fetch('./assets/'+v+'.wav').then(r=>r.arrayBuffer()).then(b=>ctx.decodeAudioData(b,buffer=>{buffers[i]=buffer;})).catch(()=>{}));
      }
      if(ctx&&ctx.state==='suspended')ctx.resume().catch(()=>{});
    }catch{}
  }
  function fx(i){
    if(!sound)return;unlock();
    if(buffers[i]&&ctx.state==='running'){
      if(sources[i]){try{sources[i].stop();}catch{}}
      const src=ctx.createBufferSource();src.buffer=buffers[i];src.connect(ctx.destination);src.start();sources[i]=src;
    }else{const a=players[i];a.currentTime=0;a.play().catch(()=>{});}
  }
  const svg=(path)=>'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+path+'</svg>';
  const arrow=svg('<path d="M19 12H5m6-6-6 6 6 6"/>');
  const refresh=svg('<path d="M20 8a8 8 0 0 0-14-2L3 9m0-5v5h5m-4 7a8 8 0 0 0 14 2l3-3m0 5v-5h-5"/>');
  function speaker(){return svg('<path d="M3 9h4l5-4v14l-5-4H3z"/>'+(sound?'<path d="M16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>':'<path d="m3 3 18 18"/>'));}
  const star=on=>'<svg viewBox="0 0 32 32" aria-hidden="true"><path d="m16 2 4 9 10 1-7.5 7 2 10-8.5-5-8.5 5 2-10-7.5-7 10-1z" fill="'+(on?'#ebbf59':'none')+'" stroke="'+(on?'#957330':'#868778')+'" stroke-width="1.5"/></svg>';
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const button=(act,txt,cl='primary',attr='')=>'<button type="button" class="'+cl+'" data-act="'+act+'" '+attr+'>'+txt+'</button>';
  const back=()=>button('back',arrow+'Назад','back');
  const h=t=>'<h1>'+t+'</h1>',fill='<div class="fill"></div>';
  const team=()=>esc(s.teams[s.turn]);
  const clock=ms=>{const sec=Math.ceil(ms/1000);return String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');};
  const rows=()=>'<div class="stack">'+s.teams.map((v,i)=>'<div class="score"><b>'+esc(v)+'</b><b>'+s.scores[i]+'</b></div>').join('')+'</div>';
  const panel=(label,key,min,max,unit)=>'<div class="setting"><label for="'+key+'"><b>'+label+'</b><output id="val-'+key+'">'+s[key]+' '+unit+'</output></label><input id="'+key+'" type="range" min="'+min+'" max="'+max+'" step="5" value="'+s[key]+'"></div>';
  const view={
    home(){
      const old=load();
      return button('sound',speaker(),'sound','aria-label="'+(sound?'Выключить':'Включить')+' звук" aria-pressed="'+sound+'"')+'<div class="brand" role="img" aria-label="Словешки"></div>'+button('new','Новая игра')+(old?button('continue','Продолжить','outline'):'')+button('rules','Как играть','plain');
    },
    rules(){return back()+h('Как играть')+'<div class="ruleblock"><h2>Объясняй своей команде</h2><p>Один игрок видит слово. Можно описывать предмет, приводить примеры, использовать синонимы и жесты. Само слово и однокоренные слова называть нельзя.</p><h2>Отмечай ответы</h2><p>Смахни пуговицу вверх, если команда отгадала слово, или вниз, чтобы пропустить. За отгаданное слово — одно очко. По умолчанию пропуск даёт ноль.</p><h2>Последнее слово</h2><p>В 00:00 текущее слово остаётся вашей команде до свайпа. Затем проверь ответы: нажми на звезду, чтобы исправить отметку.</p><h2>Кто победил</h2><p>Когда команда достигает цели, остальные доигрывают круг. Побеждает команда с большим счётом. При равном максимальном счёте — ничья.</p></div>'+fill+button('home','В главное меню');},
    teams(){return back()+h('Команды')+'<div class="stack">'+s.teams.map((v,i)=>'<div class="team"><input data-name="'+i+'" value="'+esc(v)+'" maxlength="28" aria-label="Название команды '+(i+1)+'">'+button('shuffle',refresh,'circle','data-i="'+i+'" aria-label="Сменить название"')+(s.teams.length>2?button('remove','×','circle minor','data-i="'+i+'" aria-label="Убрать команду"'):'')+'</div>').join('')+'</div>'+(s.teams.length<Rules.names.length?button('add','+ Добавить команду','plus'):'')+'<p class="error" role="status"></p>'+fill+button('settings','Далее');},
    settings(){return back()+h('Настройки игры')+panel('Время хода','seconds',10,120,'с')+panel('Цель игры','goal',10,100,'очков')+'<label class="switch"><b>Вычитать очко за пропуск</b><input id="deduct" type="checkbox" '+(s.deduct?'checked':'')+'></label>'+fill+button('sets','Выбрать набор');},
    sets(){return back()+h('Наборы')+Rules.sets.map((n,i)=>button('choose','<img src="./assets/'+['yellow','red','blue'][i]+'.webp" alt="">'+n,'set','data-i="'+i+'" aria-pressed="'+(i===s.set)+'"')).join('')+fill+button('launch','К игре');},
    replace(){return fill+h('Начать новую игру?')+'<p>Новая игра заменит сохранённую.</p>'+button('launch-ok','Начать новую игру')+button('sets','Вернуться','outline')+fill;},
    order(){return back()+h('Счёт команд')+'<p class="muted">Раунд '+s.round+' · Цель '+s.goal+' очков</p>'+rows()+fill+'<div class="center"><p>Передай телефон команде</p><b class="big">'+team()+'</b></div>'+fill+button('ready','Мы готовы');},
    ready(){return playView(true);}, play(){return playView(false);},
    pause(){return h('Пауза')+button('unpause','Продолжить')+button('exit','Выход','outline');},
    review(){
      const n=Rules.points(s);
      return '<p class="muted">'+team()+' · Раунд '+s.round+'</p>'+h('Конец раунда')+'<p class="muted">Нажми на звезду, чтобы исправить ответ.</p><div class="stack">'+s.history.map((r,i)=>'<div class="review-row"><b>'+esc(WORDS[s.set][r.word])+'</b>'+button('star',star(r.ok),'star','data-i="'+i+'" aria-label="'+esc(WORDS[s.set][r.word])+': '+(r.ok?'отгадано':'пропущено')+'" aria-pressed="'+r.ok+'"')+'</div>').join('')+'</div><div class="result">За ход<b>'+(n>0?'+':'')+n+'</b></div>'+fill+button('confirm','Далее');},
    finish(){const max=Math.max(...s.scores),w=s.teams.filter((_,i)=>s.scores[i]===max);return h('Итоги игры')+fill+'<div class="center"><p>'+ (w.length===1?'Победа!':'Ничья')+'</p><b class="big">'+w.map(esc).join(' · ')+'</b></div>'+rows()+fill+button('new','Сыграть ещё')+button('home','В меню','plain');}
  };
  function playView(ready){
    const guessed=ready?0:s.history.filter(r=>r.ok).length,missed=ready?0:s.history.length-guessed;
    const word=ready?'Начать':Rules.current(s);
    return '<div class="topbar"><span class="team-name">'+team()+'</span>'+(ready?'':button('pause','Пауза','mini'))+'</div><div class="counter upper"><strong>'+guessed+'</strong><span>Отгадано</span></div>'+
      (!ready&&s.remaining===0?'<b class="last">Последнее слово</b>':'')+'<div class="disc-slot">'+button(ready?'begin':'disc',esc(word),'disc'+(ready?' start':'')+(word.length>13?' long':''),ready?'':'aria-label="'+esc(word)+'. Свайп вверх или вниз"')+'</div>'+
      '<div class="counter lower"><span>Пропущено</span><strong>'+missed+'</strong></div><div class="timer">'+clock(ready?s.seconds*1000:s.remaining)+'</div>';
  }
  const tg=window.Telegram&&window.Telegram.WebApp;
  const inTelegram=Boolean(tg&&(tg.platform!=='unknown'||tg.initData||/tgWebAppPlatform/.test(location.hash)));
  function tgMethod(method,version,...args){try{if(inTelegram&&tg.isVersionAtLeast(version)&&typeof tg[method]==='function')tg[method](...args);}catch{}}
  function setSafe(){
    if(!inTelegram)return;
    for(const edge of ['top','bottom']){
      const px=(tg.safeAreaInset?.[edge]||0)+(tg.contentSafeAreaInset?.[edge]||0);
      document.documentElement.style.setProperty('--'+edge,'max(env(safe-area-inset-'+edge+', 0px), '+px+'px)');
    }
    if(tg.viewportStableHeight)game.style.height='min(100%, '+tg.viewportStableHeight+'px)';
    Board.layout();
  }
  if(inTelegram){
    tgMethod('expand','6.0');tgMethod('disableVerticalSwipes','7.7');setSafe();
    for(const ev of ['viewportChanged','safeAreaChanged','contentSafeAreaChanged'])tg.onEvent(ev,setSafe);
    if(tg.isVersionAtLeast('6.1'))tg.BackButton.onClick(goBack);
  }
  function render(next,keepScroll=false){
    if(motion){cancelAnimationFrame(motion);motion=null;}
    drag=null;Board.attach(null);clearInterval(timer);screen=next;
    const oldScroll=keepScroll?ui.querySelector('.screen')?.scrollTop||0:0;
    const board=['ready','play'].includes(screen);
    game.dataset.theme=board?'play':['settings','pause','finish'].includes(screen)?'sage':'linen';
    ui.innerHTML='<section class="screen '+(board?'play':screen==='pause'?'pause-screen':screen==='home'?'home':'')+'">'+view[screen]()+'</section>';
    ui.firstChild.scrollTop=oldScroll;
    if(board)Board.attach(ui.querySelector('.disc-slot'),screen==='ready'?'start':'word');
    if(screen==='play'&&s.remaining>0)timer=setInterval(tick,100);
    if(inTelegram&&tg.isVersionAtLeast('6.1'))screen==='home'?tg.BackButton.hide():tg.BackButton.show();
  }
  function phase(next){s.phase=next;save();render(next);}
  function goBack(){
    if(screen==='play' && motion)return;
    switch(screen){
      case 'play':pause();break;
      case 'pause':unpause();break;
      case 'ready':phase('order');break;
      case 'review':case 'order':case 'finish':case 'teams':case 'rules':render('home');break;
      case 'sets':render('settings');break;
      case 'settings':render('teams');break;
      case 'replace':render('sets');break;
    }
  }
  function begin(){s.history=[];s.remaining=s.seconds*1000;deadline=performance.now()+s.remaining;phase('play');}
  function tick(){
    if(screen!=='play'||s.remaining===0)return;
    s.remaining=Math.max(0,deadline-performance.now());
    if(!s.remaining){
      fx(3);save();clearInterval(timer);
      const label=document.createElement('b');label.className='last';label.textContent='Последнее слово';ui.firstChild.appendChild(label);
    }
    const el=ui.querySelector('.timer');if(el)el.textContent=clock(s.remaining);
  }
  function pause(){if(screen!=='play')return;tick();phase('pause');}
  function unpause(){deadline=performance.now()+s.remaining;phase('play');}
  function setOffset(d){const el=ui.querySelector('.disc');if(el)el.style.transform='translateY('+d+'px)';Board.move(d);}
  function answer(ok){
    if(screen!=='play'||motion)return;
    tick();const last=s.remaining===0,offset=drag?.offset||0;drag=null;
    Rules.answer(s,ok);save();fx(ok?1:2);
    const t0=performance.now();const dur=window.matchMedia('(prefers-reduced-motion: reduce)').matches?1:135;
    const animate=now=>{
      const t=Math.min(1,(now-t0)/dur);setOffset(offset+((ok?-105:105)-offset)*t);
      if(t<1){motion=requestAnimationFrame(animate);return;}
      motion=null;render(last?'review':'play');
    };
    motion=requestAnimationFrame(animate);
  }
  function suspend(){
    if(screen!=='play')return;
    if(s.phase==='review'){render('review');return;}
    pause();
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();});
  window.addEventListener('pagehide',suspend);
  if(inTelegram)tg.onEvent('deactivated',suspend);
  function launch(){Rules.start(s);phase('order');}
  function freshName(i){const avail=Rules.names.filter(v=>!s.teams.some(t=>t.trim().toLowerCase()===v.toLowerCase()));return avail[Math.floor(Math.random()*avail.length)]||('Команда '+(i+1));}
  ui.addEventListener('input',e=>{
    const t=e.target;
    if(t.hasAttribute('data-name'))s.teams[Number(t.dataset.name)]=t.value;
    if(t.id==='seconds'||t.id==='goal'){s[t.id]=Number(t.value);ui.querySelector('#val-'+t.id).textContent=t.value+(t.id==='seconds'?' с':' очков');}
    if(t.id==='deduct')s.deduct=t.checked;
  });
  ui.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b||!ui.contains(b))return;
    const act=b.dataset.act,i=Number(b.dataset.i);
    if(act==='sound'){sound=!sound;write(soundKey,sound?'on':'off');if(sound)fx(0);else{players.forEach(a=>a.pause());sources.forEach(src=>{try{src.stop();}catch{}});}render('home');return;}
    if(act==='disc')return;if(motion&&screen==='play')return;fx(0);
    switch(act){
      case 'back':goBack();break;
      case 'home':case 'rules':case 'sets':render(act);break;
      case 'new':s=Rules.fresh();render('teams');break;
      case 'continue':s=load();if(!s){render('home');break;}if(s.phase==='play')s.phase='pause';render(s.phase);break;
      case 'shuffle':s.teams[i]=freshName(i);render('teams',true);break;
      case 'remove':if(s.teams.length>2)s.teams.splice(i,1);render('teams',true);break;
      case 'add':if(s.teams.length<Rules.names.length)s.teams.push(freshName(s.teams.length));render('teams',true);ui.querySelectorAll('.team input')[s.teams.length-1].scrollIntoView({block:'nearest'});break;
      case 'settings':{
        s.teams=s.teams.map(n=>n.trim());const names=s.teams.map(n=>n.toLowerCase());
        if(names.includes('')||new Set(names).size!==names.length){ui.querySelector('.error').textContent='Введи разные названия для всех команд.';break;}
        render('settings');break;}
      case 'choose':s.set=i;render('sets');break;
      case 'launch':if(load())render('replace');else launch();break;
      case 'launch-ok':launch();break;
      case 'ready':phase('ready');break;
      case 'begin':begin();break;
      case 'pause':pause();break;
      case 'unpause':unpause();break;
      case 'exit':save();render('home');break;
      case 'star':s.history[i].ok=!s.history[i].ok;save();render('review',true);break;
      case 'confirm':Rules.confirm(s);if(s.phase==='finish')clearSave();else save();render(s.phase);break;
    }
  });
  ui.addEventListener('pointerdown',e=>{
    if(screen!=='play'||motion||drag||!e.isPrimary||e.button!==0||!e.target.closest('.disc'))return;
    e.preventDefault();unlock();e.target.setPointerCapture(e.pointerId);drag={id:e.pointerId,x:e.clientX,y:e.clientY,offset:0};
  });
  ui.addEventListener('pointermove',e=>{
    if(!drag||e.pointerId!==drag.id)return;
    drag.offset=Math.max(-74,Math.min(74,(e.clientY-drag.y)*.65));setOffset(drag.offset);
  });
  ui.addEventListener('pointerup',e=>{
    if(!drag||e.pointerId!==drag.id)return;
    const dy=e.clientY-drag.y,dx=e.clientX-drag.x;
    if(Math.abs(dy)>=32&&Math.abs(dy)>Math.abs(dx))answer(dy<0);else{drag=null;setOffset(0);}
  });
  ui.addEventListener('pointercancel',()=>{drag=null;setOffset(0);});
  document.addEventListener('keydown',e=>{
    if(e.repeat||e.target.tagName==='INPUT')return;
    if(screen==='play'&&['ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();answer(e.key==='ArrowUp');}
    if(e.key==='Escape'){e.preventDefault();goBack();}
  });
  render('home');tgMethod('ready','6.0');
})();
