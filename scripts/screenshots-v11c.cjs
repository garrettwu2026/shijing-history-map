const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  for(const year of [-500,500,1000,1500,1900]){
   await page.goto(`http://localhost:8000/dist/?year=${year}`);
   await page.waitForFunction(()=>document.querySelector('#map-status').hidden&&document.querySelector('#snapshot-label').textContent.startsWith('疆界快照：'));
   await page.waitForFunction(()=>document.querySelectorAll('.label-zh').length>0);
   assert.equal(await page.locator('.label-zh').evaluateAll(els=>els.some(el=>/待考/.test(el.textContent))),false);
   await page.screenshot({path:`${process.env.V11_SCREENSHOT_DIR||'/workspace/review/v11'}/local${year}.png`});
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
