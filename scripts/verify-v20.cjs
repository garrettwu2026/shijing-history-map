const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.BASE_URL||'http://localhost:8025/dist';
const ready=p=>p.waitForFunction(()=>window.historyState?.layer&&!historyState.boundariesPending&&document.querySelector('#map-status').hidden);
(async()=>{const b=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}),report=[];
try{for(const width of [1280,390,320]){const c=await b.newContext({viewport:{width,height:844},isMobile:width<760,hasTouch:width<760});const p=await c.newPage(),errors=[],requests=[];p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(r.url().includes('/detail/'))requests.push(r.url());});
 await p.goto(base+'/?year=1500');await ready(p);await p.waitForTimeout(700);assert.equal(requests.length,0,'zero detail requests on first screen');
 const ottomanTint=await p.evaluate(()=>historyMap.getSource('polities')._data.features.find(f=>f.properties.NAME==='Ottoman Empire')?.properties.tint);
 const coarse=await p.evaluate(()=>JSON.stringify(historyMap.getSource('polities')._data));
 await p.evaluate(()=>historyMap.jumpTo({center:[18,38],zoom:4.4}));await p.waitForTimeout(500);assert.equal(requests.length,0,'no detail below 4.5');
 await c.route('**/detail/*.gz*',async route=>{await new Promise(r=>setTimeout(r,500));await route.continue();});
 await p.evaluate(()=>historyMap.jumpTo({zoom:5}));await p.waitForTimeout(250);assert.equal(await p.evaluate(()=>JSON.stringify(historyMap.getSource('polities')._data)),coarse,'keep coarse while fine downloads');
 await p.waitForFunction(()=>historyDetailMetrics.applied.length>0);assert(requests.some(u=>u.includes('world_1500')));assert(requests.some(u=>u.includes('land.')));
 const fine=await p.evaluate(()=>JSON.stringify(historyMap.getSource('fine-polities')._data));assert.notEqual(fine,coarse,'fine polygons replace coarse');
 const vertices=data=>{let n=0;const visit=c=>{if(typeof c[0]==='number')n++;else c.forEach(visit);};for(const f of JSON.parse(data).features)if(f.geometry)visit(f.geometry.coordinates);return n;};
 const geometryCounts={coarse:vertices(coarse),fine:vertices(fine)};assert(geometryCounts.fine>geometryCounts.coarse,'higher zoom restores actual geometry vertices');
 assert.equal(await p.evaluate(()=>historyMap.getPaintProperty('grid-line','line-opacity').at(-1)),0);
 await p.evaluate(()=>historyMap.jumpTo({zoom:8}));await p.waitForTimeout(500);assert.equal(requests.filter(u=>u.includes('world_1500')).length,1,'reuse same detail at zoom 8');
 await p.evaluate(()=>historyMap.jumpTo({zoom:3}));await p.waitForTimeout(400);assert.equal(await p.evaluate(()=>JSON.stringify(historyMap.getSource('polities')._data)),coarse,'zoom out restores light geometry');
 // Rapid high-zoom snapshot switches: the last year wins.
 await p.evaluate(()=>historyMap.jumpTo({zoom:5}));await p.waitForTimeout(300);
 for(const year of [1900,-300,1500,1900]){await p.locator('#year-input').evaluate((el,y)=>{el.value=y;el.form.requestSubmit();},year);await p.waitForTimeout(70);}
 await p.waitForFunction(()=>historyState.snapshot?.year===1900&&!historyState.boundariesPending);await p.waitForFunction(()=>!historyDetailPending&&historyDetailMetrics.applied.at(-1)?.year===1900);
 assert.equal(await p.evaluate(()=>historyMap.getSource('polities')._data.features.find(f=>f.properties.NAME==='Ottoman Empire')?.properties.tint),ottomanTint,'same identity tint at 1500 and 1900');
 const styles=await p.evaluate(()=>({line:historyMap.getPaintProperty('polities-line','line-color'),review:historyMap.getPaintProperty('disputed-line','line-dasharray'),dots:historyMap.hasImage('culture-dots'),bad:historyDetailMetrics.error,labels:historyMap.queryRenderedFeatures({layers:['polity-labels']}).length,markers:[...document.querySelectorAll('.event-marker')].map(e=>({width:e.getBoundingClientRect().width,mixed:e.classList.contains('mixed'),tint:e.firstChild.style.getPropertyValue('--event-color')}))}));
 assert.equal(styles.line,'#182b30');assert.deepEqual(styles.review,[9,4,2,4]);assert(styles.dots);assert(!styles.bad,styles.bad);assert(styles.markers.every(m=>m.width>=44));assert(styles.markers.filter(m=>m.mixed).every(m=>m.tint==='#b8c3c1'));assert.deepEqual(errors,[]);
 await p.locator('#legend-toggle').evaluate(el=>{if(getComputedStyle(el).display!=='none')el.click();});await p.screenshot({path:`artifacts/v20-after/legend-${width}.png`});report.push({width,geometryCounts,requests:requests.length,styles,detail:await p.evaluate(()=>historyDetailMetrics)});await c.close();}
 // Also accept a host/CDN that has already decoded the gzip response body.
 {const c=await b.newContext({viewport:{width:390,height:844}}),p=await c.newPage();await c.route('**/detail/*.gz*',async route=>{const r=await route.fetch(),bytes=await r.body();await route.fulfill({status:200,contentType:'application/json',body:require('node:zlib').gunzipSync(bytes)});});await p.goto(base+'/?year=1500');await ready(p);await p.evaluate(()=>{historyMap.jumpTo({center:[18,38],zoom:5});});await p.waitForFunction(()=>historyDetailMetrics.applied.length&&historyMap.detailDisplayed);assert(!await p.evaluate(()=>historyDetailMetrics.error));report.push({alreadyDecodedGzip:true});await c.close();}
 const {stableColor}=await import('../modules/content.js');const cat=JSON.parse(fs.readFileSync('data/polities.json'));const names=['Ottoman Empire','Venice'];for(const n of names){const id=cat.index[n];assert(id);assert.match(stableColor(id),/^#[0-9a-f]{6}$/);}
 fs.writeFileSync('artifacts/v20-verification.json',JSON.stringify(report,null,2));console.log('TASK24 lazy geometry, stable identity styles, rapid timeline switching, 44px targets: passed');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
