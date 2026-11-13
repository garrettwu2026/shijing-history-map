// TASK25 layout acceptance, in addition to all unchanged historic verifiers.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.BASE_URL||'http://localhost:8025/dist';
const ready=p=>p.waitForFunction(()=>window.historyState?.layer&&!historyState.boundariesPending&&document.querySelector('#map-status').hidden);
(async()=>{const b=await chromium.launch({args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}),report=[];
try{for(const [width,height] of [[1280,800],[390,844],[320,568]]){
 const p=await b.newPage({viewport:{width,height}});await p.goto(base+'/?year=1500');await ready(p);await p.evaluate(()=>document.fonts.ready);
 const cdp=await p.context().newCDPSession(p);await cdp.send('DOM.enable');await cdp.send('CSS.enable');const {root}=await cdp.send('DOM.getDocument');
 const fonts={};for(const [selector,family] of [['.brand>span:last-child','Noto Serif TC'],['#year-display','Noto Sans TC']]){const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:root.nodeId,selector});fonts[selector]=(await cdp.send('CSS.getPlatformFontsForNode',{nodeId})).fonts;assert(fonts[selector].some(f=>f.familyName.startsWith(family)&&f.isCustomFont&&f.glyphCount>0),`${width}: actual ${family}`);}
 const overflow=()=>p.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert(!await overflow());
 await p.locator('#intro-toggle').click();
 const collision=await p.evaluate(()=>{const r=s=>document.querySelector(s).getBoundingClientRect(),a=r('.intro-card'),b=r('.map-toolbar'),c=r('.maplibregl-ctrl-top-left'),d=r('.compass');const overlap=(a,b)=>a.width&&b.width&&a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom;return overlap(a,b)||overlap(a,c)||(getComputedStyle(document.querySelector('.compass')).display!=='none'&&overlap(c,d));});assert(!collision,`${width}: intro/tools collision`);await p.locator('#intro-toggle').click();
 if(width<760)await p.locator('#sheet-toggle').click();
 const visible=await p.evaluate(()=>{const list=document.querySelector('#event-list').getBoundingClientRect();return [...document.querySelectorAll('.event-item')].filter(e=>{const r=e.getBoundingClientRect();return r.top>=list.top-1&&r.bottom<=list.bottom+1}).length;});assert(visible>=(width===1280?3:1),`${width}: complete events ${visible}`);
 if(width<760)await p.locator('#sheet-toggle').click();await p.locator('#time-options-toggle').click();
 const ticks=await p.locator('.timeline-ticks span').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {text:e.textContent,left:r.left,right:r.right,top:r.top,bottom:r.bottom}}));
 assert(ticks.every(r=>r.left>=0&&r.right<=width),`${width}: tick clipping`);for(let i=0;i<ticks.length;i++)for(let j=i+1;j<ticks.length;j++){const a=ticks[i],c=ticks[j];assert(!(a.left<c.right&&c.left<a.right&&a.top<c.bottom&&c.top<a.bottom),`${width}: ticks ${a.text}/${c.text}`);}
 const targets=await p.locator('#time-options button,#time-options select,#time-options input,#play-button,#time-options-toggle,.map-toolbar button').evaluateAll(es=>es.filter(e=>e.getClientRects().length).map(e=>({id:e.id,w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height})));assert(targets.every(r=>r.w>=44&&r.h>=44),JSON.stringify(targets));assert(!await overflow());
 await p.locator('#time-options-toggle').click();await p.locator('#polity-open').click();await p.locator('#polity-scope').selectOption('all');await p.locator('#polity-search').fill('漢朝');await p.locator('#polity-list button').first().waitFor();assert(await p.locator('#polity-list button').evaluateAll(es=>es.every(e=>e.scrollHeight<=e.clientHeight+2)),`${width}: search item text fits`);await p.locator('#polity-list button').first().click();await p.locator('.read-full').click();
 assert.equal(await p.locator('#reading-content .popup-title').count(),1);assert.equal(await p.locator('#reading-title').innerText(),'完整閱讀');
 const reader=await p.locator('#reading-content').evaluate(e=>{e.scrollTop=e.scrollHeight;return {reachable:e.scrollTop+e.clientHeight>=e.scrollHeight-1,overflow:e.scrollWidth>e.clientWidth,text:e.textContent.length}});assert(reader.reachable&&!reader.overflow&&reader.text>100);
 report.push({width,height,fonts,completeVisibleEvents:visible,ticks,targets,reader});await p.close();
}fs.writeFileSync('artifacts/v21-ui-acceptance.json',JSON.stringify(report,null,2));console.log('TASK25 layout and font acceptance passed');}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
