const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const catalog=require('../data/polities.json');
const endonyms=require('../data/endonyms.json');const fs=require('node:fs');const built=fs.readdirSync('dist/data').filter(n=>/^endonyms\.[a-f0-9]{16}\.json$/.test(n));assert.equal(built.length,1);assert.deepEqual(JSON.parse(fs.readFileSync('dist/data/'+built[0])),endonyms);assert(Object.keys(endonyms).length>=60&&Object.keys(endonyms).length<=100);for(const [id,entries] of Object.entries(endonyms)){assert(catalog.polities[id]);for(const e of entries)for(const k of ['original','transliteration','meaning','language','period'])assert.equal(typeof e[k],'string');}
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});try{
const page=await browser.newPage();page.setDefaultTimeout(20000);const errors=[];page.on('pageerror',e=>errors.push(e.message));const id=catalog.index['Roman Empire'];
await page.goto(`http://localhost:8000/dist/?year=200&polity=${id}`);
await page.locator('.popup-title').waitFor();assert.equal(await page.evaluate(()=>historyState.selectedPolity),id);
const length=await page.evaluate(()=>history.length);
await page.locator('#time-options-toggle').click();await page.locator('#year-input').fill('201');await page.locator('#year-form').evaluate(e=>e.requestSubmit());
await page.waitForFunction(()=>location.search.includes('year=201')&&!!document.querySelector('.popup-title'));
assert.equal(new URL(page.url()).searchParams.get('polity'),id);assert.equal(await page.evaluate(()=>history.length),length);
await page.reload();await page.locator('.popup-title').waitFor();assert.equal(await page.evaluate(()=>historyState.year),201);
await page.locator('#year-input').evaluate(e=>{e.value=100;e.form.requestSubmit()});await page.waitForFunction(()=>window.historyState?.snapshot?.year===100&&!!document.querySelector('.popup-title'));assert.equal(new URL(page.url()).searchParams.get('polity'),id);
await page.keyboard.press('Escape');assert.equal(new URL(page.url()).searchParams.get('polity'),null);
await page.locator('#polity-open').click();await page.locator('#polity-search').fill('漢朝');await page.locator('#polity-list button').first().click();await page.locator('.popup-title').waitFor();
assert.match(new URL(page.url()).searchParams.get('polity'),/^p-[0-9a-f]{16}$/);assert.equal(new URL(page.url()).searchParams.get('polity'),await page.evaluate(()=>historyState.selectedPolity));assert.equal(await page.evaluate(()=>history.length),length);
await page.goto('http://localhost:8000/dist/?year=1800');await page.waitForFunction(()=>window.historyState?.snapshot?.year===1800);assert.equal(await page.locator('.popup-title').count(),0);
await page.goto('http://localhost:8000/dist/?year=200&polity=invalid');await page.waitForFunction(()=>window.historyState?.snapshot?.year===200);assert.equal(new URL(page.url()).searchParams.get('polity'),null);
for(const [name,year] of [['Roman Empire',200],['Qing Empire',1800],['Ottoman Empire',1800],['France',2010],['Byzantine Empire',1200],['Mongol Empire',1210],['Mughal Empire',1700],['Safavid Empire',1600],['Holy Roman Empire',1700],['Japan',1800],['Korea',1800]]){
console.log('endonym',name,year);const id=catalog.index[name];await page.goto(`http://localhost:8000/dist/?year=${year}&polity=${id}`);await page.locator('.self-designation').first().waitFor();
assert((await page.locator('.self-designation').allTextContents()).join('').includes(endonyms[id][0].original));assert.equal(await page.locator('.self-designation a,.self-designation-pending').count(),0);
}
assert.deepEqual(errors,[]);fs.writeFileSync('artifacts/v16-report.json',JSON.stringify({entries:Object.keys(endonyms).length,url:true,endonyms:true,errors},null,2));console.log('v16 URL and endonym checks passed');}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
