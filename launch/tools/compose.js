#!/usr/bin/env node
// node launch/tools/compose.js
// H1 THE LAUNCH KIT — GILT NOIR covers, capsules and the social card, painted on a
// canvas in a page this script writes (the game's own embedded Cinzel + Cormorant,
// a real gameplay frame from launch/raw/, Vesper's portrait re-rendered at 10×),
// exported as PNG at exact store sizes. Also lays out the 1920×1080 phone screenshot
// and converts the raw captures into launch/screenshots/*.jpg.
// Run capture.js first. No network.
'use strict';
const path = require('path'), fs = require('fs');
const { execFileSync } = require('child_process');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
const ROOT = path.resolve(__dirname, '..', '..');
const L = path.join(ROOT, 'launch'), RAW = path.join(L, 'raw');
const dataURL = f => 'data:image/' + (f.endsWith('.png') ? 'png' : 'jpeg') + ';base64,' + fs.readFileSync(f).toString('base64');

// the House's typefaces, lifted straight out of the game's stylesheet
const css = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
const fonts = (css.match(/@font-face\s*\{[^}]*\}/g) || []).join('\n');

// which real frame sits under which piece of art
const PICK = JSON.parse(fs.readFileSync(path.join(__dirname, 'picks.json'), 'utf8'));
const img = {}; for (const k of new Set(Object.values(PICK.bg).concat(['vesper_portrait', 'phone_play'])))
  img[k] = dataURL(path.join(RAW, k + '.png'));

const OUTS = [
  // name, w, h, layout
  ['cover-itch-630x500', 630, 500, 'tall'],
  ['cover-itch-315x250', 315, 250, 'tall'],
  ['capsule-steam-header-460x215', 460, 215, 'wide'],
  ['capsule-steam-main-616x353', 616, 353, 'wide'],
  ['hero-1920x1080', 1920, 1080, 'hero'],
  ['social-1200x630', 1200, 630, 'social'],
];

