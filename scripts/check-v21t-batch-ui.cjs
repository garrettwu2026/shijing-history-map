const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const path=require('node:path');
const manifest=process.argv[2];
const output=process.argv[3];
assert(manifest && output, 'Usage: node scripts/check-v21t-batch-ui.cjs MANIFEST OUTPUT_DIRECTORY');
const rows=JSON.parse(fs.readFileSync(manifest,'utf8'));
const catalog=require('../data/polities.json').polities;
const intros=require('../data/intros.json');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const results=[];
 try {
 for(const row of rows){
  const page=await browser.newPage({viewport:{width:320,height:568}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://localhost:8000/?year=${catalog[row.id].validFrom}&polity=${row.id}`);
  const details=page.locator(`[data-intro-id="${row.id}"]`);
  await details.waitFor({state:'attached'});
  if(!await details.evaluate(e=>e.open))await details.locator('summary').click();
  const text=await details.textContent();
  assert(text.includes(row.zh));assert(text.includes(intros[row.id]['背景']));assert(text.includes(intros[row.id]['影響']));
  assert.equal(await details.locator('.detail-chronology li').count(),intros[row.id]['年表'].length);
  assert(!/https?:\/\/|來源[:：]|參考資料/.test(text));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.equal(await page.locator('.maplibregl-popup-content').evaluateAll(es=>es.some(e=>e.scrollWidth>e.clientWidth+1)),false);
  assert.deepEqual(errors,[]);
  results.push({id:row.id,name:row.zh,year:catalog[row.id].validFrom,passed:true});
  if(results.length===1)await page.screenshot({path:path.join(output,'new-polity-320.png')});
  await page.close();
 }
 fs.writeFileSync(path.join(output,'new-polity-ui.json'),JSON.stringify(results,null,2));console.log(`${results.length} new polity popups passed`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
