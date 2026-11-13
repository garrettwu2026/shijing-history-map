// Same local HTTP origin, fresh cache per run, stable viewport and software GPU.
const {chromium}=require('playwright'),fs=require('node:fs');
const phase=process.argv[2]||'after',base=process.env.BASE_URL||'http://localhost:8025/dist';
(async()=>{const b=await chromium.launch({args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}),rows=[];try{
for(const width of [1280,390,320])for(let run=0;run<5;run++){
const variants=process.env.V21_PAIR_BASE?(run%2?['after','baseline']:['baseline','after']):[phase];
for(const variant of variants){
const c=await b.newContext({viewport:{width,height:width===1280?800:width===390?844:568},isMobile:width<760,hasTouch:width<760}),p=await c.newPage(),cdp=await c.newCDPSession(p);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
await p.addInitScript(()=>{window.uiFirst=0;new MutationObserver(()=>{if(!uiFirst&&window.historyState?.layer&&!historyState.boundariesPending&&document.querySelector('#map-status')?.hidden)requestAnimationFrame(()=>requestAnimationFrame(()=>window.uiFirst ||= performance.now()))}).observe(document,{subtree:true,childList:true,characterData:true,attributes:true});});
await p.goto((variant==='baseline'?process.env.V21_PAIR_BASE:base)+'/?year=1500');await p.waitForFunction(()=>window.uiFirst>0);const cold=await p.evaluate(()=>uiFirst);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(800);
const initialFonts=await p.evaluate(()=>performance.getEntriesByType('resource').filter(e=>e.name.endsWith('.woff2')).map(e=>({name:e.name.split('/').at(-1),bytes:e.transferSize,start:e.startTime,duration:e.duration})));
const stages={};for(const stage of ['panZoom','release','playback']){
await p.evaluate(()=>{window.uiFrames=[];let last;window.uiRAF=requestAnimationFrame(function frame(t){if(last)uiFrames.push(t-last);last=t;window.uiRAF=requestAnimationFrame(frame)});});
if(stage==='panZoom')await p.evaluate(()=>{historyMap.easeTo({center:[18,38],zoom:3,duration:1200});});
if(stage==='release')await p.locator('#year-slider').evaluate(e=>{e.value=750;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));});
if(stage==='playback')await p.locator('#play-button').click();
await p.waitForTimeout(stage==='playback'?2400:1600);
stages[stage]=await p.evaluate(()=>{cancelAnimationFrame(uiRAF);return uiFrames;});if(stage==='playback')await p.locator('#play-button').click();
}
const fonts=await p.evaluate(()=>performance.getEntriesByType('resource').filter(e=>e.name.endsWith('.woff2')).map(e=>({name:e.name.split('/').at(-1),bytes:e.transferSize,start:e.startTime,duration:e.duration})));
rows.push({variant,browser:b.version(),width,run,cold,stages,initialFonts,fonts});fs.writeFileSync(`artifacts/v21-perf-${phase}.json`,JSON.stringify(rows,null,2));console.log(variant,width,run,cold.toFixed(1));await c.close();
}
}
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
