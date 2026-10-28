const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const results=[];
 try{for(const [width,height] of [[1440,900],[390,844],[320,568],[844,390]]){
  const page=await browser.newPage({viewport:{width,height},isMobile:width<900,hasTouch:width<900});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.route('**/app.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('  init();','  window.compactTest={state,isAntarctica,antarcticaHTML,polityHTML,map:()=>map};\n  init();')})});
  await page.goto('http://localhost:8000/?year=1200');await page.waitForFunction(()=>document.querySelector('#map-status').hidden);await page.evaluate(()=>document.fonts.ready);
  const dock=await page.locator('.time-dock').boundingBox();assert(dock.height<=(width<=760?96:72),`dock too tall: ${dock.height}`);
  assert.equal(await page.locator('#time-options-toggle').getAttribute('aria-expanded'),'false');
  assert(!await page.locator('#year-input').isVisible());
  const inspection=await page.evaluate(async()=>{
   const {state,isAntarctica,polityHTML,map}=compactTest;const renderedData=await map().getSource('polities').getData();let antarctica=0,unnamed=0;
   for(const f of state.layer.features){if(isAntarctica(f)){antarctica++;const rendered=renderedData.features.find(x=>x.id===f.id);if(rendered.properties.tint!=='#91a6ab')throw Error('Antarctica styled as polity');}else if(!f.properties?.NAME?.trim())unnamed++;}
   const key=Object.keys(state.catalog.index).find(k=>{const p=state.catalog.polities[state.catalog.index[k]];return !p.exonyms?.length&&!p.geographicAliases?.length});
   const assertHTML=polityHTML(key);if(assertHTML.includes('未收錄')||assertHTML.includes('undefined')||assertHTML.includes('他稱／後世稱呼：')||assertHTML.includes('地理別稱：'))throw Error('Empty popup fields visible');
   return {antarctica,unnamed};
  });assert.equal(inspection.antarctica,1);
  await page.screenshot({path:`artifacts/compact-${width}x${height}.png`});
  await page.locator('#time-options-toggle').click();assert(await page.locator('#year-input').isVisible());assert(await page.locator('#speed-select').isVisible());
  await page.screenshot({path:`artifacts/compact-expanded-${width}x${height}.png`});
  for(const year of [-5000,1492,1945,1958,1959,1960,1961,2026]){
   await page.locator('#year-input').fill(String(year));await page.locator('#year-form').evaluate(f=>f.requestSubmit());await page.waitForFunction(()=>document.querySelector('#map-status').hidden);
   assert.equal(await page.evaluate(()=>{let count=0;for(const f of compactTest.state.layer.features)if(compactTest.isAntarctica(f))count++;return count;}),1);
   const html=await page.evaluate(()=>compactTest.antarcticaHTML());assert.equal(html.includes('南極條約'),year>=1959);
  }
  await page.locator('#time-options-toggle').click();
  await page.evaluate(async()=>{const {state,map,isAntarctica}=compactTest;const renderedData=await map().getSource('polities').getData();map().jumpTo({center:[0,-74],zoom:2});const f=renderedData.features.find(f=>f.properties.antarctica);window.antarcticFeature=f;});
  await page.waitForTimeout(800);await page.evaluate(async()=>{const code=await import('/modules/map.js');code.showPopup(compactTest.map(),[0,-74],compactTest.antarcticaHTML());});const popupBox=await page.locator('.maplibregl-popup-content').boundingBox();assert(popupBox.x>=0&&popupBox.x+popupBox.width<=width,'Antarctica popup clipped');assert((await page.locator('.maplibregl-popup-content').innerText()).includes('南極洲 Antarctica'));
  await page.screenshot({path:`artifacts/antarctica-${width}x${height}.png`});
  assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth));assert.deepEqual(errors,[]);
  results.push({width,height,dockHeight:dock.height,...inspection,errors});await page.close();
 }}finally{await browser.close()}
 fs.writeFileSync('artifacts/compact-report.json',JSON.stringify(results,null,2));console.log(results);
})().catch(e=>{console.error(e);process.exitCode=1});