const PAGE = `<!doctype html><html><head><meta charset="utf-8"><style>${fonts}
html,body{margin:0;background:#0a0507} canvas{display:block}</style></head><body><canvas id="c"></canvas>
<div style="font-family:Cinzel;font-weight:800;position:absolute;opacity:0">.</div><div style="font-family:Cinzel;font-weight:600;position:absolute;opacity:0">.</div>
<div style="font-family:'Cormorant Garamond';font-style:italic;position:absolute;opacity:0">.</div>
<script>
const IMG=${JSON.stringify(img)}, PICK=${JSON.stringify(PICK)};
const load=s=>new Promise(r=>{ const i=new Image(); i.onload=()=>r(i); i.src=s; });
const GOLD=['#fff2c0','#ffd36b','#e8b64c','#a07828','#5a3c10'];
function gildGrad(g,x0,y0,x1,y1){ const gr=g.createLinearGradient(x0,y0,x1,y1);
  gr.addColorStop(0,'#fff6d4'); gr.addColorStop(0.28,'#ffd36b'); gr.addColorStop(0.5,'#b8862e'); gr.addColorStop(0.62,'#ffe08a'); gr.addColorStop(1,'#8a6420'); return gr; }
function cover(g,im,W,H,fx,fy,zoom){ // object-fit: cover with a focus point
  const s=Math.max(W/im.width,H/im.height)*(zoom||1), w=im.width*s, h=im.height*s;
  const x=Math.min(0,Math.max(W-w, W/2-w*(fx==null?0.5:fx))), y=Math.min(0,Math.max(H-h, H/2-h*(fy==null?0.5:fy)));
  g.drawImage(im,x,y,w,h); }
function velvet(g,W,H,strength){ // velvet vignette: burgundy falloff to the House's black, a candle-warm centre
  let r=g.createRadialGradient(W*0.5,H*0.46,Math.min(W,H)*0.15,W*0.5,H*0.5,Math.hypot(W,H)*0.62);
  r.addColorStop(0,'rgba(40,6,14,0)'); r.addColorStop(0.55,'rgba(40,6,14,'+(0.35*strength)+')'); r.addColorStop(1,'rgba(6,2,4,'+(0.96*strength)+')');
  g.fillStyle=r; g.fillRect(0,0,W,H);
  // velvet nap: fine stipple
  let sd=7; const rn=()=>((sd=(sd*1103515245+12345)>>>0)/4294967296);
  g.fillStyle='rgba(255,220,200,0.035)'; for(let i=0;i<W*H/220;i++) g.fillRect(rn()*W,rn()*H,1,1);
}
function grade(g,W,H,dark){ // pull the frame down into noir: darken, push warm
  g.fillStyle='rgba(10,3,6,'+dark+')'; g.fillRect(0,0,W,H);
  g.globalCompositeOperation='soft-light'; g.fillStyle='rgba(139,22,32,0.55)'; g.fillRect(0,0,W,H); g.globalCompositeOperation='source-over'; }
function diamond(g,x,y,r,fill){ g.beginPath(); g.moveTo(x,y-r); g.lineTo(x+r*0.7,y); g.lineTo(x,y+r); g.lineTo(x-r*0.7,y); g.closePath(); g.fillStyle=fill; g.fill(); g.strokeStyle='#120804'; g.lineWidth=Math.max(0.6,r*0.15); g.stroke(); }
function frame(g,W,H){ // the gilt frame: dark bevel, gold band, hairline, corner ornaments
  const u=Math.min(W,H)/100, m=Math.max(4,u*2.6), b=Math.max(2,u*0.9);
  g.save();
  g.strokeStyle='rgba(0,0,0,0.75)'; g.lineWidth=b+u*1.2; g.strokeRect(m,m,W-2*m,H-2*m);
  g.strokeStyle=gildGrad(g,0,0,W,H); g.lineWidth=b; g.shadowColor='rgba(255,190,90,0.55)'; g.shadowBlur=u*2.4; g.strokeRect(m,m,W-2*m,H-2*m); g.shadowBlur=0;
  const m2=m+b+u*0.9; g.strokeStyle='rgba(255,242,192,0.55)'; g.lineWidth=Math.max(0.7,u*0.22); g.strokeRect(m2,m2,W-2*m2,H-2*m2);
  const cr=Math.max(4,u*2.4);
  for(const [x,y] of [[m,m],[W-m,m],[m,H-m],[W-m,H-m]]){ diamond(g,x,y,cr,gildGrad(g,x-cr,y-cr,x+cr,y+cr)); g.beginPath(); g.arc(x,y,cr*0.28,0,6.283); g.fillStyle='#8b1620'; g.fill(); }
  for(const [x,y] of [[W/2,m],[W/2,H-m]]) diamond(g,x,y,cr*0.8,gildGrad(g,x-cr,y-cr,x+cr,y+cr));
  g.restore(); return m2; }
function gildText(g,txt,x,y,size,{weight=800,family='Cinzel',track=0.06,glow=1,align='center'}={}){
  g.save(); g.font=weight+' '+size+'px '+family; g.textAlign='left'; g.textBaseline='alphabetic';
  try{ g.letterSpacing=(size*track)+'px'; }catch(e){}
  const w=g.measureText(txt).width - size*track; let x0=align==='center'?x-w/2:align==='right'?x-w:x;
  // deep shadow, a dark engraved stroke, then the gold leaf and a top highlight
  g.shadowColor='rgba(0,0,0,0.9)'; g.shadowBlur=size*0.18; g.shadowOffsetY=size*0.05;
  g.lineJoin='round'; g.strokeStyle='#1a0a04'; g.lineWidth=Math.max(1.5,size*0.09); g.strokeText(txt,x0,y);
  g.shadowColor='rgba(255,180,70,'+(0.55*glow)+')'; g.shadowBlur=size*0.35*glow; g.shadowOffsetY=0;
  const gr=g.createLinearGradient(0,y-size*0.78,0,y+size*0.06);
  gr.addColorStop(0,'#fffbe6'); gr.addColorStop(0.32,'#ffe08a'); gr.addColorStop(0.52,'#d9a441'); gr.addColorStop(0.56,'#a8782a'); gr.addColorStop(0.8,'#f4c766'); gr.addColorStop(1,'#7a5418');
  g.fillStyle=gr; g.fillText(txt,x0,y); g.shadowBlur=0;
  g.strokeStyle='rgba(255,248,220,0.5)'; g.lineWidth=Math.max(0.5,size*0.012); g.strokeText(txt,x0,y);
  g.restore(); return w; }
function plainText(g,txt,x,y,size,col,{weight=600,family='Cinzel',track=0.18,align='center',italic=false,alpha=1}={}){
  g.save(); g.font=(italic?'italic ':'')+weight+' '+size+'px '+(family==='C'?"'Cormorant Garamond'":family); g.textAlign='left'; g.textBaseline='alphabetic';
  try{ g.letterSpacing=(size*track)+'px'; }catch(e){}
  const w=g.measureText(txt).width-size*track; const x0=align==='center'?x-w/2:align==='right'?x-w:x;
  g.globalAlpha=alpha; g.shadowColor='rgba(0,0,0,0.95)'; g.shadowBlur=size*0.5; g.fillStyle=col; g.fillText(txt,x0,y); g.restore(); return w; }
function rule(g,x,y,w,size){ // ✦ ——— ♠ ——— ✦ divider
  g.save(); const gr=g.createLinearGradient(x-w/2,0,x+w/2,0); gr.addColorStop(0,'rgba(232,182,76,0)'); gr.addColorStop(0.2,'#e8b64c'); gr.addColorStop(0.8,'#e8b64c'); gr.addColorStop(1,'rgba(232,182,76,0)');
  g.strokeStyle=gr; g.lineWidth=Math.max(1,size*0.08); g.beginPath(); g.moveTo(x-w/2,y); g.lineTo(x-size*0.9,y); g.moveTo(x+size*0.9,y); g.lineTo(x+w/2,y); g.stroke();
  g.font='700 '+size+'px serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillStyle='#ffd36b'; g.shadowColor='rgba(255,190,90,0.8)'; g.shadowBlur=size*0.6; g.fillText('♠',x,y+size*0.04); g.restore(); }
function candle(g,x,y,r){ const gr=g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,'rgba(255,200,120,0.45)'); gr.addColorStop(0.4,'rgba(255,150,60,0.14)'); gr.addColorStop(1,'rgba(255,150,60,0)');
  g.globalCompositeOperation='lighter'; g.fillStyle=gr; g.fillRect(x-r,y-r,2*r,2*r); g.globalCompositeOperation='source-over'; }
function portrait(g,im,cx,cy,h){ const w=h*im.width/im.height; candle(g,cx,cy-h*0.05,h*0.75);
  g.save(); g.shadowColor='rgba(0,0,0,0.9)'; g.shadowBlur=h*0.08; g.drawImage(im,cx-w/2,cy-h/2,w,h); g.restore(); return w; }
function lockup(g,cx,top,size,{tag=true,two=false}={}){ // ANTE MORTEM title + tagline
  let y=top+size;
  if(two){ gildText(g,'ANTE',cx,y,size); y+=size*1.0; gildText(g,'MORTEM',cx,y,size); }
  else gildText(g,'ANTE MORTEM',cx,y,size);
  if(tag){ y+=size*0.5; rule(g,cx,y,size*(two?4.6:6.2),size*0.26); y+=size*0.52;
    plainText(g,'THE HOUSE ALWAYS BLEEDS',cx,y,size*0.24,'#f3d9a6',{track:0.32}); }
  return y; }

async function draw(name,W,H,layout){
  const c=document.getElementById('c'); c.width=W; c.height=H; const g=c.getContext('2d');
  const bg=await load(IMG[PICK.bg[name]]), ves=await load(IMG.vesper_portrait), F=PICK.focus[name]||[0.5,0.5,1];
  g.fillStyle='#0a0507'; g.fillRect(0,0,W,H);
  g.save(); g.filter='blur('+Math.max(0.6,Math.min(W,H)/700).toFixed(2)+'px)'; cover(g,bg,W,H,F[0],F[1],F[2]); g.restore(); // a breath of depth: the felt sits behind the gilt
  if(layout==='hero'){
    grade(g,W,H,0.38); velvet(g,W,H,0.9);
    // left third sinks into velvet so the lockup reads
    let lg=g.createLinearGradient(0,0,W*0.62,0); lg.addColorStop(0,'rgba(8,2,5,0.92)'); lg.addColorStop(0.7,'rgba(8,2,5,0.55)'); lg.addColorStop(1,'rgba(8,2,5,0)'); g.fillStyle=lg; g.fillRect(0,0,W,H);
    const m=frame(g,W,H);
    portrait(g,ves,W*0.79,H*0.53,H*0.78);
    const y=lockup(g,W*0.33,H*0.27,H*0.135,{two:true});
    plainText(g,'A gothic casino roguelite',W*0.33,y+H*0.085,H*0.042,'#fff2c0',{family:'C',weight:500,italic:true,track:0.02});
    plainText(g,'SURVIVE THE COURT OF THE DAMNED UNTIL 13:00',W*0.33,y+H*0.145,H*0.021,'#e8b64c',{track:0.24});
    plainText(g,'FAKE CURRENCY ONLY · THE HOUSE PAYS IN NOTHING YOU CAN SPEND',W*0.33,H-m-H*0.035,H*0.0155,'#c9a77a',{track:0.2,alpha:0.85});
  } else if(layout==='social'){
    grade(g,W,H,0.18); velvet(g,W,H,0.72);
    let lg=g.createLinearGradient(0,0,W*0.7,0); lg.addColorStop(0,'rgba(8,2,5,0.9)'); lg.addColorStop(0.75,'rgba(8,2,5,0.45)'); lg.addColorStop(1,'rgba(8,2,5,0)'); g.fillStyle=lg; g.fillRect(0,0,W,H);
    const m=frame(g,W,H);
    portrait(g,ves,W*0.8,H*0.52,H*0.8);
    const y=lockup(g,W*0.355,H*0.13,H*0.15,{two:true});
    plainText(g,'A gothic casino roguelite — free in your browser',W*0.355,y+H*0.1,H*0.046,'#fff2c0',{family:'C',weight:500,italic:true,track:0.01});
    plainText(g,'SLOTS · DICE · A WHEEL OF SOULS · THE HOUSE AT 13:00',W*0.355,y+H*0.18,H*0.024,'#e8b64c',{track:0.2});
    plainText(g,'FAKE CURRENCY ONLY',W*0.355,H-m-H*0.05,H*0.022,'#8bffd0',{track:0.32,alpha:0.9});
  } else if(layout==='wide'){ // steam capsules: art right, logo left-centre, very legible
    grade(g,W,H,0.12); velvet(g,W,H,0.62);
    let lg=g.createLinearGradient(0,0,W*0.7,0); lg.addColorStop(0,'rgba(8,2,5,0.7)'); lg.addColorStop(0.7,'rgba(8,2,5,0.25)'); lg.addColorStop(1,'rgba(8,2,5,0)'); g.fillStyle=lg; g.fillRect(0,0,W,H);
    const m=frame(g,W,H), ph=H*0.8, pw=ph*ves.width/ves.height, pcx=W-m-pw/2-Math.min(W,H)*0.03;
    portrait(g,ves,pcx,H*0.52,ph);
    lockup(g,(m+pcx-pw/2)/2+Math.min(W,H)*0.01,H*0.15,Math.min(H*0.2,(pcx-pw/2-m)*0.165),{two:true,tag:true});
  } else { // tall: itch covers — portrait centre, lockup over the lower third
    grade(g,W,H,0.12); velvet(g,W,H,0.66);
    let bgr=g.createLinearGradient(0,H*0.4,0,H); bgr.addColorStop(0,'rgba(8,2,5,0)'); bgr.addColorStop(0.5,'rgba(8,2,5,0.7)'); bgr.addColorStop(1,'rgba(8,2,5,0.9)'); g.fillStyle=bgr; g.fillRect(0,0,W,H);
    frame(g,W,H);
    portrait(g,ves,W*0.5,H*0.37,H*0.6);
    lockup(g,W*0.5,H*0.6,H*0.13,{two:false,tag:true});
  }
  return true;
}
window.__draw=draw;
</script></body></html>`;

