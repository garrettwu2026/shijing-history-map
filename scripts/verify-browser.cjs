// Run after starting the static server: NODE_PATH=/path/to/node_modules node scripts/verify-browser.cjs
const {chromium}=require('playwright');
const path=require('path');
const fs=require('fs');
const artifacts=path.resolve(__dirname,'../artifacts');fs.mkdirSync(artifacts,{recursive:true});
(async()=>{
 const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
 const errors=[];const results=[];
 for(const [width,height] of [[1440,900],[390,844]]){
 const page=await b.newPage({viewport:{width,height},isMobile:width===390,hasTouch:width===390});
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 for(const year of [-5000,-100,200,1200,1300,1700,2011,2026]){
 await page.goto(`http://localhost:8000/?year=${year}`,{waitUntil:'networkidle'});
 await page.waitForFunction(()=>document.querySelector('#snapshot-label').textContent.startsWith('疆界快照：'));
 await page.evaluate(()=>document.fonts.ready);
 await page.waitForTimeout(300);
 const metrics=await page.evaluate(()=>({year:document.querySelector('#year-display').textContent,labels:[...document.querySelectorAll('.polity-label')].map(x=>x.textContent),events:document.querySelectorAll('.event-item').length,note:document.querySelector('#snapshot-note').textContent,overflow:document.documentElement.scrollWidth>innerWidth,map:document.querySelector('#map').getBoundingClientRect().toJSON(),sheet:document.querySelector('.events-panel').getBoundingClientRect().toJSON(),dock:document.querySelector('.time-dock').getBoundingClientRect().toJSON()}));
 if(metrics.overflow)throw Error(`Horizontal overflow: ${width}/${year}`);
 if(year>2010&&!metrics.note.includes('止於 2010'))throw Error('Post-2010 border note missing');
 if(width===1440&&year===200&&!metrics.labels.some(l=>l.includes('羅馬帝國')))throw Error('Rome label missing');
 if(width===1440&&year===200&&!metrics.labels.some(l=>l.includes('漢朝')))throw Error('Han label missing');
 if(width===1440&&year===1200&&!metrics.labels.some(l=>l.includes('蒙古各部')))throw Error('Mongol correction label missing');
 const collisions=await page.evaluate(()=> {
   const rects=[...document.querySelectorAll('.polity-label')].map(el=>el.getBoundingClientRect());
   return rects.some((r,i)=>rects.slice(i+1).some(q=>r.left<q.right&&r.right>q.left&&r.top<q.bottom&&r.bottom>q.top));
 });
 if(collisions)throw Error(`Label collision: ${width}/${year}`);
 if(width===390&&metrics.sheet.height>50)throw Error('Mobile sheet should start collapsed');
 results.push({width,selectedYear:year,...metrics});
 if(year===200||year===1200||year===2026)await page.screenshot({path:path.join(artifacts,`history-${width}-${year}.png`)});
 }
 if(width===390)await page.locator('#sheet-toggle').click();
 if(await page.locator('.category-chip').count()!==6)throw Error('Six category filters required');
 for(const chip of await page.locator('.category-chip').all())await chip.click();
 if(await page.locator('.event-marker').count()!==0)throw Error('Disabled categories still show markers');
 if(await page.locator('.event-item').count()!==0)throw Error('All categories disabled should show no events');
 await page.locator('.category-chip').filter({hasText:'王朝與政治'}).click();
 if(await page.locator('.event-item').count()===0)throw Error('Political category empty unexpectedly');
 await page.locator('.event-item').first().click();await page.waitForTimeout(1500);
 if(width===390&&await page.locator('#sheet-toggle').getAttribute('aria-expanded')!=='false')throw Error('Sheet should close after selecting event');
 if(!(await page.locator('.leaflet-popup-content').textContent()))throw Error('Event popup missing');
 await page.locator('#events-toggle').click();if(await page.locator('.event-marker').count())throw Error('Markers not hidden');
 await page.locator('#labels-toggle').click();await page.waitForTimeout(300);if(await page.locator('.polity-label').count())throw Error('Labels not hidden');
 await page.locator('#about-button').click();await page.locator('#close-about').click();
 if(width===390){await page.locator('#sheet-toggle').click();await page.screenshot({path:path.join(artifacts,'mobile-expanded.png')});if(await page.locator('#sheet-toggle').getAttribute('aria-expanded')==='true')await page.locator('#sheet-toggle').click();}
 await page.locator('#year-input').fill('1200');await page.locator('#year-form button').click();await page.waitForTimeout(300);
 await page.locator('#play-button').click();await page.waitForTimeout(1600);await page.locator('#play-button').click();
 if(await page.locator('#year-input').inputValue()==='1200')throw Error('Playback did not advance');
 await page.close();
 }
 fs.writeFileSync(path.join(artifacts,'browser-report.json'),JSON.stringify({results,errors},null,2)+'\n');console.log(JSON.stringify({results,errors},null,2));await b.close();if(errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
