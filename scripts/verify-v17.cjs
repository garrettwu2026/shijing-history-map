const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const catalog=require('../data/polities.json');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});try{
let page=await browser.newPage();
for(const [key,year,name] of [['Qing Empire',1800,'清朝'],['Eastern Roman Empire',600,'東羅馬帝國'],['Roman Empire',200,'羅馬帝國']]){
await page.goto(`http://localhost:8000/?year=${year}&polity=${catalog.index[key]}`);
await page.locator('.polity-links').waitFor();const links=page.locator('.polity-links a');assert.equal(await links.count(),2);
assert.equal(await links.nth(0).getAttribute('href'),'https://www.google.com/search?q='+encodeURIComponent(name+' 歷史'));
assert.equal(await links.nth(1).getAttribute('href'),'https://zh.wikipedia.org/w/index.php?search='+encodeURIComponent(name)+'&variant=zh-tw');
assert.deepEqual(await links.allTextContents(),['Google 搜尋','維基百科']);
for(const a of await links.all()){assert.equal(await a.getAttribute('target'),'_blank');assert.equal(await a.getAttribute('rel'),'noopener');}
}
console.log('v17 popup links passed');
await page.close();page=await browser.newPage();const requests=[];page.on('request',r=>{if(r.url().endsWith('.woff2'))requests.push(r.url())});
await page.goto('http://localhost:8000/?year=200&polity='+catalog.index['Roman Empire']);await page.locator('.popup-title').waitFor();assert.equal(requests.length,0);
for(const [key,year] of [['Qing Empire',1800],['Mongol Empire',1210]]){
await page.goto(`http://localhost:8000/?year=${year}&polity=${catalog.index[key]}`);await page.locator('.mongolian-text').waitFor();
const result=await page.evaluate(async()=>{
const el=document.querySelector('.mongolian-text');await document.fonts.load('20px "History Mongolian"',el.textContent);await document.fonts.ready;
const c=document.createElement('canvas').getContext('2d');c.font='20px "History Mongolian"';const width=c.measureText(el.textContent).width;c.font='20px "History Mongolian"';const tofu=c.measureText(el.textContent.replace(/[\u1800-\u18af]/gu,'\uffff')).width;
return {loaded:[...document.fonts].some(f=>f.family==='History Mongolian'&&f.status==='loaded'),width,tofu,family:getComputedStyle(el).fontFamily};});
assert(result.loaded);assert(result.family.includes('History Mongolian'));assert.notEqual(result.width,result.tofu);
}assert(requests.some(u=>u.includes('mongolian-subset')));console.log('v17 lazy web font and glyph checks passed');
const endonyms=require('../data/endonyms.json');
for(const [year,original] of [[1800,'สยาม'],[1938,'สยาม'],[1939,'ประเทศไทย'],[1944,'ประเทศไทย'],[1945,'สยาม'],[1948,'สยาม'],[1949,'ประเทศไทย'],[2010,'ประเทศไทย']]){
const entries=endonyms[catalog.index.Thailand].filter(e=>year>=e.fromYear&&year<=e.toYear);assert.equal(entries.length,1);assert.equal(entries[0].original,original);
}
for(const [year,original] of [[1938,'สยาม'],[1939,'ประเทศไทย'],[1945,'สยาม'],[1949,'ประเทศไทย']]){
await page.goto(`http://localhost:8000/?year=${year}&polity=${catalog.index[year<1940?'Siam':'Thailand']}`);await page.waitForFunction(()=>window.historyState?.snapshot&&!document.querySelector('#loading-status')?.textContent);
await page.locator('.self-designation').waitFor();assert((await page.locator('.self-designation').allTextContents()).join('').includes(original));
}
assert(!endonyms['p-5297ef5e3e52edf7'].some(e=>1800>=e.fromYear&&1800<=e.toYear));assert(!endonyms['p-3f9240c552e4446e'].some(e=>1919>=e.fromYear&&1919<=e.toYear));
console.log('v17 endonym period checks passed');
const fs=require('node:fs'),crypto=require('node:crypto');const font=fs.readdirSync('dist/assets/fonts').find(n=>n.endsWith('.woff2'));assert(font);const bytes=fs.readFileSync('dist/assets/fonts/'+font);assert(font.includes(crypto.createHash('sha256').update(bytes).digest('hex').slice(0,16)));assert(bytes.length<30000);assert(fs.existsSync('dist/assets/fonts/OFL-NotoSansMongolian.txt'));
await page.goto('http://localhost:8000/dist/?year=1800&polity='+catalog.index['Qing Empire']);await page.locator('.mongolian-text').waitFor();await page.evaluate(()=>document.fonts.ready);
const session=await page.context().newCDPSession(page);await session.send('DOM.enable');await session.send('CSS.enable');const {root}=await session.send('DOM.getDocument');const {nodeId}=await session.send('DOM.querySelector',{nodeId:root.nodeId,selector:'.mongolian-text'});const {fonts}=await session.send('CSS.getPlatformFontsForNode',{nodeId});assert(fonts.some(f=>f.isCustomFont&&f.glyphCount>0));
console.log('v17 fingerprinted dist font renders actual glyphs');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
