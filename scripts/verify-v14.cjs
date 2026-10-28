const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('node:fs');
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});const report={years:[],fallback:[],errors:[]};try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});
 // Labels and geometry must work with all outbound requests forbidden.
 await page.route('**/*',route=>new URL(route.request().url()).hostname==='localhost'?route.continue():route.abort());
 // Expand only the test's input range to cover the three pre-UI snapshots too.
 await page.route('**/app.*.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('const MIN = -5000','const MIN = -123000')});});
 await page.goto('http://localhost:8000/dist/?year=500');await page.waitForFunction(()=>window.historyProfiles?.at(-1)?.labelPasses===1);
 await page.evaluate(async()=>{window.sources={polities:historyMap.getSource('polities'),disputed:historyMap.getSource('disputed')};window.oldData=JSON.stringify(await sources.polities.getData());window.layerIDs=historyMap.getStyle().layers.map(l=>l.id).join('|');});
 for(const [year,expected] of [[500,'南齊'],[700,'武周'],[1200,'蒙古各部'],[1900,'巴西共和國']]){
  await page.locator('#year-input').evaluate((el,y)=>{el.value=y;el.form.requestSubmit()},year);
  await page.waitForFunction(y=>historyState.snapshot?.year===y&&!historyState.boundariesPending,year);
  await page.waitForFunction(name=>historyMap.queryRenderedFeatures({layers:['polity-labels']}).some(f=>f.properties.name===name),expected);
  const labels=await page.evaluate(()=>historyMap.queryRenderedFeatures({layers:['polity-labels']}).map(f=>f.properties.name));assert(labels.length>0);assert(labels.every(s=>/[\u3400-\u9fff\uf900-\ufaff]/u.test(s)&&!/[（()）]/u.test(s)));assert(!labels.some(s=>s.includes('待考')));
  assert(await page.evaluate(()=>sources.polities===historyMap.getSource('polities')&&sources.disputed===historyMap.getSource('disputed')&&layerIDs===historyMap.getStyle().layers.map(l=>l.id).join('|')));
  report.years.push({year,expected,renderedLabels:labels.length});
 }
 // Audit every snapshot, including offscreen/collision-hidden labels in the source.
 report.labelAudit=[];
 for(const snapshot of JSON.parse(fs.readFileSync('data/snapshots.json','utf8'))){
  await page.locator('#year-input').evaluate((el,y)=>{el.min=-123000;el.value=y;el.form.requestSubmit()},snapshot.year);
  await page.waitForFunction(y=>historyState.snapshot?.year===y&&!historyState.boundariesPending&&historyState.labelSignature?.startsWith(y+'|'),snapshot.year);
  await page.waitForFunction(()=>historyMap.loaded());
  const audit=await page.evaluate(async()=>{
   const state=historyState, source=await historyMap.getSource('labels').getData();
   const expected=new Map(),changes=[];
   for(const f of state.layer.features){
    const key=f.properties?.NAME,p=state.catalog.polities[state.catalog.index[key]],b=f.labelGeometry?.bounds;
    if(!p||!f.labelGeometry?.anchors?.[0]||(b&&b[1]<=-85&&b[3]<-60&&b[2]-b[0]>300))continue;
    const year=state.snapshot.year,period=p.periods.find(n=>year>=n.fromYear&&year<=n.toYear);
    const correction=state.errata.overrides.find(n=>year>=(n.fromYear??n.year)&&year<=(n.toYear??n.year)&&n.match===key);
    const raw=correction?.zh||period?.zh||p.zh;
    // Independent oracle: the name before its first parenthetical note, intact.
    const clean=raw.split(/[（(]/u)[0].trim();
    if(!/[\u3400-\u9fff\uf900-\ufaff]/u.test(clean))continue;
    expected.set(p.id,clean);
    const old=raw.replace(/(?:（[^（）]*待考[^（）]*）|\(\s*待考\s*\))+/g,'').replace(/[^\u3400-\u9fff\uf900-\ufaff]/gu,'');
    if(old!==clean)changes.push({key,raw,old,clean});
   }
   const errors=[];
   if(source.features.length!==expected.size)errors.push('source count differs from expected');
   for(const f of [...source.features,...historyMap.queryRenderedFeatures({layers:['polity-labels']})]){
    if(f.properties.name!==expected.get(f.properties.polityId))errors.push(f.properties);
   }
   return {year:state.snapshot.year,sourceLabels:source.features.length,renderedLabels:historyMap.queryRenderedFeatures({layers:['polity-labels']}).length,changes,errors};
  });
  assert.deepEqual(audit.errors,[],`clean labels in ${snapshot.year}`);report.labelAudit.push(audit);
 }
 await page.locator('#year-input').evaluate(el=>{el.value=1900;el.form.requestSubmit()});
 await page.waitForFunction(()=>historyState.snapshot.year===1900&&!historyState.boundariesPending);
 await page.locator('#polity-open').click();await page.locator('#polity-search').fill('夏威夷');await page.locator('#polity-list button').first().click();
 assert((await page.locator('.popup-title').innerText()).includes('夏威夷領地（美屬）'));await page.keyboard.press('Escape');
 assert(await page.evaluate(async()=>oldData!==JSON.stringify(await sources.polities.getData())));assert.deepEqual(await page.evaluate(()=>historyMap.getPaintProperty('disputed-line','line-dasharray')),[9,4,2,4]);
 await page.locator('#year-input').evaluate(el=>{el.value=1800;el.form.requestSubmit()});await page.waitForFunction(()=>historyState.snapshot.year===1800&&!historyState.boundariesPending);
 await page.locator('#polity-open').click();await page.locator('#polity-search').fill('Darkinung');await page.locator('#polity-list button').first().click();assert.equal(((await page.locator('.popup-title').innerText()).match(/待考/g)||[]).length,1);await page.keyboard.press('Escape');
 await page.locator('#year-input').evaluate(el=>{el.value=2010;el.form.requestSubmit()});await page.waitForFunction(()=>historyState.snapshot.year===2010&&!historyState.boundariesPending);
 await page.locator('#polity-open').click();await page.locator('#polity-search').fill('Fiji');await page.locator('#polity-list button').first().click();const selection=await page.evaluate(()=>politySelection);assert(selection.bounds[1][1]-selection.bounds[0][1]<30,'Fiji dateline fit remains local');await page.keyboard.press('Escape');
 assert(await page.evaluate(()=>{const fs=historyState.layer.features.filter(f=>f.properties.NAME==='Fiji');return fs.length>0&&fs.every(f=>f.labelGeometry.bounds[2]-f.labelGeometry.bounds[0]<30)}),'dateline geometry is local');
 for(const [width,height] of [[320,568],[390,844],[844,390]]){await page.setViewportSize({width,height});await page.goto('http://localhost:8000/dist/?year=2026');await page.waitForFunction(()=>window.historyProfiles?.at(-1)?.labelPasses===1);assert((await page.locator('.time-dock').boundingBox()).height<=66);for(const id of ['boundary-warning','home-view','labels-toggle','events-toggle','play-button','time-options-toggle']){assert(await page.locator('#'+id).evaluate(el=>{const b=el.getBoundingClientRect();return el.contains(document.elementFromPoint(b.x+b.width/2,b.y+b.height/2))}),id+' clickable');}for(const id of ['labels-toggle','events-toggle']){await page.locator('#'+id).click();assert.equal(await page.locator('#'+id).getAttribute('aria-pressed'),'false');await page.locator('#'+id).click();}await page.locator('#boundary-warning').click();assert(await page.locator('#boundary-warning-text').isVisible());await page.locator('#boundary-warning').click();await page.locator('#time-options-toggle').click();assert(await page.locator('#year-input').isVisible());await page.locator('#time-options-toggle').click();}
 // A synthetic short polygon crossing ±180 exercises Worker unwrapping and actual GL hits.
 {const context=await browser.newContext();await context.route('**/data/world_2010*',async route=>{const response=await route.fetch(),data=await response.json();const f=data.features.find(f=>f.properties.NAME==='Fiji');f.geometry={type:'Polygon',coordinates:[[[179,-10],[-179,-10],[-179,-12],[179,-12],[179,-10]]]};await route.fulfill({response,json:data});});const p=await context.newPage();await p.goto('http://localhost:8000/dist/?year=2010');await p.waitForFunction(()=>window.historyProfiles?.at(-1)?.labelPasses===1);await p.evaluate(()=>historyMap.jumpTo({center:[180,-11],zoom:5}));await p.waitForFunction(()=>historyMap.loaded());assert(await p.evaluate(()=>[179.5,180.5].every(lng=>historyMap.queryRenderedFeatures(historyMap.project([lng,-11]),{layers:['polities-fill']}).some(f=>f.properties.NAME==='Fiji'))),'both sides of dateline render');assert(await p.evaluate(()=>{const f=historyState.layer.features.find(f=>f.properties.NAME==='Fiji');return f.labelGeometry.bounds[2]-f.labelGeometry.bounds[0]===2}));report.antimeridian=true;await context.close();}
 for(const mode of ['unsupported','init-error']){const context=await browser.newContext();await context.addInitScript(mode=>{Object.defineProperty(window,'maplibregl',{configurable:true,set(value){if(mode==='unsupported')value.supported=()=>false;else value.Map=class{constructor(){throw Error('simulated WebGL init error')}};Object.defineProperty(window,'maplibregl',{value,writable:true,configurable:true});}})},mode);const p=await context.newPage();await p.goto('http://localhost:8000/dist/');await p.locator('.webgl-fallback').waitFor();assert((await p.locator('.webgl-fallback').innerText()).includes('不支援 WebGL'));report.fallback.push(mode);await context.close();}
 assert.deepEqual(report.errors,[]);fs.writeFileSync('artifacts/v14-report.json',JSON.stringify(report,null,2));console.log(report);
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
