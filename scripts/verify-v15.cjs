const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const intros=read('data/intros.json'),catalog=read('data/polities.json'),glossary=read('data/glossary.json');
const display=entry=>entry.accepted_zh_TW||entry.previous_zh||entry.original;
const namesByID=new Map();
for(const term of glossary.entries){const id=catalog.index[term.original];if(id){if(!namesByID.has(id))namesByID.set(id,new Set());namesByID.get(id).add(display(term));}}
assert(Object.keys(intros).length>=214,'preserve the original introduction coverage as the catalog grows');
for(const [id,intro] of Object.entries(intros)){
 assert(/^p-[0-9a-f]{16}$/.test(id)&&catalog.polities[id],id);
 assert(['name','summary','存續年代','首都','主要族群/語言','重要事件','前身/後繼'].every(field=>field in intro),'preserve original fields');
 assert(Object.keys(intro).every(field=>['name','summary','存續年代','首都','主要族群/語言','重要事件','前身/後繼','年表','重要人物','關鍵數據','背景','影響'].includes(field)),'known introduction fields');
 assert(namesByID.get(id)?.has(intro.name),`${id} name matches glossary`);
 for(const field of ['name','summary','存續年代','首都','主要族群/語言'])assert.equal(typeof intro[field],'string');
 assert(intro.summary.includes(intro.name),`${id} uses display name`);
 const sentences=intro.summary.split('。').filter(Boolean);assert(sentences.length>=2,`${id} multiple factual sentences`);
 assert(Array.isArray(intro['重要事件']));assert(intro['重要事件'].every(x=>typeof x==='string'&&x.length>0));
 assert(Array.isArray(intro['前身/後繼']));
 for(const item of intro['前身/後繼']){
  assert(Object.keys(item).every(k=>['name','id'].includes(k)));
  assert.equal(typeof item.name,'string');assert(item.name.length);
  if(item.id)assert(catalog.polities[item.id]&&namesByID.get(item.id)?.has(item.name),`${id} relationship name and ID`);
  else assert(glossary.entries.some(t=>display(t)===item.name),'unlinked name in glossary');
 }

}
const built=fs.readdirSync('dist/data').filter(name=>/^intros\.[a-f0-9]{16}\.json$/.test(name));assert.equal(built.length,1);
assert.deepEqual(read('dist/data/'+built[0]),intros);
assert(!fs.existsSync('dist/scripts/v15-source-audit.json'),'internal audit is not shipped');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const report={entries:Object.keys(intros).length,viewports:[],errors:[]};
 try{
  for(const [width,height] of [[1440,900],[390,844],[320,568]]){
   const context=await browser.newContext({viewport:{width,height},isMobile:width<=760,hasTouch:width<=760});
   const requests=[];context.on('request',request=>{if(/\/intros\./.test(request.url()))requests.push(request.url());});
   const page=await context.newPage();page.on('pageerror',error=>report.errors.push(error.message));
   await page.goto('http://localhost:8000/dist/?year=200');
   await page.waitForFunction(()=>window.historyProfiles?.at(-1)?.labelPasses===1);
   assert.equal(requests.length,0,'initial render does not fetch introductions');
   await page.locator('#polity-open').click();await page.locator('#polity-search').fill('羅馬帝國');await page.locator('#polity-list button').first().click();
   const details=page.locator('.polity-intro');await details.waitFor();
   assert.equal(requests.length,1,'first popup lazily fetches fingerprinted JSON');
   assert.equal(await details.getAttribute('open'),null,'collapsed by default');
   await details.locator('summary').click();assert.equal(await details.getAttribute('open'),'');
   assert((await details.innerText()).includes(intros[catalog.index['Roman Empire']].summary));
   assert.equal(await details.locator('a, .intro-sources').count(),0,'intro renders no source links');
   assert(!(await details.innerText()).includes('來源：'),'intro has no sources UI');
   await page.waitForTimeout(100);
   const layout=await page.evaluate(()=>{
    const popup=document.querySelector('.maplibregl-popup').getBoundingClientRect(),dock=document.querySelector('.time-dock').getBoundingClientRect();
    const content=document.querySelector('.maplibregl-popup-content');
    return {left:popup.left,right:popup.right,top:popup.top,bottom:popup.bottom,dockTop:dock.top,overflow:document.documentElement.scrollWidth>innerWidth,contentOverflow:content.scrollWidth>content.clientWidth+1,mapVisible:document.querySelector('#map').getBoundingClientRect().height>200};
   });
   assert(layout.left>=-1&&layout.right<=width+1&&layout.top>=-1&&layout.bottom<=layout.dockTop,JSON.stringify(layout));
   assert(!layout.overflow&&!layout.contentOverflow&&layout.mapVisible,'no overlap or horizontal overflow');
   await page.screenshot({path:`artifacts/v15-intro-${width}.png`});
   await page.keyboard.press('Escape');
   await page.locator('#polity-open').click();await page.locator('#polity-search').fill('漢朝');await page.locator('#polity-list button').first().click();await details.waitFor();
   assert.equal(requests.length,1,'next polity reuses introduction cache');
   assert.equal(await details.getAttribute('open'),null,'each new popup starts collapsed');
   report.viewports.push({width,height,...layout});await context.close();
  }
  assert.deepEqual(report.errors,[]);fs.writeFileSync('artifacts/v15-report.json',JSON.stringify(report,null,2)+'\n');console.log(report);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
