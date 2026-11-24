(() => {
  'use strict';
  const reel=document.getElementById('offer-reel');
  if(!reel) return;
  const pin=reel.querySelector('.ore-pin');
  const camera=pin.querySelector('.ore-camera');
  const scenes=[...reel.querySelectorAll('.ore-scene')];
  const groupNames={concept:'Колекція',scope:'Склад робіт',process:'Етапи',outcome:'Результат',investment:'Вартість'};
  const groups=scenes.map(s=>s.dataset.group);
  const firstScope=groups.indexOf('scope');
  const firstWork=groups.indexOf('process');
  const outcome=groups.indexOf('outcome');
  const final=groups.indexOf('investment');
  const viewer=reel.querySelector('#gallery-ritual');
  const order=viewer.dataset.sequence.split(' ').map(Number);
  const names=['Негазована · 0,33 л','Негазована · 0,5 л','Негазована · 1 л','Слабогазована · 0,5 л','Слабогазована · 0,75 л','Негазована · 5 л'];
  const choices=[...reel.querySelectorAll('[data-offer-bottle]')];
  const caption=reel.querySelector('#ore-bottle-name');
  const counter=reel.querySelector('#ore-bottle-n');
  const menuCaption=reel.querySelector('#ore-current');
  const bar=reel.querySelector('.ore-progress');
  const prev=reel.querySelector('[data-offer-step="-1"]');
  const next=reel.querySelector('[data-offer-step="1"]');
  const field=reel.querySelector('.studio-field');
  const prints=[...field.children];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const introUnits=1.05, bottleUnits=1.02;
  const spans=groups.map(g=>g==='concept'?introUnits+order.length*bottleUnits:g==='investment'?.08:g==='outcome'?1.18:1);
  const starts=[];let duration=0;
  for(const span of spans){starts.push(duration);duration+=span}
  const bottleStops=order.map((_,i)=>introUnits+(i+.055)*bottleUnits);
  const stops=[0,...bottleStops,...starts.slice(1)];
  const clamp=(n,low=0,high=1)=>Math.min(high,Math.max(low,n));
  function smooth(n){const t=clamp(n);return t*t*(3-2*t)}
  const two=n=>String(n).padStart(2,'0');
  const flow=(p,start)=>smooth((p-start)/(1-start));
  let unit=1,width=1,position=0,front=-1,group='',activeBottle=-1,frame=0,tween=0,pendingFocus=null;
  let lastGallery='';
  const shown=new Set();

  function anchor(){return window.scrollY+reel.getBoundingClientRect().top}
  function stopTween(){cancelAnimationFrame(tween);tween=0;pendingFocus=null}
  function seek(units,animate=false) {
    stopTween();
    const target=anchor()+units*unit;
    const start=window.scrollY;
    if(!animate||reduced.matches||Math.abs(target-start)<3){window.scrollTo({top:target,behavior:'instant'});paint();return}
    const length=Math.min(900,390+Math.abs(target-start)/unit*95);
    const begin=performance.now(); pendingFocus=units;
    function move(now){
      const t=clamp((now-begin)/length);
      window.scrollTo({top:start+(target-start)*smooth(t),behavior:'instant'});
      if(t<1)tween=requestAnimationFrame(move);
      else{tween=0;pendingFocus=null}
    }
    tween=requestAnimationFrame(move);
  }
  function go(id){
    if(id==='top'){stopTween();window.scrollTo({top:0,behavior:'instant'});paint();return true}
    const chapter=groups.indexOf(id);
    const i=chapter<0?scenes.findIndex(scene=>scene.dataset.sceneLink===id):chapter;
    if(i<0)return false;
    seek(starts[i]+.002);return true;
  }
  window.TalaOffer={go,current:()=>reel.getBoundingClientRect().top>2?'top':group||'concept'};
  function step(dir){
    const from=pendingFocus??position;
    const candidates=dir>0?stops:[...stops].reverse();
    const target=candidates.find(s=>dir>0?s>from+.055:s<from-.055);
    if(target!==undefined)seek(target+.002,true);
  }
  choices.forEach(button=>button.addEventListener('click',()=>seek(bottleStops[order.indexOf(Number(button.dataset.offerBottle))],true)));
  prev.addEventListener('click',()=>step(-1));next.addEventListener('click',()=>step(1));
  reel.querySelector('.ore-home').addEventListener('click',e=>{e.preventDefault();go('top')});
  for(const type of ['wheel','touchstart','pointerdown'])window.addEventListener(type,stopTween,{passive:true});
  window.addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key))stopTween()});
  reel.addEventListener('keydown',e=>{
    if(e.altKey||e.ctrlKey||e.metaKey||e.target.matches('input,textarea,select')||e.target.closest('.detail-switch'))return;
    if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();step(e.key==='ArrowRight'?1:-1)}
  });
  let drag=null;
  viewer.addEventListener('pointerdown',e=>{if(e.button===0)drag={id:e.pointerId,x:e.clientX,y:e.clientY,start:position,active:false}});
  viewer.addEventListener('pointermove',e=>{
    if(drag?.id!==e.pointerId)return;
    const dx=drag.x-e.clientX;
    if(!drag.active){
      if(Math.abs(e.clientY-drag.y)>Math.abs(dx)+8){drag=null;return}
      if(Math.abs(dx)<8)return;
      drag.active=true;viewer.setPointerCapture(e.pointerId);
    }
    seek(clamp(drag.start+dx/Math.max(190,width*.35)*bottleUnits,0,spans[0]-.04));
  });
  for(const event of ['pointercancel','pointerup','pointerleave','lostpointercapture'])viewer.addEventListener(event,e=>{
    if(drag?.id===e.pointerId&&(event!=='pointerleave'||!drag.active))drag=null;
  });

  function collection(){
    // One turn locks onto the next format. Its print, shadow and caption share that turn.
    const raw=clamp((position-introUnits)/bottleUnits,0,order.length-.00001);
    const slot=Math.floor(raw),phase=raw-slot;
    const orbit=Math.min(order.length-1,slot+flow(Math.min(1,phase/.94),.16));
    const focus=Math.round(orbit);
    const intro=clamp(position/introUnits);
    const exit=slot===order.length-1?flow(phase,.56):0;
    if(focus!==activeBottle){
      activeBottle=focus;const id=order[focus];caption.textContent=names[id];counter.textContent=two(focus+1)+' / '+two(order.length);
      choices.forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.offerBottle)===id)));
    }
    const key=[slot,phase.toFixed(4),intro.toFixed(4),reduced.matches].join('/');
    if(key!==lastGallery){
      lastGallery=key;
      document.dispatchEvent(new CustomEvent('tala:gallery',{detail:{index:order[focus],phase,intro,position:orbit,exit}}));
    }
  }
  function expose(i,phase,z,opacity,transform,live){
    const node=scenes[i];live.add(i);
    node.style.visibility='visible';node.style.zIndex=z;node.style.opacity=clamp(opacity).toFixed(4);
    node.style.transform=reduced.matches?'none':transform;
    node.style.setProperty('--phase',clamp(phase).toFixed(4));
  }
  function panel(i,distance,phase,opacity,live){
    if(reduced.matches&&Math.abs(distance)>.5)return;
    scenes[i].style.setProperty('--panel-focus',(1-clamp(Math.abs(distance))).toFixed(3));
    const spacing=width*(width<=740?.902:.883);
    const z=-Math.min(1,Math.abs(distance))*width*.045;
    expose(i,phase,3,opacity,'translate3d('+(distance*spacing)+'px,0,'+z+'px) rotateY('+(-distance*5)+'deg)',live);
  }
  function work(i,offset,phase,opacity,live){
    if(reduced.matches && opacity<.5)return;
    const node=scenes[i],sign=(i-firstWork)%2===0?1:-1;
    const drift=reduced.matches?0:offset;
    node.style.setProperty('--art-x',(drift*width*.34)+'px');
    node.style.setProperty('--art-y',(drift*unit*.16*sign)+'px');
    node.style.setProperty('--art-angle',(drift*sign*19)+'deg');
    node.style.setProperty('--type-x',(-drift*width*.10)+'px');
    node.style.setProperty('--copy-opacity',(1-smooth((Math.abs(drift)-.09)/.39)).toFixed(4));
    expose(i,phase,offset>0?3:2,opacity,'none',live);
  }
  function brand(i,progress,phase,opacity,live){
    const travel=1-progress;
    expose(i,phase,4,opacity,'translate3d('+(travel*16)+'%,'+(travel*9)+'%,'+(-travel*170)+'px) rotateZ('+(travel*-7)+'deg) scale('+(1-travel*.39)+')',live);
  }
  const anchors=[[-.44,-.39],[.42,-.24],[-.13,.42],[.40,.36],[.06,-.41],[-.44,.16]];
  function photoField(time,opacity){
    field.style.visibility=opacity>.001?'visible':'hidden';
    if(opacity<=.001)return;
    field.style.opacity=opacity.toFixed(4);
    const t=reduced.matches?0:time;
    prints.forEach((print,i)=>{
      const [ax,ay]=anchors[i];
      const depth=(t*.17+i*.163)%1;
      const x=(ax+.12*Math.sin(t*1.18+i*2))*width;
      const y=(ay+.20*Math.cos(t*.91+i*1.7))*unit;
      print.style.opacity=(.12+.47*Math.sin(depth*Math.PI)).toFixed(3);
      print.style.transform='translate(-50%,-50%) translate3d('+x+'px,'+y+'px,'+(-350+depth*560)+'px) rotateZ('+(Math.sin(t*.83+i*3)*11)+'deg)';
    });
  }
  function paint(){
    frame=0;
    const box=reel.getBoundingClientRect();
    position=clamp(-box.top/unit,0,duration);
    let i=0;while(i+1<scenes.length&&starts[i+1]<=position)i++;
    const phase=clamp((position-starts[i])/spans[i]);const live=new Set();
    let foremost=i,fieldTime=0,fieldOpacity=0;
    if(i===0){
      collection();
      const transition=smooth((position-spans[0]+.47)/.47);
      expose(0,phase,2,1-transition,'translate3d('+(-transition*9)+'%,0,'+(-transition*200)+'px) rotateY('+(transition*9)+'deg)',live);
      if(transition>0)panel(firstScope,1-transition,0,transition,live);
      if(transition>.54)foremost=firstScope;
    }else if(groups[i]==='scope'){
      const turn=flow(phase,.22),last=i===firstWork-1;
      if(i>firstScope&&turn<.18)panel(i-1,-1-turn,1,1,live);
      panel(i,-turn,phase,last?1-turn*.9:1,live);
      if(!last)panel(i+1,1-turn,0,1,live);
      if(last&&turn>0){fieldOpacity=turn;work(firstWork,1-turn,0,turn,live)}
      if(turn>.5)foremost=i+1;
    }else if(groups[i]==='process'){
      const turn=flow(phase,.57);
      fieldTime=i-firstWork+phase;fieldOpacity=1;
      work(i,-turn,phase,1-turn,live);
      if(turn>0){
        if(i+1===outcome){brand(outcome,turn,0,turn,live);fieldOpacity=1-turn}
        else work(i+1,1-turn,0,turn,live);
      }
      if(turn>.5)foremost=i+1;
    }else if(i===outcome){
      const turn=flow(phase,.65);
      brand(i,1,phase,1-turn,live);
      if(turn>0)brand(final,turn,0,turn,live);
      if(turn>.5)foremost=final;
    }else brand(i,1,phase,1,live);
    const enterScope=smooth((position-starts[firstScope]+.47)/.47);
    const leaveScope=flow(clamp(position-starts[firstWork-1]),.22);
    camera.style.setProperty('--scope-light',(enterScope*(1-leaveScope)).toFixed(3));
    photoField(fieldTime,fieldOpacity);
    for(const n of shown)if(!live.has(n)){scenes[n].style.visibility='hidden';shown.delete(n)}
    for(const n of live)shown.add(n);
    if(foremost!==front){
      scenes.forEach((s,n)=>{s.inert=n!==foremost;s.setAttribute('aria-hidden',String(n!==foremost))});
      front=foremost;
    }
    scenes[final].style.setProperty('--amount-visible',i===final?'1':'0');
    const chapter=box.top>2?'top':groups[foremost];
    if(chapter!==group){group=chapter;document.dispatchEvent(new CustomEvent('tala:chapter',{detail:{id:group}}))}
    let title=groupNames[groups[front]];
    if(front===0)title+=' '+(activeBottle+1)+'/6';
    if(groups[front]==='scope')title+=' '+(front-firstScope+1)+'/'+(firstWork-firstScope);
    if(groups[front]==='process')title+=' '+(front-firstWork+1)+'/'+(outcome-firstWork);
    if(menuCaption.textContent!==title)menuCaption.textContent=title;
    bar.style.setProperty('--progress',((position/duration)*98+2)+'%');
    prev.disabled=position<.05;next.disabled=position>=starts[final]-.04;
  }
  function resize(){
    const previousUnit=unit;
    const preserve=Boolean(group && group!=='top');
    width=pin.clientWidth;unit=Math.max(pin.clientHeight,470);
    reel.style.height=Math.ceil(pin.clientHeight+duration*unit)+'px';
    Object.keys(groupNames).forEach(id=>{reel.querySelector('#'+id).style.top=starts[groups.indexOf(id)]*unit+'px'});
    if(preserve && previousUnit!==unit){stopTween();window.scrollTo({top:anchor()+position*unit,behavior:'instant'})}
    paint();
  }
  reel.classList.add('ore-ready');resize();
  function openCardLink(){
    const id=location.hash.slice(1);
    if(scenes.some(scene=>scene.dataset.sceneLink===id))go(id);
  }
  requestAnimationFrame(()=>go(location.hash.slice(1)));
  window.addEventListener('load',openCardLink,{once:true});
  window.addEventListener('hashchange',openCardLink);
  const study=reel.querySelector('.ore-design-art');
  const photograph=study.querySelector('.study-image');
  const product=photograph.querySelector('img');
  const lens=study.querySelector('.study-loupe');
  const leader=study.querySelector('.study-leader');
  function pointToDetail(){
    if(!product.naturalWidth||!photograph.clientWidth)return;
    const scale=Math.min(photograph.clientWidth/product.naturalWidth,photograph.clientHeight/product.naturalHeight);
    const [ux,uy]=study.querySelector('[aria-pressed="true"]').dataset.point.split(',').map(Number);
    const x=photograph.offsetLeft+photograph.clientWidth/2+(ux-.5)*product.naturalWidth*scale;
    const y=photograph.offsetTop+photograph.clientHeight/2+(uy-.5)*product.naturalHeight*scale;
    const dx=lens.offsetLeft-x,dy=lens.offsetTop+lens.clientWidth/2-y;
    leader.style.left=x+'px';leader.style.top=y+'px';
    leader.style.width=Math.hypot(dx,dy)+'px';
    leader.style.transform='rotate('+Math.atan2(dy,dx)+'rad)';
  }
  product.addEventListener('load',pointToDetail);
  new ResizeObserver(pointToDetail).observe(study);
  study.querySelector('.detail-switch').addEventListener('click',event=>{
    const button=event.target.closest('[data-detail-choice]');
    if(!button)return;
    const choice=button.dataset.detailChoice;
    study.dataset.detail=choice;
    for(const tab of study.querySelectorAll('[data-detail-choice]'))tab.setAttribute('aria-pressed',String(tab===button));
    for(const sample of study.querySelectorAll('[data-sample]'))sample.hidden=sample.dataset.sample!==choice;
    pointToDetail();
  });
  window.addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(paint)},{passive:true});
  window.addEventListener('resize',resize,{passive:true});
  window.addEventListener('pageshow',paint);
  reduced.addEventListener('change',()=>{stopTween();paint()});
})();
