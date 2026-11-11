// Verify interaction after detail has actually loaded, not just during first zoom.
const {chromium}=require('playwright'),fs=require('node:fs');
(async()=>{const b=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}),rows=[];
try{for(const variant of ['original','final'])for(const width of [1280,390])for(const zoom of [5,8])for(let run=0;run<3;run++){
 const c=await b.newContext({viewport:{width,height:width===390?844:800},isMobile:width===390,hasTouch:width===390}),p=await c.newPage();
 await p.goto((variant==='original'?'http://localhost:8025/artifacts/v20-original-project/dist':'http://localhost:8025/dist')+'/?year=1500');await p.waitForFunction(()=>window.historyState?.layer&&!window.historyState.boundariesPending);
 await p.evaluate(zoom=>{historyMap.jumpTo({center:zoom>=7?[15.65,38.15]:[18,38],zoom});},zoom);
 if(variant==='final')await p.waitForFunction(()=>historyDetailMetrics.applied.length&&historyMap.detailDisplayed);
 await p.waitForFunction(()=>historyMap.loaded());await p.waitForTimeout(800);
 await p.evaluate(()=>{window.frames=[];window.tasks=[];new PerformanceObserver(l=>tasks.push(...l.getEntries().map(e=>e.duration))).observe({type:'longtask'});let last;requestAnimationFrame(function frame(t){if(last)frames.push(t-last);last=t;window.frame=requestAnimationFrame(frame);});historyMap.panBy([180,70],{duration:1200});});await p.waitForTimeout(1400);
 const result=await p.evaluate(()=>{cancelAnimationFrame(frame);const xs=frames.sort((a,b)=>a-b);return {p95:xs[Math.floor(xs.length*.95)],longFrames:xs.filter(x=>x>50).length,max:Math.max(...xs),longTasks:tasks,detail:window.historyDetailMetrics||null};});
 rows.push({variant,width,zoom,run,...result});console.log(variant,width,zoom,run,result.p95.toFixed(1));fs.writeFileSync('artifacts/v20-settled-perf.json',JSON.stringify(rows,null,2));await c.close();
}}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
