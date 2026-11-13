const {chromium}=require('playwright'),fs=require('node:fs');
const phase=process.argv[2]||'after',base=process.env.BASE_URL||'http://localhost:8025/dist',out=`artifacts/v21-${phase}`;
fs.mkdirSync(out,{recursive:true});
const ready=p=>p.waitForFunction(()=>window.historyState?.layer&&!historyState.boundariesPending&&document.querySelector('#map-status').hidden);
(async()=>{const b=await chromium.launch({args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
for(const [width,height] of [[1280,800],[390,844],[320,568]]){const c=await b.newContext({viewport:{width,height},isMobile:width<760,hasTouch:width<760}),p=await c.newPage();const shot=async name=>{await p.screenshot({path:`${out}/${width}-${name}.png`});};
await p.goto(base+'/?year=1500');await ready(p);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);await shot('default-1500');
await p.locator('#intro-toggle').click();await shot('intro-expanded');await p.locator('#intro-toggle').click();
if(width<760)await p.locator('#sheet-toggle').click();await shot('events');if(width<760)await p.locator('#sheet-toggle').click();
await p.locator('#time-options-toggle').click();await shot('timeline');await p.locator('#time-options-toggle').click();
await p.locator('#legend-toggle').evaluate(e=>{if(getComputedStyle(e).display!=='none')e.click()});await shot('legend');await p.locator('#legend-toggle').evaluate(e=>{if(e.getAttribute('aria-expanded')==='true')e.click()});
await p.locator('#about-button').click();await shot('about');await p.locator('#close-about').click();
await p.locator('#polity-open').click();await p.locator('#polity-scope').selectOption('all');await p.locator('#polity-search').fill('漢');await p.locator('#polity-list button').first().waitFor();await shot('search-han');
await p.locator('#polity-search').fill('不存在abcdef');await shot('empty-search');await p.locator('#polity-search').fill('漢朝');await p.locator('#polity-list button').first().click();await p.locator('.read-full').waitFor();await shot('polity-popup');await p.locator('.read-full').click();await shot('reader');await p.locator('#reading-close').click();await p.keyboard.press('Escape');
await p.locator('#year-form').evaluate(f=>{f.querySelector('input').value=-900000;f.requestSubmit()});await ready(p);if(width<760)await p.locator('#sheet-toggle').click();await shot('empty-events');await c.close();
const lc=await b.newContext({viewport:{width,height}}),lp=await lc.newPage();let release;const gate=new Promise(r=>release=r);await lc.route('**/data/snapshots*.json*',async r=>{await gate;await r.continue()});await lp.goto(base+'/?year=1500',{waitUntil:'domcontentloaded'});await lp.locator('#map-skeleton:not([hidden])').waitFor();await lp.waitForTimeout(200);await lp.screenshot({path:`${out}/${width}-loading.png`});release();await lc.close();console.log(phase,width);
}
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
