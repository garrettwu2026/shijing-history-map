// Build dist and serve the repository on port 8000 before running.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');
const base=process.env.BASE_URL||'http://localhost:8000/dist';
const recoveryTimeout=60000;
const waitForReady=page=>page.waitForFunction(()=>
 document.querySelector('#map-status').hidden&&
 document.querySelector('#snapshot-label').textContent.startsWith('疆界快照：')&&
 !document.querySelector('#polity-open').disabled,null,{timeout:recoveryTimeout});
(async()=>{const browser=await chromium.launch({args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader'],headless:true});const report={base,checks:[],errors:[]};
try{
fs.mkdirSync('artifacts',{recursive:true});
for(const [width,height] of [[1440,900],[390,844],[320,568]]){
 const context=await browser.newContext({viewport:{width,height},isMobile:width<760,hasTouch:width<760});const page=await context.newPage();
 page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});page.on('pageerror',e=>report.errors.push(e.stack));
 await page.goto(base+'/?year=1200');await page.waitForFunction(()=>document.querySelector('#snapshot-label').textContent.startsWith('疆界快照：'));
 assert((await page.locator('#boundary-warning').getAttribute('title')).includes('蒙古疆界待查證'));
 await page.screenshot({path:`artifacts/v9-${width}x${height}.png`});
 await page.screenshot({path:`artifacts/v9-${width}x${height}-overview.png`});
 const dockBox=await page.locator('.time-dock').boundingBox();assert(dockBox.height<=72,'timeline <=72px');
 const toolbar=await page.locator('.map-toolbar').boundingBox(),zoom=await page.locator('.maplibregl-ctrl-group').boundingBox(),events=await page.locator('.events-panel').boundingBox();
 const overlaps=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
 assert(!overlaps(toolbar,zoom),'toolbar clear of zoom');assert(!overlaps(events,toolbar)&&!overlaps(events,zoom),'events clear of controls');
 if(width===1440){assert.equal(Math.round((await page.locator('.time-dock').boundingBox()).height),62);}

 await page.locator('#time-options-toggle').click();await page.locator('#year-next').click();assert((await page.locator('#year-display').innerText()).includes('1,201'));await page.locator('#snapshot-next').click();await page.locator('#time-options-toggle').click();
 await page.locator('#polity-open').click();await page.locator('#polity-search').fill('不存在的名稱abcdef');assert((await page.locator('#polity-list').innerText()).includes('找不到'));await page.locator('#polity-close').click();
 const select=async year=>{await page.locator('#year-input').evaluate((el,y)=>{el.value=y;el.form.requestSubmit()},String(year));await page.waitForFunction(()=>document.querySelector('#map-status').hidden&&document.querySelector('#snapshot-label').textContent.startsWith('疆界快照：'));};
 await select(-5000);await page.locator('#time-options-toggle').click();assert(await page.locator('#snapshot-prev').isDisabled(),'no snapshot before supported range');await page.locator('#snapshot-next').click();assert(Number(await page.locator('#year-input').inputValue())>-5000);await page.locator('#time-options-toggle').click();
 await select(1200);await page.locator('#boundary-warning').click();assert(await page.locator('#boundary-warning-text').isVisible());await page.locator('#boundary-warning').click();
 const caption=await page.locator('#boundary-indicator').evaluate(el=>({fits:el.scrollWidth<=el.clientWidth,text:el.textContent}));assert(caption.fits&&caption.text.includes('1200'),'boundary year readable');
 await page.locator('#polity-open').click();await page.locator('#polity-search').fill('蒙古各部');await page.locator('#polity-list button').first().click();
 const selection=await page.evaluate(()=>window.politySelection);assert(selection.count>=1&&selection.highlighted);assert(selection.view[0][0]<=selection.bounds[0][0]&&selection.view[1][0]>=selection.bounds[1][0],'fit latitude');assert(selection.view[0][1]<=selection.bounds[0][1]&&selection.view[1][1]>=selection.bounds[1][1],'fit longitude');assert(selection.anchor[0]>=selection.bounds[0][0]&&selection.anchor[0]<=selection.bounds[1][0]);assert(selection.anchor[1]>=selection.bounds[0][1]&&selection.anchor[1]<=selection.bounds[1][1]);
 await page.keyboard.press('Escape');
 await select(1400);assert((await page.locator('#event-list').textContent()).includes('英法百年戰爭'),'range intersects despite distant start');
 for(const [year,name] of [[1945,'比屬剛果'],[1960,'剛果共和國（利奧波德維爾）'],[2000,'剛果民主共和國']]){
  await select(year);await page.locator('#polity-open').click();await page.locator('#polity-search').fill(name);await page.locator('#polity-list button').filter({hasText:name}).first().click();const text=await page.locator('.maplibregl-popup-content').last().innerText();assert(text.includes(name));assert(!text.includes('穩定 ID'));assert(!text.includes('譯名可信度'));await page.keyboard.press('Escape');
 }
 await select(2026);assert((await page.locator('#boundary-indicator').innerText()).includes('疆界年 2010'));
 if(width<760)await page.locator('#sheet-toggle').click();await page.locator('.event-item').first().click();
 await page.waitForTimeout(300);const popup=await page.locator('.maplibregl-popup-content').last().boundingBox(),dock=await page.locator('.time-dock').boundingBox();assert(popup.y>=0&&popup.y+popup.height<dock.y+2,'popup clear of timeline');assert(await page.locator('.map-toolbar').evaluate(el=>getComputedStyle(el).visibility==='hidden'));
 await page.locator('#year-slider').focus();await page.keyboard.press('ArrowLeft');assert((await page.locator('#year-display').innerText()).includes('2,025'),'keyboard steps exactly one year');assert.equal(await page.evaluate(()=>document.activeElement.id),'year-slider');await page.waitForTimeout(600);assert.equal(await page.evaluate(()=>document.activeElement.id),'year-slider');
 await page.screenshot({path:`artifacts/v9-${width}x${height}-detail.png`});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 const small=await page.evaluate(()=>[...document.querySelectorAll('button,input,select,a')].filter(el=>el.getClientRects().length&&getComputedStyle(el).visibility==='visible').map(el=>({id:el.id||el.className,r:el.getBoundingClientRect()})).filter(x=>x.r.width<43.9||x.r.height<43.9).map(x=>({id:x.id,w:x.r.width,h:x.r.height})));
 assert.deepEqual(small,[],'44px controls');report.checks.push({width,height,caption:true,names:true,focus:true,popupClear:true,targets44:true});await context.close();
}
// Verify all fragments of an identity and an actual interior popup anchor.
{
 const context=await browser.newContext({viewport:{width:1440,height:900}});const page=await context.newPage();
 await page.goto(base+'/?year=1700');await page.waitForFunction(()=>document.querySelector('#map-status').hidden);
 const data=await page.evaluate(async()=>{const code=await (await fetch(document.querySelector('script[type="module"]').src)).text();const manifest=code.match(/snapshots\.[a-f0-9]+\.json/)[0],catalog=code.match(/polities\.[a-f0-9]+\.json/)[0];const rows=await(await fetch('data/'+manifest)).json(),cat=await(await fetch('data/'+catalog)).json();const snapshot=await(await fetch('data/'+rows.find(r=>r.year===1700).file)).json();const groups=new Map();for(const f of snapshot.features){const id=cat.index[f.properties.NAME];if(!id)continue;if(!groups.has(id))groups.set(id,[]);groups.get(id).push(f);}const [id,features]=[...groups].filter(([id,fs])=>fs.length>1&&cat.polities[id].importance>=8).sort((a,b)=>b[1].length-a[1].length)[0];return {id,features,name:cat.polities[id].zh};});
 await page.locator('#polity-open').click();await page.locator('#polity-search').fill(data.name);await page.locator('#polity-list button').first().click();const selected=await page.evaluate(()=>window.politySelection);assert.equal(selected.id,data.id);assert.equal(selected.count,data.features.length);assert(selected.highlighted);
 const inside=(p,r)=>{let c=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};const point=[selected.anchor[1],selected.anchor[0]];assert(data.features.some(f=>(f.geometry.type==='MultiPolygon'?f.geometry.coordinates:[f.geometry.coordinates]).some(p=>inside(point,p[0])&&!p.slice(1).some(r=>inside(point,r)))),'popup inside selected territory');
 await page.keyboard.press('Escape');await page.locator('.event-item').first().evaluate(el=>{window.savedEvent=el;el.focus();document.querySelector('#event-list').scrollTop=30;window.savedScroll=document.querySelector('#event-list').scrollTop;});await page.evaluate(()=>window.dispatchEvent(new Event('resize')));await page.waitForTimeout(300);assert(await page.evaluate(()=>window.savedEvent.isConnected&&document.activeElement===window.savedEvent&&document.querySelector('#event-list').scrollTop===window.savedScroll));report.checks.push({combinedFeatures:selected.count,interiorAnchor:true,eventRowPreserved:true});await context.close();
}
// Block only neutral baseline once; historical snapshots still render, retry works.
const context=await browser.newContext();const page=await context.newPage();let failed=false;
await context.route('**/data/world_2010*',route=>{if(!failed){failed=true;return route.abort();}return route.continue()});
await page.goto(base+'/?year=1200');await page.waitForFunction(()=>document.querySelector('#snapshot-label').textContent.startsWith('疆界快照：'));await page.waitForFunction(()=>!document.querySelector('#baseline-status').hidden);await page.locator('#baseline-retry').click();await page.waitForFunction(()=>document.querySelector('#baseline-status').hidden&&window.historyMap?.isSourceLoaded('land'));report.checks.push({baselineIndependent:true,retry:true});await context.close();
// Independent metadata/event recovery and Worker recreation.
for(const filename of ['polities','snapshots','events']){
 const context=await browser.newContext();const page=await context.newPage();let blocked=false;
 await context.route(`**/data/${filename}.*.json*`,route=>{if(!blocked){blocked=true;return route.abort();}return route.continue();});
 await page.goto(base+'/?year=1200');
 const label={polities:'政體目錄',snapshots:'快照目錄',events:'事件'}[filename];
 const retry=page.getByRole('button',{name:'重試'+label,exact:true});
 await retry.waitFor({state:'visible',timeout:recoveryTimeout});assert(blocked,'request was actually blocked');
 // Events load independently. Let initialization consume its empty fallback first,
 // so a fast retry cannot be overwritten by the initial Promise.all result.
 if(filename==='events')await waitForReady(page);
 await retry.click({timeout:recoveryTimeout});
 await retry.waitFor({state:'detached',timeout:recoveryTimeout});
 await waitForReady(page);
 await page.waitForFunction(()=>document.querySelectorAll('.event-item').length>0&&document.querySelectorAll('#data-retries button').length===0,null,{timeout:recoveryTimeout});
 assert.equal(await page.locator('#data-retries button').count(),0);report.checks.push({retry:filename});await context.close();
}
{
 const context=await browser.newContext();await context.addInitScript(()=>{const Native=window.Worker;window.workerStarts=0;window.Worker=class extends Native{constructor(...args){super(...args);this.isData=String(args[0]).includes('data-worker');if(this.isData)window.workerStarts++;}postMessage(...args){if(this.isData&&window.workerStarts===1){if(!this.failed){this.failed=true;setTimeout(()=>this.dispatchEvent(new Event('error')),0);}return;}return super.postMessage(...args);}};});const page=await context.newPage();await page.goto(base+'/?year=1200');await page.locator('#data-retries button').first().waitFor();await page.waitForFunction(()=>window.workerStarts>=2);for(let i=0;i<5&&await page.locator('#data-retries button').count();i++)await page.locator('#data-retries button').first().click();await page.waitForFunction(()=>document.querySelector('#snapshot-label').textContent.startsWith('疆界快照：'));report.checks.push({workerRestart:true});await context.close();
}
assert.deepEqual(report.errors,[]);fs.writeFileSync('artifacts/v9-browser-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
