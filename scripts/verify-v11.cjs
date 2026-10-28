// Build dist and serve the repository on port 8000 first.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const [year,key,expected,pending] of [
   [500,'Jin Empire','南齊',false],
   [700,'Sui Empire','武周',false],
   [1000,'Merina Kingdom','年代／疆界待考證',true],
   [1800,'Darkinung','Darkinung',true],
   [1900,'Kingdom of Brazil','巴西共和國',false],
  ]){
   await page.goto(`http://localhost:8000/dist/?year=${year}`);
   await page.waitForFunction(()=>document.querySelector('#map-status').hidden&&document.querySelector('#snapshot-label').textContent.startsWith('疆界快照：'));
   await page.locator('#polity-open').click();await page.locator('#polity-search').fill(key);
   await page.locator('#polity-list button').first().click();
   const popup=page.locator('.leaflet-popup-content');await popup.waitFor();
   assert((await popup.innerText()).includes(expected),`${year}: ${key}`);
   if(key==='Darkinung')assert((await popup.innerText()).includes('譯名待考'));
   else assert((await popup.innerText()).includes('疆界待考證'));
   if(pending&&key!=='Darkinung')assert(!(await popup.innerText()).includes('名稱已修正'));
   assert.equal(await page.locator('.label-zh').evaluateAll(els=>els.some(el=>/待考/.test(el.textContent))),false);
   if(key==='Jin Empire'){
    assert(!(await popup.locator('.popup-title').innerText()).includes('金帝國'));
    await page.waitForFunction(()=>[...document.querySelectorAll('.label-zh')].some(el=>el.textContent==='南齊'));
   }
  }
  assert.deepEqual(errors,[]);console.log('V11 browser: period names, pending names, border warnings and popups passed');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
