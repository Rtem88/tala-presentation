(() => {
  const hero = document.querySelector('.hero');
  const pin = hero.querySelector('.hero-pin');
  const shots = [...pin.querySelectorAll('[data-shot]')];
  const plates = [...pin.querySelectorAll('.plant-plate')];
  const cover = pin.querySelector('.product-cover');
  const film = cover.querySelector('video');
  const cue = cover.querySelector('button');
  const coverEnd=.145;
  let pageVisible=true;
  function syncFilm(){
    const allowed=pageVisible && !document.hidden && !reduced.matches && progress<coverEnd;
    if(!allowed){film.pause();return}
    if(!film.getAttribute('src'))film.src=film.dataset.file;
    film.play().catch(()=>{});
  }
  const starts = [0,.101,.228,.398,.548,.728,.854];
  const plateStarts = [0,.215,.392,.526];
  const slider = document.getElementById('shot-range');
  const player = document.getElementById('shot-play');
  const label = document.getElementById('shot-label');
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const menu = document.getElementById('deck-list');
  const indexButton = document.getElementById('deck-index');
  const chapterLinks = [...menu.querySelectorAll('a')];
  const chapters = chapterLinks.map(link => link.hash.slice(1));
  const arrows = [...document.querySelectorAll('.deck-dock [data-change]')];
  const note = pin.querySelector('.scroll-note');
  const clamp = x => Math.max(0, Math.min(1,x));
  const smooth = (a,b,p) => {const t=clamp((p-a)/(b-a));return t*t*(3-2*t)};
  let progress = -1, chapter = '', playing = false, scrollFrame = 0, animationFrame = 0, lastTime = 0;
  const length = () => Math.max(1,hero.offsetHeight-pin.offsetHeight);
  const sectionY = () => scrollY+hero.getBoundingClientRect().top;
  function paint(raw,force=false) {
    if(!force && Math.abs(raw-progress)<.00001)return;
    const changed=(progress<coverEnd)!==(raw<coverEnd) || progress<0 || force;
    progress=raw;
    const p=clamp((raw-coverEnd)/(1-coverEnd));
    pin.dataset.progress=p.toFixed(5);
    const departure=smooth(.039,coverEnd,raw);
    cover.style.setProperty('--departure',departure.toFixed(4));
    cover.style.visibility=raw<coverEnd?'visible':'hidden';
    cover.inert=departure>.55;cover.setAttribute('aria-hidden',String(cover.inert));
    pin.classList.toggle('campaign-active',departure<.56);
    if(changed)syncFilm();
    let index=0;
    for(let i=1;i<starts.length;i++)if(p>=starts[i])index=i;
    shots.forEach((shot,i)=>{
      const incoming=i===0?1:smooth(starts[i]-.015,starts[i]+.016,p);
      const outgoing=i===shots.length-1?0:smooth(starts[i+1]-.017,starts[i+1]+.007,p);
      const alpha=incoming*(1-outgoing)*smooth(.091,coverEnd,raw);
      shot.style.visibility=alpha>.001?'visible':'hidden';
      shot.style.opacity=alpha.toFixed(3);
      shot.setAttribute('aria-hidden',String(i!==index || departure<.65));
      if(alpha<=0 || reduced.matches){shot.style.transform='none';return}
      const translateX=(incoming-1)*8+outgoing*1.8,translateY=(1-incoming)*22-outgoing*32;
      shot.style.transform='translate3d('+translateX+'%, '+translateY+'%, '+((incoming-1)*185+outgoing*126)+'px)';
      shot.querySelector('strong').style.transform='translateX('+((1-incoming)*23+outgoing*9)+'px)';
    });
    plates.forEach((plate,i)=>{
      const intro=i===0?1:smooth(plateStarts[i]-.014,plateStarts[i]+.014,p);
      const covered=i<plates.length-1 && p>=plateStarts[i+1]+.014;
      plate.style.visibility=intro>0&&!covered?'visible':'hidden';
      if(i && !covered)plate.style.clipPath='inset('+((1-intro)*100).toFixed(2)+'% 0 0)';
    });
    const text=shots[index].dataset.label;
    label.textContent=text;slider.value=String(Math.round(p*1000));
    slider.style.setProperty('--played',(p*100)+'%');slider.setAttribute('aria-valuetext',text+', '+Math.round(p*100)+'%');
    note.style.opacity=String(1-smooth(.012,.09,p));
    document.dispatchEvent(new CustomEvent('tala:factory',{detail:{progress:p,cover:departure<.55}}));
  }
  function selectChapter(id){
    if(!chapters.includes(id)||id===chapter)return;
    chapter=id;const i=chapters.indexOf(id);
    indexButton.querySelector('b').textContent=String(i+1).padStart(2,'0');
    arrows[0].disabled=i===0;arrows[1].disabled=i===chapters.length-1;
    chapterLinks.forEach((link,n)=>link.setAttribute('aria-current',String(n===i)));
  }
  function update(){
    scrollFrame=0;
    paint(clamp((scrollY-sectionY())/length()));
    selectChapter(window.TalaOffer?.current() || 'top');
  }
  const queue=()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(update)};
  function seek(p){window.scrollTo({top:sectionY()+clamp(p)*length(),behavior:'instant'});paint(clamp(p))}
  function stop(){playing=false;cancelAnimationFrame(animationFrame);player.textContent='▶';player.title='Відтворити виробничу сцену';player.setAttribute('aria-label',player.title)}
  function advance(now){
    if(!playing)return;
    const next=progress+Math.min(90,now-lastTime)/31000;lastTime=now;
    seek(next);
    if(progress>=1)stop();else animationFrame=requestAnimationFrame(advance);
  }
  player.addEventListener('click',()=>{
    if(playing){stop();return}if(progress>.995)seek(0);
    player.textContent='Ⅱ';player.title='Призупинити';player.setAttribute('aria-label',player.title);
    playing=true;lastTime=performance.now();animationFrame=requestAnimationFrame(advance);
  });
  slider.addEventListener('input',()=>{stop();seek(coverEnd+(1-coverEnd)*Number(slider.value)/1000)});
  for(const type of ['wheel','touchstart'])window.addEventListener(type,()=>{if(playing)stop()},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)stop()});
  function close(){menu.hidden=true;indexButton.setAttribute('aria-expanded','false')}
  function go(id){
    if(!chapters.includes(id))return;
    close();stop();
    if(id==='top')seek(0);else window.TalaOffer?.go(id);
    selectChapter(id);
    try{history.replaceState(null,'','#'+id)}catch{}
    queue();
  }
  indexButton.addEventListener('click',()=>{menu.hidden=!menu.hidden;indexButton.setAttribute('aria-expanded',String(!menu.hidden))});
  document.addEventListener('click',event=>{
    const link=event.target.closest('a[href^="#"]');
    if(link&&chapters.includes(link.hash.slice(1))){event.preventDefault();go(link.hash.slice(1))}
    else if(!event.target.closest('.deck-dock'))close();
  });
  function step(delta){go(chapters[Math.min(chapters.length-1,Math.max(0,chapters.indexOf(chapter)+delta))])}
  arrows.forEach(a=>a.addEventListener('click',()=>step(Number(a.dataset.change))));
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&!menu.hidden){close();indexButton.focus();return}
    if(!['ArrowLeft','ArrowRight'].includes(event.key)||event.target.closest('input,textarea,select,button,a')||event.defaultPrevented||event.metaKey||event.ctrlKey||event.altKey)return;
    event.preventDefault();step(event.key==='ArrowRight'?1:-1);
  });
  document.addEventListener('tala:chapter',e=>selectChapter(e.detail.id));
  window.addEventListener('scroll',queue,{passive:true});
  window.addEventListener('resize',()=>{progress=-1;queue()});
  reduced.addEventListener('change',()=>paint(clamp(progress),true));
  window.addEventListener('hashchange',()=>go(location.hash.slice(1)));
  cue.addEventListener('click',()=>{stop();window.scrollTo({top:sectionY()+(coverEnd+.005)*length(),behavior:reduced.matches?'instant':'smooth'})});
  new IntersectionObserver(([e])=>{pageVisible=e.isIntersecting;syncFilm()}).observe(cover);
  document.addEventListener('visibilitychange',syncFilm);
  reduced.addEventListener('change',syncFilm);
  update();
  const deepLink=location.hash.slice(1);
  if(chapters.includes(deepLink))window.addEventListener('load',()=>requestAnimationFrame(()=>go(deepLink)),{once:true});
})();