(async () => {
  fs.writeFileSync(path.join(__dirname, 'compose.html'), PAGE);
  const browser = await chromium.launch();
  const errs = [];
  for (const [name, W, H, layout] of OUTS) {
    const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    page.on('pageerror', e => errs.push(name + ': ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errs.push(name + ': ' + m.text()); });
    await page.goto('file://' + path.join(__dirname, 'compose.html'));
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(async () => { await document.fonts.load("800 40px Cinzel"); await document.fonts.load("600 40px Cinzel"); await document.fonts.load("italic 500 40px 'Cormorant Garamond'"); });
    await page.evaluate(([n, w, h, l]) => window.__draw(n, w, h, l), [name, W, H, layout]);
    await (await page.$('#c')).screenshot({ path: path.join(L, name + '.png') });
    console.error('  ✓ ' + name);
    await page.close();
  }
  // the phone screenshot: the portrait night on velvet, inside a 1920×1080 gilt plate
  {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    page.on('pageerror', e => errs.push('phone: ' + e.message));
    await page.goto('file://' + path.join(__dirname, 'compose.html'));
    await page.evaluate(async () => { await document.fonts.load("800 40px Cinzel"); await document.fonts.load("600 40px Cinzel"); await document.fonts.load("italic 500 40px 'Cormorant Garamond'"); });
    await page.evaluate(async () => {
      const W = 1920, H = 1080, c = document.getElementById('c'); c.width = W; c.height = H; const g = c.getContext('2d');
      const ph = await load(IMG.phone_play), ves = await load(IMG.vesper_portrait);
      g.fillStyle = '#0a0507'; g.fillRect(0, 0, W, H);
      g.save(); g.filter = 'blur(28px) brightness(0.45)'; cover(g, ph, W, H, 0.5, 0.5, 1.1); g.restore();
      velvet(g, W, H, 1); const m = frame(g, W, H);
      // the handset: a dark bezel around the real 1170×2532 frame
      const ih = H * 0.84, iw = ih * ph.width / ph.height, x = W * 0.36 - iw / 2, y = (H - ih) / 2, r = iw * 0.11;
      const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
      g.save(); g.shadowColor = 'rgba(255,170,70,0.35)'; g.shadowBlur = 60; rr(x - 14, y - 14, iw + 28, ih + 28, r + 12); g.fillStyle = '#0c0608'; g.fill(); g.restore();
      rr(x - 14, y - 14, iw + 28, ih + 28, r + 12); g.strokeStyle = gildGrad(g, x, y, x + iw, y + ih); g.lineWidth = 4; g.stroke();
      g.save(); rr(x, y, iw, ih, r); g.clip(); g.drawImage(ph, x, y, iw, ih); g.restore();
      const cx = W * 0.695;
      gildText(g, 'IN YOUR POCKET', cx, H * 0.36, 62);
      rule(g, cx, H * 0.415, 560, 22);
      plainText(g, 'Thumb stick, a gold BET coin, phone layouts.', cx, H * 0.49, 40, '#fff2c0', { family: 'C', weight: 500, italic: true, track: 0.01 });
      plainText(g, 'Add it to your home screen — it plays offline.', cx, H * 0.545, 40, '#fff2c0', { family: 'C', weight: 500, italic: true, track: 0.01 });
      plainText(g, 'ONE FILE · ANY BROWSER · FAKE CURRENCY ONLY', cx, H * 0.62, 21, '#e8b64c', { track: 0.26 });
      portrait(g, ves, cx, H * 0.8, H * 0.22);
    });
    await (await page.$('#c')).screenshot({ path: path.join(RAW, 'phone_plate.png') });
    console.error('  ✓ phone_plate');
    await page.close();
  }
  await browser.close();
  // screenshots: the chosen raw frames → launch/screenshots/NN_name.jpg (q92: store-grade, repo-sized)
  const SS = path.join(L, 'screenshots'); fs.mkdirSync(SS, { recursive: true });
  for (const f of fs.readdirSync(SS)) fs.unlinkSync(path.join(SS, f));
  PICK.screens.forEach(([raw, out], i) => {
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', path.join(RAW, raw + '.png'), '-q:v', '2', path.join(SS, String(i + 1).padStart(2, '0') + '_' + out + '.jpg')]);
    console.error('  ✓ screenshots/' + String(i + 1).padStart(2, '0') + '_' + out + '.jpg');
  });
  console.log(JSON.stringify({ errors: errs }, null, 1));
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
