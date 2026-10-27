// Start an uncompressed static server, then run with NODE_PATH pointing to Playwright.
// BASE_URL defaults to http://localhost:8080. Reports are written to artifacts/.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const base=process.env.BASE_URL || 'http://localhost:8080';
const files=fs.readdirSync(path.join(root,'data')).filter(f=>/^world_.*\.geojson$/.test(f));
const sizes=files.map(file=>({file,before:execFileSync('git',['show',`HEAD:data/${file}`],{cwd:root,maxBuffer:20e6}).length,after:fs.statSync(path.join(root,'data',file)).size}));
const report={bytes:{before:sizes.reduce((n,f)=>n+f.before,0),after:sizes.reduce((n,f)=>n+f.after,0)},sizes,runs:[],checks:[]};
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH || '/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
 try {
 for(const mobile of [false,true]) {
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage();const errors=[];const requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  page.on('request',r=>{if(r.url().includes('/data/world_'))requests.push(new URL(r.url()).pathname)});
  const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
  await page.addInitScript(()=>{
   new MutationObserver(()=>{
    if(!window.firstBorders && document.querySelector('#snapshot-label')?.textContent.startsWith('疆界快照：'))
     requestAnimationFrame(()=>requestAnimationFrame(()=>{window.firstBorders ||= performance.now()}));
   }).observe(document,{subtree:true,childList:true,characterData:true});
  });
  for(let i=0;i<3;i++) {
   await page.goto(`${base}/?year=-300`);await page.waitForFunction(()=>window.firstBorders);
   report.runs.push({mobile,firstRenderMs:await page.evaluate(()=>window.firstBorders)});
  }
  await page.waitForTimeout(800);

  assert(requests.includes('/data/world_bc200.geojson'),'next snapshot prefetched');
  assert(await page.locator('.leaflet-land-pane canvas').count(),'land canvas');
  assert(await page.locator('.leaflet-overlay-pane canvas').count(),'border canvas');
  assert.equal(await page.locator('.leaflet-overlay-pane svg path').count(),0,'no SVG polygons');
  await page.evaluate(()=>{window.borderBuilds=0;const original=L.geoJSON;L.geoJSON=function(data,options){if(options?.onEachFeature){window.borderBuilds++;window.testMap=options.renderer._map;}return original.call(this,data,options)}});
  // Inputs stay responsive, while geometry waits for a pause.
  await page.evaluate(()=>{const slider=document.querySelector('#year-slider');for(const year of [200,400,600,700]){slider.value=year;slider.dispatchEvent(new Event('input'))}});
  assert.equal(await page.evaluate(()=>window.borderBuilds),0,'slider did not render immediately');
  await page.waitForTimeout(90);
  assert.equal(await page.evaluate(()=>window.borderBuilds),0,'slider waited at least 90ms');
  await page.waitForFunction(()=>window.borderBuilds===1);
  const select=async year=>{
   await page.locator('#year-input').fill(String(year));await page.locator('#year-form').evaluate(form=>form.requestSubmit());
   await page.waitForFunction(()=>document.querySelector('#map-status').hidden && document.querySelector('#snapshot-label').textContent.startsWith('疆界快照：'));
  };
  // Disable the browser HTTP cache: returning to a snapshot must use the app cache.
  await select(-300);await select(1200);await select(-300);
  await page.waitForTimeout(800);
  const selectedRequests=()=>requests.filter(p=>['/data/world_bc323.geojson','/data/world_1200.geojson'].includes(p)).length;
  const before=selectedRequests();await select(1200);await select(-300);
  assert.equal(selectedRequests(),before,'revisited selected snapshots stay in memory');
  await select(-4900);const builds=await page.evaluate(()=>window.borderBuilds);
  await page.locator('#play-button').click();await page.waitForTimeout(1250);await page.locator('#play-button').click();
  assert.equal(await page.evaluate(()=>window.borderBuilds),builds,'playback skips unchanged borders');
  // Every snapshot must load without errors, including the fragmented 1492 file.
  for(const s of JSON.parse(fs.readFileSync(path.join(root,'data/snapshots.json')))) {
   if(s.year>=-5000)await select(s.year);
  }
  await select(1492);
  for(const zoom of [2,4,6]) {
   await page.evaluate(z=>{window.testMap.setZoom(z,{animate:false});},zoom);
   await page.waitForTimeout(300);
   await page.screenshot({path:path.join(root,'artifacts',`performance-${mobile?'mobile':'desktop'}-zoom${zoom}.png`)});
  }
  assert.deepEqual(errors,[],'no JavaScript or console errors');
  report.checks.push({mobile,errors,canvas:true,idlePrefetch:true,debounce:true,memoryCache:true,unchangedPlayback:true,allSelectableSnapshots:true});
  await context.close();
 }
 }finally{await browser.close()}
 fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});fs.writeFileSync(path.join(root,'artifacts/performance-report.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
