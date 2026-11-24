(() => {
  'use strict';
  const host = document.getElementById('factory-action');
  if (!host) return;
  const base = new URL('assets/', document.currentScript.src);
  const pin = host.closest('.hero-pin') || host.parentElement;
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden','true');
  canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none';
  host.appendChild(canvas);
  const g=canvas.getContext('2d',{alpha:true});
  if (!g) return;
  const pi=Math.PI,tau=pi*2,capCut=124/1392,bottleRatio=434/1392;
  const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
  const mix=(a,b,t)=>a+(b-a)*t;
  const smooth=(a,b,p)=>{const t=clamp((p-a)/(b-a));return t*t*(3-2*t);};
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let p=clamp(Number(pin.dataset.progress)||0),w=0,h=0,dpr=1,t=0,last=0,frame=0,visible=true,ready=false;
  let shell,cap,print,paper,brand,boxFaces;
  const load=file=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=new URL(file,base);});
  function queue(){if(ready&&visible&&!frame&&!document.hidden)frame=requestAnimationFrame(draw);}
  function resize(){const b=host.getBoundingClientRect();w=b.width;h=b.height;dpr=Math.min(devicePixelRatio||1,1.65);
    canvas.width=Math.max(1,Math.round(w*dpr));canvas.height=Math.max(1,Math.round(h*dpr));queue();}
  new ResizeObserver(resize).observe(host);resize();
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible){last=performance.now();queue();}},{rootMargin:'36px'}).observe(host);
  document.addEventListener('tala:factory',e=>{p=clamp(Number(e.detail?.progress)||0);queue();});
  document.addEventListener('visibilitychange',()=>{last=performance.now();queue();});
  reduced.addEventListener('change',queue);
  Promise.all(['factory-empty.webp','cinema-cap.webp','factory-print.webp','factory-kraft.webp','tala.svg'].map(load)).then(images=>{
    [shell,cap,print,paper,brand]=images;boxFaces=makeFaces();ready=true;last=performance.now();draw(last);
  }).catch(()=>{host.dataset.renderer='unavailable';});

  function poly(c,pts,fill,stroke,line=1){
    c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();
    if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke();}
  }
  function ellipse(x,y,rx,ry,color,stroke,width=1){
    if(rx<=0||ry<=0)return;
    g.beginPath();g.ellipse(x,y,rx,ry,0,0,tau);
    if(color){g.fillStyle=color;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=width;g.stroke();}
  }
  function gradient(x0,y0,x1,y1,stops){
    const grad=g.createLinearGradient(x0,y0,x1,y1);
    stops.forEach(([pos,color])=>grad.addColorStop(pos,color));return grad;
  }
  const steel=[[0,'#37484c'],[.055,'#83959a'],[.13,'#f4fcfb'],[.23,'#a0b4b6'],[.37,'#eaf3f1'],[.46,'#d7e0dd'],[.59,'#6e8182'],[.70,'#4e656a'],[.82,'#dbe7e6'],[.93,'#aebdbb'],[1,'#546c72']];
  function cylinder(x,y,width,height,corners=.02){
    const a=x-width/2,b=x+width/2;
    g.fillStyle=gradient(a,0,b,0,steel);g.beginPath();g.roundRect(a,y,width,height,Math.min(width*.2,Math.max(.001,height*corners)));g.fill();
    ellipse(x,y,width/2,width*.065,'#c2d1d1','#e5eeee',Math.max(.0009,width*.015));
    ellipse(x,y+height,width/2,width*.059,'rgba(66,87,92,.64)');
  }
  function nozzle(x,sourceTip,tip,L,alpha){
    if(alpha<=0)return;
    g.save();g.globalAlpha*=alpha;g.translate(x,sourceTip);g.scale(L,L);
    const reach=Math.max(.008,(tip-sourceTip)/L);
    cylinder(0,-.009,.072,.020);
    cylinder(0,.007,.044,Math.max(.002,reach-.014));
    cylinder(0,reach-.014,.050,.012);
    ellipse(0,reach-.002,.023,.0038,'#314c52','#b8d3d3',.002);
    g.restore();
  }
  function shadow(x,y,rx,ry,alpha){
    g.save();g.translate(x,y);g.scale(rx,ry);
    const grad=g.createRadialGradient(0,0,.005,0,0,1);
    grad.addColorStop(0,'rgba(24,43,48,'+alpha+')');grad.addColorStop(.45,'rgba(24,46,49,'+alpha*.53+')');grad.addColorStop(1,'rgba(38,69,75,0)');
    g.fillStyle=grad;g.fillRect(-1,-1,2,2);g.restore();
  }
  // All bottle operations share coordinates measured against the same original 500 ml catalogue photograph.
  function silhouette(){
    const path=new Path2D();path.moveTo(-.128,.98);path.bezierCurveTo(-.143,.977,-.142,.952,-.140,.91);
    path.lineTo(-.142,.25);path.bezierCurveTo(-.145,.18,-.094,.139,-.089,.102);
    path.lineTo(.089,.102);path.bezierCurveTo(.096,.141,.143,.185,.142,.25);
    path.lineTo(.140,.92);path.bezierCurveTo(.142,.965,.136,.985,.12,.984);path.closePath();return path;
  }
  const bodyPath=silhouette();
  function glassMouth(){
    const a=.088,y=.067;
    g.fillStyle=gradient(-a,0,a,0,[[0,'#719295'],[.09,'#d0e1de'],[.20,'#f8ffff'],[.33,'#a5bec0'],[.69,'#dcebe6'],[.83,'#f7ffff'],[1,'#759899']]);
    g.fillRect(-a,y,2*a,.035);
    for(let j=0;j<3;j++){
      const yy=y+.008+j*.009;
      g.beginPath();g.moveTo(-a,yy);g.bezierCurveTo(-.04,yy+.007,.045,yy+.004,a,yy-.003);
      g.strokeStyle=j%2?'#f2fcfa':'#9ab5b7';g.lineWidth=.0025;g.stroke();
    }
    ellipse(0,y,.087,.0068,'#ccdfdf','#edf5f3',.0018);ellipse(0,y-.0002,.076,.0048,'#546e70');
  }
  function liquidShape(level,flow,phase){
    if(level<=.004)return;
    const yy=mix(.974,.13,level),amp=.002+flow*.005;
    g.save();g.clip(bodyPath);
    g.beginPath();g.moveTo(-.16,1);g.lineTo(-.16,yy);
    for(let i=0;i<=42;i++){
      const u=i/42,xx=-.16+u*.32;
      const sy=yy+amp*Math.sin(u*pi*3+phase*3.6)+amp*.35*Math.sin(u*10-phase*5);
      g.lineTo(xx,sy);
    }
    g.lineTo(.16,1);g.closePath();
    g.fillStyle=gradient(-.14,0,.14,0,[[0,'rgba(44,120,140,.55)'],[.09,'rgba(155,211,225,.56)'],[.20,'rgba(222,247,247,.68)'],[.34,'rgba(153,207,218,.48)'],[.58,'rgba(178,226,232,.61)'],[.74,'rgba(216,243,240,.68)'],[.9,'rgba(118,185,202,.53)'],[1,'rgba(62,143,161,.59)']]);g.fill();
    g.beginPath();
    for(let i=0;i<=42;i++){const u=i/42,x=-.16+u*.32,y=yy+amp*Math.sin(u*pi*3+phase*3.6)+amp*.35*Math.sin(u*10-phase*5);if(!i)g.moveTo(x,y);else g.lineTo(x,y);}
    g.strokeStyle='rgba(63,143,158,.83)';g.lineWidth=.007;g.stroke();g.translate(0,-.0035);g.strokeStyle='rgba(240,255,254,.99)';g.lineWidth=.0038;g.stroke();g.translate(0,.0035);
    if(flow>.02){
      g.globalAlpha*=flow;
      for(let i=0;i<28;i++){
        const a=((phase*(.34+i%3*.11)+i*.618)%1),xx=(Math.sin(i*4.83+a*5)*.075)*Math.sin(a*pi);
        const y=mix(yy+.008,.96,a),r=.0017+((i*7)%9)*.0007;
        if(y<.975)ellipse(xx,y,r,r*(1+.45*a),'rgba(240,255,253,.48)','rgba(106,176,189,.68)',.001);
      }
    }g.restore();
  }
  function waterJet(from,to,intensity,phase){
    if(intensity<.006||to<=from)return;
    const wide=.014*intensity,pts=[];
    for(let j=0;j<=37;j++){let u=j/37;
      pts.push([Math.sin(u*16-phase*16)*.0016*u,mix(from,to,u),wide*(1-.27*u)*(1+.11*Math.sin(u*43-phase*17))]);}
    g.beginPath();pts.forEach(([x,y,r],i)=>i?g.lineTo(x-r,y):g.moveTo(x-r,y));for(let j=37;j>=0;j--)g.lineTo(pts[j][0]+pts[j][2],pts[j][1]);g.closePath();
    g.fillStyle=gradient(-wide,0,wide,0,[[0,'rgba(58,125,138,.81)'],[.19,'rgba(224,255,253,.87)'],[.37,'rgba(145,213,222,.62)'],[.64,'rgba(84,159,174,.73)'],[.81,'rgba(236,255,252,.84)'],[1,'rgba(105,165,178,.80)']]);g.fill();
    g.beginPath();pts.forEach(([x,y,r],i)=>i?g.lineTo(x-r*.44,y):g.moveTo(x-r*.44,y));g.lineWidth=.0028;g.strokeStyle='rgba(250,255,254,.88)';g.stroke();
  }
  function appliedLabel(amount){
    if(amount<=.002)return;
    const width=206/1392,height=856/1392,xx=(116-217)/1392,y=368/1392;
    // Progressively wrap each photographic strip around the cylindrical front plane.
    const u=smooth(0,1,amount);
    g.save();const pivot=xx+width;g.translate(pivot,0);
    const spread=Math.sin(u*pi/2);
    g.drawImage(print,0,0,print.width,print.height,-width*spread,y,width*spread,height);
    if(u<.976){
      const edge=-width*spread,f=.018*Math.sin(pi*u);
      g.fillStyle=gradient(edge,0,edge+Math.max(.0001,f),0,[[0,'rgba(255,255,255,.65)'],[.44,'rgba(92,140,172,.37)'],[1,'rgba(255,255,255,0)']]);g.fillRect(edge,y+.02,f,height-.035);
    }
    g.restore();
  }
  function bottle(x,base,L,level,closure,wrapped,phase,flow=0,jet=0) {
    g.save();g.translate(x,base-L);g.scale(L,L);
    liquidShape(level,flow,phase);
    if(jet>0)waterJet(.037,mix(.965,.135,level),jet*.79,phase);
    g.drawImage(shell,-bottleRatio*.5,capCut,bottleRatio,1-capCut);
    glassMouth();appliedLabel(wrapped);
    if(closure>=0){
      const approach=smooth(0,.90,closure);
      const from=.12*(1-approach);
      g.save();g.globalAlpha*=smooth(0,.12,closure);g.translate(0,-from);
      g.drawImage(cap,-bottleRatio/2,0,bottleRatio,capCut);g.restore();
    }
    g.restore();
  }
  function makeFaces(){
    function make(type){
      const tile=document.createElement('canvas');tile.width=660;tile.height=460;const c=tile.getContext('2d');c.drawImage(paper,0,0,660,460);
      c.fillStyle=type==='inside'?'rgba(74,47,28,.4)':type==='side'?'rgba(99,64,32,.18)':type==='top'?'rgba(255,242,209,.13)':'rgba(245,216,175,.07)';
      c.fillRect(0,0,660,460);
      const shade=c.createLinearGradient(0,0,660,460);
      shade.addColorStop(0,type==='side'?'rgba(57,43,30,.15)':'rgba(255,254,235,.13)');
      shade.addColorStop(.41,'rgba(255,247,211,.01)');
      shade.addColorStop(1,type==='top'?'rgba(116,91,61,.06)':'rgba(67,52,38,.16)');
      c.fillStyle=shade;c.fillRect(0,0,660,460);
      if(type==='front'){
        const logo=document.createElement('canvas');logo.width=260;logo.height=115;const lc=logo.getContext('2d');lc.drawImage(brand,0,0,260,115);lc.globalCompositeOperation='source-in';lc.fillStyle='#213e59';lc.fillRect(0,0,260,115);
        c.drawImage(logo,47,150,216,72);
        c.fillStyle='#344650';c.font='600 15px Arial';c.fillText('ПИТНА ВОДА',50,255);c.font='15px Arial';c.fillText('500 мл × 6',50,282);
        c.strokeStyle='rgba(46,57,55,.70)';c.lineWidth=2;c.strokeRect(49,350,64,57);
        for(let i=0;i<2;i++){const x=70+i*22;c.beginPath();c.moveTo(x,392);c.lineTo(x,365);c.moveTo(x-6,373);c.lineTo(x,365);c.lineTo(x+6,373);c.stroke();}
        c.fillStyle='#344650';c.font='14px Arial';c.fillText('ВИРОБЛЕНО В УКРАЇНІ',341,398);
      }
      if(type==='side'){
        c.fillStyle='#eee9d9';c.fillRect(126,177,406,128);c.fillStyle='#3a4748';c.font='bold 32px Arial';c.fillText('TALA',146,215);
        for(let k=0;k<65;k++){const x=145+k*5.5;c.fillRect(x,235,1+(k*17%3),47);}
      }
      return tile;
    }
    return Object.fromEntries(['front','side','top','inside'].map(k=>[k,make(k)]));
  }
  const add=(a,b,k=1)=>[a[0]+b[0]*k,a[1]+b[1]*k];
  function panel(a,b,d,texture,edge='rgba(93,67,43,.61)'){
    g.save();g.transform((b[0]-a[0])/texture.width,(b[1]-a[1])/texture.width,(d[0]-a[0])/texture.height,(d[1]-a[1])/texture.height,a[0],a[1]);
    g.drawImage(texture,0,0);g.restore();
    poly(g,[a,b,add(b,[d[0]-a[0],d[1]-a[1]]),d],null,edge,.0022);
  }
  function flap(a,b,open,closed,fraction,back=false){
    const k=smooth(0,1,fraction), arc=Math.sin(k*pi);
    const shift=[mix(open[0],closed[0],k),mix(open[1],closed[1],k)-arc*.135];
    panel(a,b,add(a,shift),back && k<.6?boxFaces.inside:boxFaces.top);
    const far=add(a,shift),end=add(b,shift);g.beginPath();g.moveTo(far[0],far[1]);g.lineTo(end[0],end[1]);g.strokeStyle='#dfbf8d';g.lineWidth=.004;g.stroke();
  }
  function pack(x,base,L,pr,phase){
    const enter=smooth(.829,.872,pr),load=smooth(.865,.943,pr);
    if(enter<.001)return;
    const zoom=1+.19*smooth(.941,.998,pr);
    const hbox=L*zoom,xbox=x+(1-enter)*(w*.32),yb=base+(1-enter)*hbox*.43;
    const leftFl=smooth(.936,.966,pr),rightFl=smooth(.945,.979,pr),backFl=smooth(.955,.987,pr),frontFl=smooth(.969,.998,pr);
    g.save();g.globalAlpha*=enter;
    shadow(xbox+L*.08,yb+.005*L,L*.89,L*.081,.31);
    g.save();g.translate(xbox,yb);g.scale(hbox,hbox);
    const a=[-.535,-.952],b=[.447,-.920],depth=[.24,-.16],d=add(a,depth),c=add(b,depth);
    const down=[0,.94],A=add(a,down),B=add(b,down),D=add(d,down),C=add(c,down);
    panel(d,c,D,boxFaces.inside);panel(a,d,A,boxFaces.inside);panel(A,B,D,boxFaces.inside);
    if(backFl<.8)flap(d,c,[.06,-.23],[-depth[0]*.50,-depth[1]*.50],backFl,true);
    if(leftFl<.64)flap(a,d,[-.18,-.12],[.39,.012],leftFl,true);
    g.restore();
    for(let row=1;row>=0;row--){
      for(let col=0;col<3;col++){
        const k=row*3+col,delay=(k%3)*.009+row*.003;
        const gather=smooth(.832+delay,.878+delay*.4,pr),fall=smooth(.868+delay,.940+delay*.3,pr);
        const bx=xbox+hbox*(-.365+col*.294+row*.105)+(1-gather)*(col===0?-.27:.35+col*.17)*L;
        const by=yb+hbox*(-1.055+fall*.987-row*.068)+.020*L*Math.sin(k+phase)*Math.sin(pi*fall);
        g.save();g.globalAlpha*=gather;
        bottle(bx,by,hbox*.88,1,1,1,phase);
        g.restore();
      }
    }
    g.save();g.translate(xbox,yb);g.scale(hbox,hbox);
    panel(b,c,B,boxFaces.side);panel(a,b,A,boxFaces.front);
    if(leftFl>=.64)flap(a,d,[-.18,-.12],[.39,.012],leftFl,true);
    flap(b,c,[.18,-.10],[-.39,-.012],rightFl);
    if(backFl>=.8)flap(d,c,[.06,-.23],[-depth[0]*.50,-depth[1]*.50],backFl);
    flap(a,b,[-.02,-.18],[depth[0]*.51,depth[1]*.51],frontFl);
    const tape=smooth(.987,1,pr);
    if(tape>.001){
      const s=add(a,depth,.5),e=add(s,[b[0]-a[0],b[1]-a[1]],tape),v=[.018,-.013];
      poly(g,[add(s,v,-1),add(e,v,-1),add(e,v),add(s,v)],'rgba(224,207,169,.81)','rgba(131,112,78,.58)',.0015);
    }
    g.restore();g.restore();
  }
  function draw(now){
    frame=0;if(!ready||!visible||document.hidden||w<2||h<2)return;
    const dt=Math.min(.065,(now-last)/1000);last=now;if(!reduced.matches)t+=dt;
    g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,w,h);
    const enter=smooth(.515,.559,p);
    if(enter>.0001){
      const small=w<680;
      const plateWidth=Math.max(w,h*16/9),plateHeight=plateWidth*9/16;
      const dx=(w-plateWidth)*(small?.70:.5),dy=(h-plateHeight)*(small?.52:.5);
      const x=dx+plateWidth*.688, machineTip=dy+plateHeight*.281;
      const ground=clamp(dy+plateHeight*.797,h*.69,h*.91);
      const length=small?Math.min(h*.39,w*.75,ground-machineTip-h*.065):Math.min(h*.62,ground-machineTip-h*.022);
      const depart=smooth(.816,.880,p),packX=w*(small?.56:.748);
      const packL=small?Math.min(h*.215,w*.405):Math.min(h*.368,w*.32);
      const filling=smooth(.562,.713,p),flux=smooth(.550,.581,p)*(1-smooth(.685,.716,p));
      const valveUp=smooth(.699,.746,p),closure=smooth(.745,.792,p),wrapped=smooth(.775,.841,p);
      // Match moving product, nozzle tip and meniscus to the same placement matrix.
      const bx=x+(1-enter)*w*.14-depart*w*.08, lift=smooth(.831,.875,p);
      const L=length*(1-depart*.23),baseY=ground-lift*length*.24;
      const top=baseY-L, tip=mix(machineTip,top+L*.047,enter*(1-valveUp));
      g.save();g.globalAlpha=enter;
      g.save();g.globalAlpha*=1-smooth(.830,.878,p);
      shadow(bx,ground+L*.003,L*.26,L*.032,.32);
      bottle(bx,baseY,L,filling,p>.745?closure:-1,wrapped,t,flux,flux);
      if(flux>.002){
        g.save();g.translate(x,top);g.scale(L,L);waterJet((tip-top)/L-.006,.072,flux,t);g.restore();
      }
      nozzle(x,machineTip,tip,L,1-valveUp);
      // The capping head and its spindle share the neck centreline until the seal is seated.
      const chuck=smooth(.745,.752,p)*(1-smooth(.789,.811,p));
      if(chuck>.001){
        const capTop=top-L*.12*(1-smooth(0,.90,closure))+L*.004;
        const contact=mix(machineTip,Math.max(machineTip,capTop),1-smooth(.794,.811,p));
        nozzle(bx,machineTip,contact,L,chuck);
      }
      g.restore();
      pack(packX,ground,packL,p,t);
      g.restore();
    }
    host.dataset.renderer='ready';
    if(document.documentElement.hasAttribute('data-water-samples'))
      document.dispatchEvent(new CustomEvent('tala:cinema-frame',{detail:{canvas}}));
    if(!reduced.matches&&p>=.53&&p<.999)queue();
  }
})();
