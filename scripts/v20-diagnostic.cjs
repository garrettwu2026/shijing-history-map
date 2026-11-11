// Reproducible localhost visual matrix and independent clarity experiments.
const {chromium}=require('playwright'),fs=require('node:fs');
const mode=process.argv[2]||'baseline',base=process.env.BASE_URL||'http://localhost:8000/dist';
const ready=p=>p.waitForFunction(()=>window.historyMap&&window.historyState?.layer&&!window.historyState.boundariesPending&&document.querySelector('#map-status').hidden);
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const results=[];
try{if(mode==='screens'||mode==='after-screens'){
 const dir=mode==='screens'?'baseline':'after';fs.mkdirSync(`artifacts/v20-${dir}`,{recursive:true});
 for(const [width,height] of [[1280,800],[390,844],[320,844]]){const c=await browser.newContext({viewport:{width,height},isMobile:width<760,hasTouch:width<760}),p=await c.newPage();
 for(const year of [-10000,-300,1500,1900]){await p.goto(`${base}/?year=${year}`);await ready(p);for(const zoom of [1.25,3,5,8]){await p.evaluate(z=>window.historyMap.jumpTo({center:z<4?[45,26]:[18,38],zoom:z}),zoom);await p.waitForTimeout(900);await p.waitForFunction(()=>window.historyMap.loaded());if(dir==='after')await p.waitForFunction(()=>!window.historyDetailPending);await p.screenshot({path:`artifacts/v20-${dir}/${width}-${year}-z${zoom}.png`});}}
 await c.close();}return;}
 const variants=mode==='diagnostic'?['no-detail','no-detail-no-coast','no-detail-no-pattern','no-detail-old-symbol']:mode==='paired'?['original','final']:mode==='baseline'?['original','ratio1','aa']:['final'];
 for(const variant of variants)for(const width of (mode==='diagnostic'?[1280]:[1280,390]))for(let run=0;run<(mode==='diagnostic'?1:5);run++){
 const c=await browser.newContext({viewport:{width,height:width===390?844:800},isMobile:width===390,hasTouch:width===390});
 if(mode==='diagnostic')await c.route('**/detail/**',r=>r.abort());
 if(mode!=='diagnostic'&&variant!=='original'&&variant!=='final')await c.route('**/modules/map*.js',async route=>{const r=await route.fetch();let s=await r.text();if(variant==='ratio1')s=s.replace("matches?1:.75","matches?1:1");if(variant==='aa')s=s.replaceAll("'fill-antialias':false","'fill-antialias':true");await route.fulfill({response:r,body:s});});
 const p=await c.newPage(),cdp=await c.newCDPSession(p);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
 await p.addInitScript(()=>{window.v20frames=[];window.v20long=[];window.v20stage='cold';new PerformanceObserver(l=>window.v20long.push(...l.getEntries().map(e=>({stage:window.v20stage,ms:e.duration})))).observe({type:'longtask'});let last;requestAnimationFrame(function frame(t){if(last&&window.v20stage!=='cold')window.v20frames.push({stage:window.v20stage,ms:t-last});last=t;requestAnimationFrame(frame);});});
 const runBase=mode==='paired'&&variant==='original'?'http://localhost:8025/artifacts/v20-original-project/dist':base;await p.goto(`${runBase}/?year=1500`);await ready(p);await p.waitForFunction(()=>window.historyMap.loaded());const cold=await p.evaluate(()=>performance.now());if(mode==='diagnostic')await p.evaluate(v=>{if(v==='no-detail-no-coast')historyMap.setPaintProperty('coast-line','line-width',0);if(v==='no-detail-no-pattern')historyMap.setLayoutProperty('culture-pattern','visibility','none');if(v==='no-detail-old-symbol'){historyMap.setFilter('polity-labels',null);historyMap.setLayoutProperty('polity-labels','text-padding',8);historyMap.setPaintProperty('polity-labels','text-halo-width',2);}},variant);
 await p.evaluate(()=>{window.v20stage='zoom';window.historyMap.easeTo({center:[18,38],zoom:5,duration:1000});});await p.waitForTimeout(1500);await p.waitForFunction(()=>!window.historyDetailPending);
 await p.evaluate(()=>{window.v20stage='pan';window.historyMap.panBy([180,70],{duration:800});});await p.waitForTimeout(1000);
 await p.evaluate(()=>{window.v20stage='release';const el=document.querySelector('#year-input');el.value=1900;el.form.requestSubmit();});await ready(p);await p.waitForFunction(()=>!window.historyDetailPending);await p.waitForTimeout(350);
 await p.evaluate(()=>window.v20stage='play');await p.locator('#play-button').click();await p.waitForTimeout(1400);await p.locator('#play-button').click();
 const record=await p.evaluate(()=>{const stats=a=>{const x=a.sort((a,b)=>a-b);return {p95:x[Math.floor(x.length*.95)]||0,longFrames:x.filter(t=>t>50).length,max:Math.max(0,...x),n:x.length}};return {interaction:stats(window.v20frames.map(x=>x.ms)),stages:Object.fromEntries(['zoom','pan','release','play'].map(s=>[s,stats(window.v20frames.filter(x=>x.stage===s).map(x=>x.ms))])),longTasks:window.v20long,detail:window.historyDetailMetrics||null};});
 results.push({variant,width,run,cold,...record});fs.writeFileSync(`artifacts/v20-${mode}-perf.json`,JSON.stringify(results,null,2));console.log(variant,width,run,Math.round(cold),record.interaction.p95.toFixed(1));await c.close();
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
