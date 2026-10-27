// Build dist and serve the repository on port 8000 before running.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');
const base=process.env.BASE_URL||'http://localhost:8000/dist';
(async()=>{const browser=await chromium.launch({args:['--no-sandbox'],headless:true});const report={base,checks:[],errors:[]};
try{
fs.mkdirSync('artifacts',{recursive:true});
for(const [width,height] of [[1440,900],[390,844],[320,568]]){
 const context=await browser.newContext({viewport:{width,height},isMobile:width<760,hasTouch:width<760});const page=await context.newPage();
 page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(base+'/?year=1200');await page.waitForFunction(()=>document.querySelector('#snapshot-label').textContent.startsWith('疆界快照：'));
 assert((await page.locator('#boundary-indicator').innerText()).includes('蒙古疆界待查證'));
 await page.screenshot({path:`artifacts/v8-${width}x${height}.png`});
 await page.screenshot({path:`artifacts/v8-${width}x${height}-overview.png`});
 const dockBox=await page.locator('.time-dock').boundingBox();assert(dockBox.height<=72,'timeline <=72px');
 const toolbar=await page.locator('.map-toolbar').boundingBox(),zoom=await page.locator('.leaflet-control-zoom').boundingBox(),events=await page.locator('.events-panel').boundingBox();
 const overlaps=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
 assert(!overlaps(toolbar,zoom),'toolbar clear of zoom');assert(!overlaps(events,toolbar)&&!overlaps(events,zoom),'events clear of controls');
 if(width===1440){assert.equal(Math.round((await page.locator('.time-dock').boundingBox()).height),62);}

 await page.locator('#time-options-toggle').click();await page.locator('#year-next').click();assert((await page.locator('#year-display').innerText()).includes('1,201'));await page.locator('#snapshot-next').click();await page.locator('#time-options-toggle').click();
 await page.locator('#polity-open').click();await page.locator('#polity-search').fill('不存在的名稱abcdef');assert((await page.locator('#polity-list').innerText()).includes('找不到'));await page.locator('#polity-close').click();
 const select=async year=>{await page.locator('#year-input').evaluate((el,y)=>{el.value=y;el.form.requestSubmit()},String(year));await page.waitForFunction(()=>document.querySelector('#map-status').hidden&&document.querySelector('#snapshot-label').textContent.startsWith('疆界快照：'));};
 await select(1400);assert((await page.locator('#event-list').textContent()).includes('英法百年戰爭'),'range intersects despite distant start');
 for(const [year,name] of [[1945,'比屬剛果'],[1960,'剛果共和國（利奧波德維爾）'],[2000,'剛果民主共和國']]){
  await select(year);await page.locator('#polity-open').click();await page.locator('#polity-search').fill(name);await page.locator('#polity-list button').filter({hasText:name}).first().click();const text=await page.locator('.leaflet-popup-content').last().innerText();assert(text.includes(name));assert(!text.includes('穩定 ID'));assert(!text.includes('譯名可信度'));await page.keyboard.press('Escape');
 }
 await select(2026);assert((await page.locator('#boundary-indicator').innerText()).includes('2026 → 疆界 2010'));
 if(width<760)await page.locator('#sheet-toggle').click();await page.locator('.event-item').first().click();
 await page.waitForTimeout(300);const popup=await page.locator('.leaflet-popup-content').last().boundingBox(),dock=await page.locator('.time-dock').boundingBox();assert(popup.y>=0&&popup.y+popup.height<dock.y+2,'popup clear of timeline');assert(await page.locator('.map-toolbar').evaluate(el=>getComputedStyle(el).visibility==='hidden'));
 await page.locator('#year-slider').focus();await page.keyboard.press('ArrowLeft');assert((await page.locator('#year-display').innerText()).includes('2,025'),'keyboard steps exactly one year');assert.equal(await page.evaluate(()=>document.activeElement.id),'year-slider');await page.waitForTimeout(600);assert.equal(await page.evaluate(()=>document.activeElement.id),'year-slider');
 await page.screenshot({path:`artifacts/v8-${width}x${height}-detail.png`});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 const small=await page.evaluate(()=>[...document.querySelectorAll('button,input,select,a')].filter(el=>el.getClientRects().length&&getComputedStyle(el).visibility==='visible').map(el=>({id:el.id||el.className,r:el.getBoundingClientRect()})).filter(x=>x.r.width<43.9||x.r.height<43.9).map(x=>({id:x.id,w:x.r.width,h:x.r.height})));
 assert.deepEqual(small,[],'44px controls');report.checks.push({width,height,caption:true,names:true,focus:true,popupClear:true,targets44:true});await context.close();
}
// Block only neutral baseline once; historical snapshots still render, retry works.
const context=await browser.newContext();const page=await context.newPage();let failed=false;
await context.route('**/data/world_2010*',route=>{if(!failed){failed=true;return route.abort();}return route.continue()});
await page.goto(base+'/?year=1200');await page.waitForFunction(()=>document.querySelector('#snapshot-label').textContent.startsWith('疆界快照：'));await page.waitForFunction(()=>!document.querySelector('#baseline-status').hidden);await page.locator('#baseline-retry').click();await page.waitForFunction(()=>document.querySelector('#baseline-status').hidden&&document.querySelector('.leaflet-land-pane canvas'));report.checks.push({baselineIndependent:true,retry:true});await context.close();
assert.deepEqual(report.errors,[]);fs.writeFileSync('artifacts/v8-browser-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
