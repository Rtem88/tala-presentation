(() => {
  const host = document.querySelector('#gallery-ritual');
  if (!host) return;
  const gallery = host.closest('.ore-gallery');
  const stage = host.querySelector('.studio-space');
  const orbit = stage.querySelector('.film-surface');
  const rig = stage.querySelector('.laptop-rig');
  const lid = rig.querySelector('.laptop-lid');
  const base = rig.querySelector('.laptop-base');
  const display = rig.querySelector('video');
  const shadow = host.querySelector('.studio-shadow');
  const order = host.dataset.sequence.split(' ').map(Number);
  const volumes = ['0,33 л','0,5 л','1 л','0,5 л','0,75 л','5 л'];
  const mediaBase = new URL('assets/',document.currentScript.src);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = n => Math.min(1,Math.max(0,n));
  const ease = n => { const t=clamp(n); return t*t*(3-2*t); };
  let width=1,height=1,near=false,inView=false;
  let state={index:order[0],phase:0,intro:0,position:0,exit:0};

  const keybed = base.querySelector('.keybed');
  const keyboard = ['esc 1 2 3 4 5 6 7 8 9 0 − + ⌫','⇥ Q W E R T Y U I O P [ ]','⇪ A S D F G H J K L : ↵','⇧ Z X C V B N M , . / ⇧','fn ⌃ ⌥ ⌘ _ ⌘ ⌥ ‹ ›'];
  keyboard.forEach(row => {
    const line=document.createElement('div');
    row.split(' ').forEach(key => {
      const cap=document.createElement('i');
      if(key==='_')cap.className='spacebar';else cap.textContent=key;
      line.append(cap);
    });
    keybed.append(line);
  });

  function setupFilm(video,id) {
    video.muted=true; video.defaultMuted=true; video.playsInline=true;
    video.loop=true; video.preload='none'; video.disablePictureInPicture=true;
    video.addEventListener('playing',()=>video.classList.add('is-playing'));
    video.addEventListener('error',()=>video.classList.remove('is-playing'));
    return {video,url:new URL('studio-'+id+'.mp4',mediaBase).href};
  }
  const screenFilm=setupFilm(display,order[0]);
  const cards=order.map(id=>{
    const box=document.createElement('div');
    box.className='film-layer';
    const image=document.createElement('img');
    image.className='film-frame'; image.alt=''; image.draggable=false;
    image.src=new URL(id===1?'tala-studio-500.webp':'studio-'+id+'.webp',mediaBase).href;
    const video=document.createElement('video');
    video.className='film-footage';
    const label=document.createElement('div');label.className='card-imprint';
    const size=document.createElement('strong');size.textContent=volumes[id];
    const type=document.createElement('span');type.textContent=(id===3||id===4)?'Слабогазована':'Негазована';
    label.append(type,size); box.append(image,video,label); orbit.append(box);
    return {box,film:setupFilm(video,id)};
  });

  function updateFilm(film,playing,prefetch=false) {
    const video=film.video;
    if(reduced.matches){video.pause();video.classList.remove('is-playing');return}
    if((playing||prefetch) && !video.src){video.preload='auto';video.src=film.url}
    if(playing && video.paused && !video.error)video.play().catch(()=>{});
    if(!playing && !video.paused)video.pause();
  }

  function draw() {
    const {index,phase,intro,position,exit}=state;
    const still=reduced.matches;
    const opening=still?1:ease(intro/.59);
    const unfold=still?1:ease((intro-.48)/.52);
    const small=width<740 || width/height<.88;
    const cardWidth=Math.min(width*(small?.59:.277),height*(small?.378:.38),490);
    const cardHeight=cardWidth*1.43;
    const deviceWidth=Math.min(width*(small?.70:.55),height*.735,1060);
    const deviceHeight=deviceWidth*.589;
    const deviceOpacity=still?0:1-ease((unfold-.15)/.71);
    const pitch=-52+57*opening;
    const heading=-19+23*opening-14*unfold;
    const lift=height*(small?.065:.071)*unfold;
    const active=inView && !document.hidden && gallery.getAttribute('aria-hidden')!=='true';
    gallery.style.setProperty('--unfold',unfold.toFixed(4));
    gallery.style.setProperty('--travel',(position/5).toFixed(4));
    gallery.style.setProperty('--leave',exit.toFixed(4));
    rig.style.setProperty('--device-w',deviceWidth+'px');
    rig.style.setProperty('--device-h',deviceHeight+'px');
    rig.style.visibility=deviceOpacity>.002?'visible':'hidden';
    const centerCorrection=width*(small?.041:.018)*(1-opening);
    rig.style.transform='translate3d('+centerCorrection+'px,'+(-lift)+'px,'+(-165*unfold)+'px) rotateY('+heading+'deg) rotateZ('+(-4+4*opening-5*unfold)+'deg)';
    lid.style.transform='rotateX('+pitch+'deg)';
    rig.style.setProperty('--device-opacity',deviceOpacity.toFixed(4));
    updateFilm(screenFilm,active&&deviceOpacity>.05,near&&intro<.6);
    shadow.style.opacity=String((1-exit)*(.33-.16*unfold));
    shadow.style.transform='translateX(-50%) scale('+(.84+.17*opening-.29*unfold)+')';

    const carouselPosition=still?Math.round(position):position;
    const reveal=still?1:ease(unfold/.95);
    const focus=Math.min(5,Math.max(0,Math.round(carouselPosition)));
    cards.forEach(({box,film},slot)=>{
      const delta=slot-carouselPosition;
      const angle=delta*Math.PI/3;
      const x=Math.sin(angle)*cardWidth*(small?1.03:1.27)*unfold;
      const y=(1-Math.cos(angle))*cardHeight*.08*unfold + (1-reveal)*height*.064 - exit*height*.11;
      const z=(Math.cos(angle)-1)*cardWidth*1.64*unfold-(1-reveal)*deviceWidth*.29+exit*(slot===5?cardWidth*.9:-cardWidth*.6);
      // The collection has a beginning and an end. The far side of the orbit never wraps around.
      const proximity=1-ease((Math.abs(delta)-1.25)/1.02);
      const opacity=still?(slot===focus?1:0):proximity*(slot===0?ease((unfold-.04)/.66):ease((unfold-.26)/.74))*(1-exit*.85);
      box.hidden=opacity<=.001;
      if(!box.hidden){
        const size=.62+.38*reveal;
        const yaw=Math.sin(angle)*52*unfold;
        box.style.width=cardWidth+'px';box.style.height=cardHeight+'px';
        box.style.marginLeft=(-cardWidth/2)+'px';box.style.marginTop=(-cardHeight/2)+'px';
        box.style.opacity=opacity.toFixed(4);
        box.style.transform='translate3d('+x+'px,'+y+'px,'+z+'px) rotateY('+yaw+'deg) rotateZ('+(-Math.sin(angle)*4+(1-reveal)*-7)+'deg) scale('+size+')';
        box.style.setProperty('--shade',(Math.min(1,Math.abs(delta))*.36).toFixed(3));
      }
      updateFilm(film,active && reveal>.04 && Math.abs(delta)<.84 && !box.hidden,near && intro>.68 && Math.abs(delta)<1.3);
    });
    host.dataset.index=String(index);host.dataset.phase=phase.toFixed(4);
    host.dataset.position=position.toFixed(4); host.dataset.intro=intro.toFixed(4);
  }
  const observer=new ResizeObserver(([entry])=>{width=entry.contentRect.width;height=entry.contentRect.height;draw()});
  observer.observe(host);
  new IntersectionObserver(([e])=>{near=e.isIntersecting;draw()},{rootMargin:'260px'}).observe(host);
  new IntersectionObserver(([e])=>{inView=e.isIntersecting;draw()},{threshold:.02}).observe(host);
  document.addEventListener('tala:gallery',e=>{state=e.detail;draw()});
  document.addEventListener('tala:chapter',draw);
  document.addEventListener('visibilitychange',draw);
  reduced.addEventListener('change',draw);
})();
