'use strict';
// Phaser draws the physical button. Native text and touch controls remain accessible above it.
const Board = (() => {
  let engine, disc, frame, type='word', shift=0,angle=0,scale=1,opacity=1;
  const host=document.querySelector('#surface');
  function layout(){
    if(!engine || !disc)return;
    const h=host.getBoundingClientRect();
    const density=Math.min(window.devicePixelRatio||1,4);
    const width=Math.max(1,Math.round(h.width*density));
    const height=Math.max(1,Math.round(h.height*density));
    if(engine.canvas.width!==width || engine.canvas.height!==height){
      engine.scale.resize(width,height);
    }
    if(!frame)return;
    const w=frame.getBoundingClientRect(),rx=width/h.width,ry=height/h.height;
    disc.setTexture(type).setDisplaySize(w.width*scale*rx,w.height*scale*ry)
      .setAngle(angle).setAlpha(opacity)
      .setPosition((w.left-h.left+w.width/2)*rx,(w.top-h.top+w.height/2+shift)*ry);
  }
  function fallback(){
    host.classList.remove('visible');document.body.classList.remove('phaser-ready');
  }
  if(window.Phaser){
    class Buttons extends Phaser.Scene {
      preload(){for(const name of ['word','start'])this.load.image(name,'./assets/'+name+'3.webp');}
      create(){
        if(!this.textures.exists('word')||!this.textures.exists('start'))return;
        disc=this.add.image(0,0,'word');document.body.classList.add('phaser-ready');
        if(frame){host.classList.add('visible');layout();}else disc.setVisible(false);
      }
    }
    try{engine=new Phaser.Game({type:Phaser.CANVAS,parent:host,transparent:true,banner:false,audio:{noAudio:true},
      input:{keyboard:false,mouse:false,touch:false},scale:{mode:Phaser.Scale.NONE,width:host.clientWidth||390,height:host.clientHeight||740},
      fps:{target:30},scene:Buttons});}catch(e){fallback();}
  }
  const obs=window.ResizeObserver?new ResizeObserver(layout):null;
  function attach(el,name){
    if(frame&&obs)obs.unobserve(frame);
    frame=el;shift=0;angle=0;scale=1;opacity=1;type=name||'word';
    if(disc){disc.setVisible(Boolean(el));host.classList.toggle('visible',Boolean(el));}
    if(el){if(obs)obs.observe(el);requestAnimationFrame(layout);}
  }
  function move(y,rotation=0,zoom=1,alpha=1){shift=y;angle=rotation;scale=zoom;opacity=alpha;layout();}
  window.addEventListener('resize',layout);
  return {attach,move,layout};
})();
