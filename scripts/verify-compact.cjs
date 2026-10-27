const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
 const results=[];
 try{for(const [width,height] of [[1440,900],[390,844],[320,568],[844,390]]){
  const page=await browser.newPage({viewport:{width,height},isMobile:width<900,hasTouch:width<900});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.route('**/app.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('  init();','  window.compactTest={state,isAntarctica,antarcticaHTML,polityHTML,map:()=>map};\n  init();')})});
  await page.goto('http://localhost:8000/?year=1200');await page.waitForFunction(()=>document.querySelector('#map-status').hidden);await page.evaluate(()=>document.fonts.ready);
  const dock=await page.locator('.time-dock').boundingBox();assert(dock.height<=(width<=760?96:72),`dock too tall: ${dock.height}`);
  assert.equal(await page.locator('#time-options-toggle').getAttribute('aria-expanded'),'false');
  assert(!await page.locator('#year-input').isVisible());
  const inspection=await page.evaluate(()=>{
   const {state,isAntarctica,polityHTML}=compactTest;let antarctica=0,unnamed=0;
   state.layer.eachLayer(l=>{if(isAntarctica(l.feature)){antarctica++;if(!l.getPopup())throw Error('Antarctica popup missing');if(l.options.fillColor!=='#91a6ab')throw Error('Antarctica styled as polity');}else if(!l.feature.properties?.NAME?.trim()){unnamed++;if(l.getPopup()||l.options.interactive)throw Error('Unnamed polygon interactive');}});
   const key=Object.keys(state.catalog.index).find(k=>{const p=state.catalog.polities[state.catalog.index[k]];return !p.exonyms?.length&&!p.geographicAliases?.length});
   const assertHTML=polityHTML(key);if(assertHTML.includes('未收錄')||assertHTML.includes('undefined')||assertHTML.includes('他稱／後世稱呼：')||assertHTML.includes('地理別稱：'))throw Error('Empty popup fields visible');
   return {antarctica,unnamed};
  });assert.equal(inspection.antarctica,1);
  await page.screenshot({path:`artifacts/compact-${width}x${height}.png`});
  await page.locator('#time-options-toggle').click();assert(await page.locator('#year-input').isVisible());assert(await page.locator('#speed-select').isVisible());
  await page.screenshot({path:`artifacts/compact-expanded-${width}x${height}.png`});
  for(const year of [-5000,1492,1945,1958,1959,1960,1961,2026]){
   await page.locator('#year-input').fill(String(year));await page.locator('#year-form').evaluate(f=>f.requestSubmit());await page.waitForFunction(()=>document.querySelector('#map-status').hidden);
   assert.equal(await page.evaluate(()=>{let count=0;compactTest.state.layer.eachLayer(l=>{if(compactTest.isAntarctica(l.feature)){count++;if(!l.getPopup()||l.options.fillColor!=='#91a6ab')throw Error('Antarctica not geographic');}});return count;}),1);
   const html=await page.evaluate(()=>compactTest.antarcticaHTML());assert.equal(html.includes('南極條約'),year>=1959);
  }
  await page.locator('#time-options-toggle').click();
  await page.evaluate(()=>{const {state,map,isAntarctica}=compactTest;map().setView([-74,0],2);state.layer.eachLayer(l=>{if(isAntarctica(l.feature))l.openPopup([-74,0]);});});
  await page.waitForTimeout(800);const popupBox=await page.locator('.leaflet-popup-content').boundingBox();assert(popupBox.x>=0&&popupBox.x+popupBox.width<=width,'Antarctica popup clipped');assert((await page.locator('.leaflet-popup-content').innerText()).includes('南極洲 Antarctica'));
  await page.screenshot({path:`artifacts/antarctica-${width}x${height}.png`});
  assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth));assert.deepEqual(errors,[]);
  results.push({width,height,dockHeight:dock.height,...inspection,errors});await page.close();
 }}finally{await browser.close()}
 fs.writeFileSync('artifacts/compact-report.json',JSON.stringify(results,null,2));console.log(results);
})().catch(e=>{console.error(e);process.exitCode=1});
