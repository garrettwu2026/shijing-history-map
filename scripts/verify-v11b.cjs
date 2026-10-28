// Build and serve the repository on port 8000 first.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const [year,key,expected,pending] of [
   [-500,'Magadha','摩揭陀',true],
   [1000,'Peshemegs','佩切涅格人',false],
   [-1500,'Hittites','西臺',false],
   [-300,'Mauryan Empire','孔雀王朝',false],
   [400,'Gupta Empire','笈多王朝',false],
   [800,'Abbasid Caliphate','阿拔斯王朝',false],
   [800,'Tang Empire','唐朝',false],
   [1800,'Darkinung','Darkinung',true],
  ]) {
   await page.goto(`http://localhost:8000/dist/?year=${year}`);
   await page.waitForFunction(()=>document.querySelector('#map-status').hidden&&document.querySelector('#snapshot-label').textContent.startsWith('疆界快照：'));
   await page.locator('#polity-open').click();await page.locator('#polity-search').fill(key);
   const row=page.locator('#polity-list button').first();
   assert((await row.innerText()).includes(expected));await row.click();
   const title=await page.locator('.maplibregl-popup-content .popup-title').innerText();
   assert(title.includes(expected),`${key}: ${title}`);
   assert.equal(title.includes('（待考）'),pending);
   assert(!title.includes('（待考）（待考）'));
   if(key==='Darkinung')assert((await page.locator('.maplibregl-popup-content').innerText()).includes('譯名待考'));
  }
  await page.goto('http://localhost:8000/dist/?year=-1259');
  await page.waitForFunction(()=>document.querySelectorAll('.event-item').length>0);
  assert((await page.locator('#event-list').innerText()).includes('西臺'));
  assert(!(await page.locator('#event-list').innerText()).includes('赫梯'));
  await page.locator('#time-options-toggle').click();
  const labels=await page.locator('.era-shortcuts button').allTextContents();
  assert.deepEqual(labels,['古代','古代','中古','近世','近代','當代']);
  const glossary=page.locator('#about-dialog a[href*="glossary."]');
  assert.equal(await glossary.count(),1);
  assert((await (await page.request.get(new URL(await glossary.getAttribute('href'),page.url()).href)).json()).entries.length>3000);
  assert.deepEqual(errors,[]);
  console.log('V11b browser passed: scholarly names in search/popups/events, pending fallback, era navigation and published glossary');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
