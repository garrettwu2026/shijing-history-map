const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const intros=require('../data/intros.json'),catalog=require('../data/polities.json');
const root=process.env.BASE_URL||'http://localhost:8000/dist';
const ready=p=>p.waitForFunction(()=>historyState?.snapshot&&document.querySelector('#map-status').hidden);
const select=async(p,y)=>{await p.locator('#year-form').evaluate((f,y)=>{f.querySelector('input').value=y;f.requestSubmit()},y);await ready(p)};
(async()=>{
 const browser=await chromium.launch({args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const report=[];
 try{
 for(const [width,height] of [[1280,800],[390,844]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto(root+'/?year=2026');await ready(page);
  const fonts=await page.evaluate(()=>['year-display','boundary-indicator'].map(id=>parseFloat(getComputedStyle(document.getElementById(id)).fontSize)));
  assert(fonts[0]>=16&&fonts[1]>=12);
  await page.locator('#boundary-warning').click();assert.match(await page.locator('#boundary-warning-text').innerText(),/2010/);await page.locator('#boundary-warning').click();
  assert.equal(await page.locator('.slider-wrap .timeline-ticks span:visible').count(),7);
  await page.locator('#year-slider').evaluate(el=>{el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));el.value=640;el.dispatchEvent(new Event('input',{bubbles:true}));});
  assert.equal(await page.locator('#year-bubble').innerText(),await page.locator('#year-display').innerText());
  await page.evaluate(()=>window.dispatchEvent(new PointerEvent('pointerup')));await ready(page);
  await select(page,-300);
  const cluster=page.locator('.event-marker[aria-label^="查看這裡的"]').first();
  if(await cluster.count()){
    assert.match(await cluster.getAttribute('title'),/查看這裡的 \d+ 件事件/);
    await cluster.evaluate(el=>el.click());await page.locator('.cluster-list button').first().waitFor();
    assert.match(await page.locator('.cluster-list button').first().innerText(),/ · .+ · (約 )?西元/);
    await page.keyboard.press('Escape');
  }
  await page.locator('#polity-open').click();assert(await page.locator('#polity-dialog').isVisible());
  await page.locator('#polity-scope').selectOption('all');await page.locator('#polity-search').fill('漢');
  const han=page.locator('#polity-list button').filter({hasText:'漢朝'}).first();await han.waitFor();assert.match(await han.innerText(),/可用疆界年.*前往/);
  const target=Number(await han.getAttribute('data-year'));await han.click();await page.locator('.polity-intro').waitFor();
  assert.equal(await page.evaluate(()=>historyState.year),target);assert.equal(await page.evaluate(()=>historyState.snapshot.year),target);
  assert.match(await page.locator('.popup-title').innerText(),/漢/);
  const pid=await page.locator('[data-intro-id]').getAttribute('data-intro-id'),intro=intros[pid];
  await page.locator('.read-full').click();assert(await page.locator('#reading-panel').isVisible());
  const full=await page.locator('#reading-content').innerText();
  for(const field of ['summary','背景','影響'])if(intro[field])assert(full.includes(intro[field]),field+' retained');
  for(const item of intro['年表']||[])assert(full.includes(item.text));
  for(const field of ['存續年代','首都','主要族群/語言'])if(intro[field])assert(full.includes(intro[field]));
  assert.equal(await page.locator('#reading-content .detail-chronology li').count(),intro['年表'].length);
  if(width>760){const before=(await page.locator('#reading-panel').boundingBox()).width;await page.locator('#reader-resize').focus();await page.keyboard.press('ArrowLeft');assert((await page.locator('#reading-panel').boundingBox()).width>before);}
  else assert((await page.locator('#reading-panel').boundingBox()).height>height*.65);
  await page.screenshot({path:`artifacts/v19-${width}-reader.png`});
  await page.locator('#reading-close').click();assert(!await page.locator('#reading-panel').isVisible());await page.keyboard.press('Escape');
  await select(page,1400);
  if(width<760){
   await page.locator('#legend-toggle').click();assert(await page.locator('#map-legend').isVisible());await page.locator('#legend-toggle').click();assert(!await page.locator('#map-legend').isVisible());
   await page.locator('#technology-only').click();await page.waitForFunction(()=>[...document.querySelectorAll('.category-chip[aria-pressed=true]')].length===1);
   await page.locator('#sheet-toggle').click();
   const sheet=await page.locator('#events-panel').boundingBox(),map=await page.locator('#map').boundingBox();assert(sheet.height<map.height*.6&&sheet.y>map.y+80);
   await page.waitForFunction(()=>[...document.querySelectorAll('.event-item time')].every(el=>el.textContent.includes('科技與發明')));
   const handle=await page.locator('#sheet-toggle').boundingBox();await page.mouse.move(handle.x+100,handle.y+20);await page.mouse.down();await page.mouse.move(handle.x+100,handle.y-60,{steps:8});await page.mouse.up();assert((await page.locator('#events-panel').boundingBox()).height>sheet.height+30);
   await page.locator('#categories-all').click();
  }
  const detailed=await page.locator('.event-item').evaluateAll((rows,ids)=>rows.find(row=>ids.includes(row.dataset.id))?.dataset.id,Object.keys(require('../data/event-details.json')));assert(detailed,'visible event with complete details');
  await page.locator(`.event-item[data-id="${detailed}"]`).click();await page.locator('.event-details').waitFor();await page.locator('.event-details summary').click();
  const eventId=await page.locator('[data-event-detail]').getAttribute('data-event-detail');
  await page.locator('.goto-event').click();await ready(page);
  await page.waitForFunction(id=>document.querySelector('[data-event-detail]')?.dataset.eventDetail===id&&document.querySelector('.event-details')?.open,eventId);
  assert.equal(await page.locator('#play-button').getAttribute('aria-pressed'),'false');
  await page.screenshot({path:`artifacts/v19-${width}-event.png`});await page.keyboard.press('Escape');
  if(width<760&&await page.locator('#sheet-toggle').getAttribute('aria-expanded')!=='true')await page.locator('#sheet-toggle').click();
  for(const chip of await page.locator('.category-chip').all())if(await chip.getAttribute('aria-pressed')==='true')await chip.click();
  await page.waitForFunction(()=>document.querySelector('.empty-events')?.textContent.includes('全部關閉'));
  await page.getByRole('button',{name:'恢復全部分類',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.category-chip[aria-pressed=true]').length===6);
  const style=await page.evaluate(()=>({review:historyMap.getPaintProperty('disputed-line','line-dasharray'),culture:historyMap.getPaintProperty('culture-line','line-dasharray')}));assert.notDeepEqual(style.review,style.culture);
  await select(page,-900000);await page.waitForFunction(()=>document.querySelector('.empty-events')?.textContent.includes('此年代'));
  await page.getByRole('button',{name:'擴大探索範圍至前後 500 年',exact:true}).click();assert.equal(await page.locator('#window-select').inputValue(),'500');
  await page.screenshot({path:`artifacts/v19-${width}-overview.png`});
  assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth));assert.deepEqual(errors,[]);report.push({width,height,fonts,searchJump:target,readerPreserved:true,eventRetained:true,errors});await page.close();
 }
 // Delay and fail detail requests: visible progress and retry without replacing the map.
 const page=await browser.newPage({viewport:{width:390,height:844}});let fail=true;
 await page.route('**/intros.*.json*',async route=>{await new Promise(r=>setTimeout(r,400));if(fail){fail=false;await route.abort();}else await route.continue()});
 await page.goto(root+'/?year=200&polity='+catalog.index['Roman Empire']);
 await page.getByText('正在載入政體介紹…',{exact:true}).waitFor();await page.locator('.intro-retry').click();await page.locator('.read-full').waitFor();
 report.push({detailLoading:true,retry:true});await page.close();
 fs.writeFileSync('artifacts/v19-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
