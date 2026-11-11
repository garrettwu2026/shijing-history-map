// The 320px zoom-8 view must include coastline: use the Strait of Messina.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{for(const kind of ['baseline','after'])for(const width of [1280,390,320]){
 const c=await b.newContext({viewport:{width,height:width===1280?800:844},isMobile:width<760,hasTouch:width<760}),p=await c.newPage();
 const base=kind==='baseline'?'http://localhost:8025/artifacts/v20-original-project/dist':'http://localhost:8025/dist';
 for(const year of [-10000,-300,1500,1900]){
  await p.goto(`${base}/?year=${year}`);await p.waitForFunction(()=>window.historyState?.layer&&!historyState.boundariesPending&&document.querySelector('#map-status').hidden);
  await p.evaluate(()=>historyMap.jumpTo({center:[15.65,38.15],zoom:8}));await p.waitForTimeout(900);await p.waitForFunction(()=>historyMap.loaded());
  if(kind==='after')await p.waitForFunction(()=>historyMap.detailDisplayed&&!historyDetailPending);
  await p.screenshot({path:`artifacts/v20-${kind}/${width}-${year}-z8.png`});
 }await c.close();console.log(kind,width);
}}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
