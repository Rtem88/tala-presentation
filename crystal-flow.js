/* Optical details for the freezing, thawing and transfer scenes. All image coordinates are normalised to the actual production plates. */
(() => {
  const mount=document.getElementById('crystal-action');
  if(!mount)return;
  const canvas=mount.tagName==='CANVAS'?mount:document.createElement('canvas');
  if(canvas!==mount){mount.append(canvas);canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';}
  const ctx=canvas.getContext('2d',{alpha:true});
  if(!ctx)return;
  const base=new URL('.',document.currentScript.src);
  const images=['melt-ice.webp','plant-thaw.webp','plant-flow.webp'].map(name=>{
    const img=new Image();img.onload=()=>{refresh();wake()};img.src=new URL('assets/'+name,base);return img;
  });
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const buffers=images.map(()=>document.createElement('canvas'));
  const surfaces=buffers.map(b=>b.getContext('2d'));
  const waterLayer=document.createElement('canvas');
  const waterCtx=waterLayer.getContext('2d');
  const mappings=[];
  let w=0,h=0,pixelRatio=1,bufferScale=1,progress=0,visible=false,frame=0,last=0;
  const clamp=(v)=>Math.max(0,Math.min(1,v));
  const ease=(a,b,p)=>{const v=clamp((p-a)/(b-a));return v*v*(3-2*v)};
  const mix=(a,b,t)=>a+(b-a)*t;
  function refresh(){
    w=mount.clientWidth;h=mount.clientHeight;if(!w||!h)return;
    pixelRatio=Math.min(devicePixelRatio||1,1.5,1650/w);bufferScale=Math.min(1,1350/w);
    canvas.width=Math.round(w*pixelRatio);canvas.height=Math.round(h*pixelRatio);
    waterLayer.width=Math.ceil(w*bufferScale);waterLayer.height=Math.ceil(h*bufferScale);
    images.forEach((img,i)=>{
      const b=buffers[i];b.width=waterLayer.width;b.height=waterLayer.height;
      if(!img.naturalWidth)return;
      const scale=Math.max(w/img.naturalWidth,h/img.naturalHeight);
      const iw=img.naturalWidth*scale,ih=img.naturalHeight*scale;
      const position=w<700?[.70,.52]:[.5,.5];
      const x=(w-iw)*position[0],y=(h-ih)*position[1];
      mappings[i]={x,y,width:iw,height:ih};
      const c=surfaces[i];c.setTransform(bufferScale,0,0,bufferScale,0,0);
      c.drawImage(img,x,y,iw,ih);
    });
    paint(performance.now());
  }
  function at(i,x,y){
    const m=mappings[i];
    return m?{x:m.x+m.width*x,y:m.y+m.height*y}:{x:w*x,y:h*y};
  }
  function activity(p,a,b,c,d){return ease(a,b,p)*(1-ease(c,d,p))}
  function surfaceY(x,center,t){
    return center+h*.0048*Math.sin(x/w*9.8+t*1.3)+h*.0018*Math.sin(x/w*22-t*.9);
  }
  // Re-map optical scan lines in a local translucent layer: the pictured residual liquid really recedes on scrub.
  function icePlate(p,t,weight){
    if(!mappings[0]||weight<=0)return;
    const original=at(0,.72,.535).y;
    const movement=ease(.075,.22,p);
    const level=original+movement*h*.195;
    const waterAlpha=.83*weight;
    const start=Math.max(0,original-h*.22),end=Math.min(h,level+h*.2);
    if(end<=start)return;
    const c=waterCtx,s=bufferScale;
    c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,waterLayer.width,waterLayer.height);
    c.setTransform(s,0,0,s,0,0);
    const src=buffers[0],lastLevel=level;
    // Continuous inversion of the same piecewise optical mapping avoids double waterlines.
    const step=Math.max(2,Math.ceil(h/265));
    for(let y=start;y<end;y+=step){
      const near=Math.exp(-Math.abs(y-lastLevel)/(h*.085));
      const sourceY=y<=lastLevel?mix(start,original,clamp((y-start)/(lastLevel-start))):
        mix(original,end,clamp((y-lastLevel)/(end-lastLevel)));
      const sourceEnd=y+step<=lastLevel?mix(start,original,clamp((y+step-start)/(lastLevel-start))):
        mix(original,end,clamp((y+step-lastLevel)/(end-lastLevel)));
      const shift=Math.sin((y-level)*.043-t*1.6)*near*(1.3+movement*3.4);
      const sy=Math.max(0,Math.min(src.height-1,sourceY*s));
      c.drawImage(src,0,sy,src.width,Math.max(.8,(sourceEnd-sourceY)*s),shift-5,y,w+10,step+.75);
    }
    c.globalCompositeOperation='destination-in';
    const v=c.createLinearGradient(0,start,0,end);v.addColorStop(0,'transparent');v.addColorStop(.1,'white');v.addColorStop(.86,'white');v.addColorStop(1,'transparent');
    c.fillStyle=v;c.fillRect(0,0,w,h);
    const grad=c.createLinearGradient(0,0,w,0);grad.addColorStop(0,'transparent');grad.addColorStop(w<700?.14:.37,'transparent');grad.addColorStop(w<700?.55:.65,'white');grad.addColorStop(1,'white');
    c.fillStyle=grad;c.fillRect(0,0,w,h);c.globalCompositeOperation='source-over';
    ctx.save();ctx.globalAlpha=waterAlpha;ctx.drawImage(waterLayer,0,0,w,h);
    // A thin meniscus and its paired shadow reflect the studio strip light along the actual liquid surface.
    const begin=w*(w<700?.24:.46);
    ctx.beginPath();
    for(let x=begin;x<=w+7;x+=7){const y=surfaceY(x,level,t);if(x===begin)ctx.moveTo(x,y);else ctx.lineTo(x,y);}
    const edge=ctx.createLinearGradient(begin,0,w,0);edge.addColorStop(0,'transparent');edge.addColorStop(.37,'rgba(238,255,255,.7)');edge.addColorStop(.76,'rgba(255,255,255,.92)');edge.addColorStop(1,'rgba(202,244,250,.2)');
    ctx.strokeStyle=edge;ctx.lineWidth=Math.max(1,h*.0025);ctx.stroke();
    ctx.translate(0,2.3);ctx.globalAlpha=waterAlpha*.65;ctx.strokeStyle='rgba(18,75,99,.36)';ctx.lineWidth=1;ctx.stroke();
    ctx.restore();

  }
  function sampleLens(x,y,rx,ry,plate,alpha){
    const b=buffers[plate],s=bufferScale;
    if(!mappings[plate]||!b.width)return;
    const sx=Math.max(0,Math.min(b.width-1,(x-rx*1.8)*s));
    const sy=Math.max(0,Math.min(b.height-1,(y-ry*1.6)*s));
    const sw=Math.min(b.width-sx,Math.max(1,rx*3.7*s)),sh=Math.min(b.height-sy,Math.max(1,ry*3.3*s));
    ctx.save();ctx.globalAlpha=.88*alpha;
    ctx.translate(x,y);ctx.rotate(Math.PI);ctx.drawImage(b,sx,sy,sw,sh,-rx,-ry,rx*2,ry*2);ctx.restore();
  }
  function bead(plate,x,y,rx,ry,alpha) {
    if(rx<=0||x< -rx||y< -ry||x>w+rx||y>h+ry||alpha<.01)return;
    ctx.save();ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.clip();
    sampleLens(x,y,rx,ry,plate,alpha);
    ctx.translate(x,y);ctx.scale(rx,ry);
    const g=ctx.createRadialGradient(-.32,-.47,.02,0,0,1.08);
    g.addColorStop(0,'rgba(255,255,255,.98)');g.addColorStop(.19,'rgba(238,252,255,.52)');g.addColorStop(.4,'rgba(191,239,248,.04)');g.addColorStop(.72,'rgba(29,99,126,.18)');g.addColorStop(.86,'rgba(16,66,92,.66)');g.addColorStop(.95,'rgba(230,250,255,.89)');g.addColorStop(1,'rgba(53,120,149,.22)');
    ctx.globalAlpha=alpha;ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);ctx.restore();
  }
  const thawChannels=[
    [.617,.212, .61,.285, .596,.422, .594,.508],
    [.696,.17, .675,.274, .67,.42, .655,.501],
    [.841,.094, .818,.205, .805,.361, .786,.484],
    [.962,.142, .934,.226, .928,.372, .90,.461]
  ];
  function positionOnCurve(i,points,f){
    const g=1-f;
    return at(i,g*g*g*points[0]+3*g*g*f*points[2]+3*g*f*f*points[4]+f*f*f*points[6],
              g*g*g*points[1]+3*g*g*f*points[3]+3*g*f*f*points[5]+f*f*f*points[7]);
  }
  function thaw(p,t,weight){
    if(!mappings[1]||weight<=0)return;
    const span=Math.max(.7,Math.min(w/1150,1.45));
    const growth=.55+.45*ease(.21,.35,p);
    thawChannels.forEach((channel,i)=>{
      const shift=(t*(.32+i*.031)+i*.23)%1;
      const end=.22+.78*ease(.0,.82,shift);
      const start=Math.max(0,end-(.27+.20*growth));
      const path=new Path2D();
      for(let j=0;j<=21;j++){
        const u=mix(start,end,j/21),point=positionOnCurve(1,channel,u);
        const wobble=Math.sin(u*18+i+t*.95)*1.4*span;
        if(j===0)path.moveTo(point.x+wobble,point.y);else path.lineTo(point.x+wobble,point.y);
      }
      ctx.save();ctx.globalAlpha=weight*growth;ctx.lineCap='round';
      ctx.strokeStyle='rgba(20,68,88,.38)';ctx.lineWidth=(i===1?5.8:3.9)*span;ctx.stroke(path);
      ctx.translate(-.8*span,0);ctx.lineWidth=(i===1?2.6:1.65)*span;ctx.strokeStyle='rgba(237,253,255,.9)';ctx.stroke(path);
      ctx.restore();
      const tip=positionOnCurve(1,channel,end);
      bead(1,tip.x,tip.y,span*(2.5+i%2),span*(4.4+i%2),weight);
      const origin=positionOnCurve(1,channel,1);
      const land=at(1,channel[6]-.061,.563+(i*.018));
      for(let j=0;j<3;j++){
        const d=(t*(.75+i*.06)+i*.33+j*.36)%1;
        const x=mix(origin.x,land.x,d*d),y=mix(origin.y,land.y,d*d);
        bead(1,x,y,span*(1.8+1.4*d),span*(2.9+3.1*d),weight*.86);
        if(d>.86){
          const k=(d-.86)/.14;ctx.save();ctx.globalAlpha=(1-k)*weight*.7;ctx.beginPath();ctx.ellipse(land.x,land.y,2+span*19*k,1+span*3*k,0,0,Math.PI*2);ctx.strokeStyle='#dffaff';ctx.stroke();ctx.restore();
        }
      }
    });
    // The streams from the ice join the sloping tray and empty into its return channel.
    const tray=[.64,.50,.53,.525,.546,.59,.425,.746];
    const gutter=[.424,.746,.387,.767,.39,.894,.345,.994];
    for(const [k,curve] of [tray,gutter].entries()){
      for(let lane=0;lane<5;lane++){
        const head=(t*(k?.48:.63)+lane*.225)%1;
        const path=new Path2D();
        for(let j=0;j<=18;j++){
          const u=Math.max(0,head-j/18*.29);
          const pt=positionOnCurve(1,curve,u);
          const wav=Math.sin(t*1.6+lane*8+u*16)*span*2;
          const dx=(lane-2)*span*1.9+wav,dy=Math.cos(u*11-lane+t)*span;
          if(!j)path.moveTo(pt.x+dx,pt.y+dy);else path.lineTo(pt.x+dx,pt.y+dy);
        }
        ctx.save();ctx.globalAlpha=weight*.8;ctx.lineCap='round';ctx.lineWidth=(lane%2?4.2:2.7)*span;
        ctx.strokeStyle='rgba(46,97,116,.58)';ctx.stroke(path);ctx.translate(-.7*span,-.8*span);
        ctx.lineWidth=(lane%2?2:1.2)*span;ctx.strokeStyle='rgba(237,255,255,.92)';ctx.stroke(path);ctx.restore();
      }
    }
  }
  // Moving bands show the liquid passing through the inspection window.
  const glassTube={start:[.505,.547],end:[.802,.504],width:.088};
  function transfer(p,t,weight){
    if(!mappings[2]||weight<=0)return;
    const start=at(2,...glassTube.start),end=at(2,...glassTube.end);
    const len=Math.hypot(end.x-start.x,end.y-start.y);if(len<2)return;
    const nx=(start.y-end.y)/len,ny=(end.x-start.x)/len;
    const half=Math.max(4,glassTube.width*mappings[2].height);
    ctx.save();ctx.globalAlpha=weight;
    ctx.beginPath();ctx.moveTo(start.x+nx*half,start.y+ny*half);ctx.lineTo(end.x+nx*half,end.y+ny*half);ctx.lineTo(end.x-nx*half,end.y-ny*half);ctx.lineTo(start.x-nx*half,start.y-ny*half);ctx.closePath();ctx.clip();
    // Moving pressure bands refract the original industrial plate inside the glass.
    const boundsX=Math.max(0,Math.min(start.x,end.x)-half*.12),boundsW=Math.max(0,Math.min(w,Math.max(start.x,end.x)+half*.12)-boundsX);
    const top=Math.max(0,Math.min(start.y,end.y)-half*1.2),bottom=Math.min(h,Math.max(start.y,end.y)+half*1.2);
    const src=buffers[2],s=bufferScale;
    if(boundsW>0&&bottom>top){
      ctx.globalAlpha=weight*.80;
      for(let xx=boundsX;xx<boundsX+boundsW;xx+=5){
        const u=(xx-boundsX)/boundsW;
        const disp=(Math.sin(u*25-t*4.2)*5.9 + Math.sin(u*61-t*6)*1.3)*Math.sin(u*Math.PI);
        const sy=Math.max(0,Math.min(src.height-(bottom-top)*s,(top+disp)*s));
        const sx=Math.max(0,Math.min(src.width-6*s,(xx+disp*.7)*s));
        ctx.drawImage(src,sx,sy,Math.min(6*s,src.width-sx),(bottom-top)*s,xx,top,6,bottom-top);
      }
      ctx.globalAlpha=weight;
    }
    for(let i=0;i<7;i++){
      const phase=(t*.37+i*.1618)%1;
      const length=.12+(i%3)*.055;
      const path=new Path2D();
      for(let j=0;j<=15;j++){
        const f=phase-j/15*length;
        const turb=half*(Math.sin(i*27.3)*.70+.16*Math.sin(f*16-t*2+i));
        const x=mix(start.x,end.x,f)+nx*turb,y=mix(start.y,end.y,f)+ny*turb;
        if(!j)path.moveTo(x,y);else path.lineTo(x,y);
      }
      ctx.strokeStyle='rgba(218,251,255,.46)';ctx.lineWidth=(i%2?1.7:1.1);ctx.stroke(path);
    }
    ctx.restore();

  }
  function paint(now){
    if(!w||!h)return;
    ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);ctx.clearRect(0,0,w,h);
    if(progress>=.56)return;
    const t=reduced.matches?progress*11:now*.001+progress*3;
    icePlate(progress,t,1-ease(.175,.235,progress));
    thaw(progress,t,activity(progress,.175,.247,.365,.427));
    transfer(progress,t,activity(progress,.36,.426,.519,.56));
  }
  function tick(now){
    frame=0;if(!visible||document.hidden)return;
    if(now-last>35||reduced.matches){paint(now);last=now;}
    if(progress<.56&&!reduced.matches)frame=requestAnimationFrame(tick);
  }
  function wake(){if(visible&&!document.hidden&&!frame)frame=requestAnimationFrame(tick);}
  window.addEventListener('tala:factory',event=>{
    const value=event.detail?.progress;
    if(!Number.isFinite(value))return;
    progress=clamp(value);
    if(progress>=.56||reduced.matches)paint(performance.now());else wake();
  },true);
  new ResizeObserver(refresh).observe(mount);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){paint(performance.now());wake()}}).observe(mount);
  reduced.addEventListener('change',()=>{paint(performance.now());wake()});
  document.addEventListener('visibilitychange',wake);
})();
