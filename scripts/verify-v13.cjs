const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const {nameDisplay,createNameDisplay,regionFor}=await import('../modules/content.js');
 const glossary=JSON.parse(fs.readFileSync('data/glossary.json'));
 const display=createNameDisplay(glossary);
 for(const value of ['平安時代','繩文時代','平安時代（待考）（待考）']){
  assert.equal(display(display(value)),display(value));
  assert.equal((display(value).match(/待考/g)||[]).length,1);
 }
 assert.equal(display('孔雀王朝（待考）（待考）'),'孔雀王朝（待考）');
 assert.equal(nameDisplay('阿貝納基族','restored-v10'),'阿貝納基族（待考）');
 assert.equal(nameDisplay('梅里納王國（年代／疆界待考證）（待考）','pending'),'梅里納王國（年代／疆界待考證）');
 for(const [bounds,key,expected] of [
  [[43,-26,51,-12],'','非洲'],[[55,-5,56,-4],'Seychelles','非洲'],
  [[19,40,175,80],'Russian Empire','歐洲／亞洲'],
  [[-180,-22,180,-12],'Fiji','大洋洲'],[[-180,-20,180,50],'',''],
  [[170,-20,-170,20],'',''],[[-10,-20,80,60],'',''],
 ])assert.equal(regionFor(bounds,key),expected);
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const report={viewports:[],errors:[]};
 try{
  for(const [width,height] of [[320,568],[390,844],[844,390]]){
   const page=await browser.newPage({viewport:{width,height},hasTouch:true});
   page.on('pageerror',e=>report.errors.push(e.message));
   await page.goto('http://localhost:8000/dist/?year=2026');
   await page.waitForFunction(()=>document.querySelector('#map-status').hidden);
   const box=await page.locator('.time-dock').boundingBox();assert(box.height<=66);
   const slider=await page.locator('#year-slider').boundingBox(),year=await page.locator('.selected-year').boundingBox();
   if(width<=760){assert(slider.y>=year.y+year.height);assert(slider.height>=44);}
   for(const id of ['boundary-warning','home-view','labels-toggle','events-toggle','play-button','time-options-toggle']){
    assert(await page.locator('#'+id).evaluate(el=>{const b=el.getBoundingClientRect();return el.contains(document.elementFromPoint(b.x+b.width/2,b.y+b.height/2))}),id+' clickable');
   }
   await page.locator('#boundary-warning').click();assert(await page.locator('#boundary-warning-text').isVisible());
   await page.locator('#boundary-warning').click();
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   report.viewports.push({width,height,dockHeight:box.height,sliderHeight:slider.height});await page.close();
  }
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto('http://localhost:8000/dist/?year=1200');
  await page.waitForFunction(()=>window.historyProfiles?.at(-1)?.labelPasses===1);
  await page.evaluate(()=>window.oldLabels=[...document.querySelectorAll('.polity-label')]);
  assert(await page.evaluate(()=>window.oldLabels.length>0));
  await page.route('**/data/world_1900*',async route=>{await new Promise(r=>setTimeout(r,450));await route.continue()});
  await page.locator('#year-input').evaluate(el=>{el.value='1900';el.form.requestSubmit()});
  await page.waitForTimeout(150);
  assert(await page.evaluate(()=>window.oldLabels.every(el=>el.isConnected)),'old labels retained while loading');
  await page.waitForFunction(()=>document.querySelector('#map-status').hidden&&window.historyProfiles?.at(-1)?.year===1900&&window.historyProfiles.at(-1).labelPasses===1);
  assert(await page.evaluate(()=>window.oldLabels.every(el=>!el.isConnected)),'labels replaced after swap');
  await page.goto('http://localhost:8000/dist/?year=794');await page.waitForFunction(()=>document.querySelector('#map-status').hidden);
  assert((await page.locator('#event-list').innerText()).includes('平安時代（待考）'));
  await page.locator('#polity-open').click();await page.locator('#polity-search').fill('武周');
  await page.locator('#polity-list button').first().click();assert((await page.locator('.popup-title').innerText()).includes('武周'));
  assert.deepEqual(report.errors,[]);fs.writeFileSync('artifacts/v13-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
