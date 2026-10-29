const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const catalog = require('../data/polities.json');
const intros = require('../data/intros.json');
const details = require('../data/event-details.json');
const events = require('../data/events.json');
const root = 'http://localhost:8000';
(async () => {
  const browser = await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  try {
    for (const width of [1440,320]) {
      const page = await browser.newPage({viewport:{width,height:width===320?568:900}});
      const requested=[];const errors=[];
      page.context().on('request',r=>requested.push(r.url()));
      page.on('pageerror',e=>errors.push(e.message));
      await page.route('**/app.js', async route=>{
        const response=await route.fetch();
        await route.fulfill({response,body:(await response.text()).replace('  init();','  window.v18bTest={state,selectEvent};\n  init();')});
      });
      await page.goto(root+'/?year=200');
      await page.waitForFunction(()=>window.historyState?.snapshot && document.querySelector('#map-status').hidden);
      assert(!requested.some(u=>/\/(intros|event-details)(\.|\/)/.test(u)),'details fetched before first popup');
      const event=events.find(e=>e.id==='e0115');
      await page.evaluate(e=>v18bTest.selectEvent(e),event);
      await page.locator('.event-details').waitFor();
      assert.equal(requested.filter(u=>new URL(u).pathname.endsWith('/data/event-details.json')).length,1);
      assert.equal(await page.locator('.event-description').textContent(),details[event.id].description);
      await page.locator('.event-details summary').click();
      assert.deepEqual(await page.locator('.event-details h4').allTextContents(),['背景','經過','影響','參與方']);
      const chip=page.locator('.event-details .polity-chip').first();
      assert.equal(await chip.getAttribute('data-focus-polity'),details[event.id]['參與方'][0]);
      await chip.click();
      await page.locator('.polity-intro').waitFor();
      const pid=details[event.id]['參與方'][0];
      await page.waitForFunction(id=>historyState.selectedPolity===id,pid);
      assert.equal(await page.locator('[data-intro-id]').getAttribute('data-intro-id'),pid);
      await page.locator('.polity-intro summary').click();
      assert.equal(await page.locator('.detail-chronology li').count(),intros[pid]['年表'].length);
      assert.equal(await page.locator('.detail-values dt').count(),intros[pid]['重要人物'].length+Object.keys(intros[pid]['關鍵數據']||{}).length);
      assert((await page.locator('.polity-intro').textContent()).includes(intros[pid]['背景']));
      const overflow=await page.evaluate(()=>({page:document.documentElement.scrollWidth>innerWidth,popup:[...document.querySelectorAll('.maplibregl-popup-content')].some(e=>e.scrollWidth>e.clientWidth+1)}));
      assert.deepEqual(overflow,{page:false,popup:false});
      assert((await page.locator('.time-dock').boundingBox()).height<=(width===320?96:72));
      await page.screenshot({path:`artifacts/v18b-${width}.png`});
      await page.evaluate(e=>v18bTest.selectEvent(e),event);
      await page.locator('.event-details').waitFor();
      assert.equal(requested.filter(u=>new URL(u).pathname.endsWith('/data/event-details.json')).length,1,'event details should be cached');
      assert.equal(requested.filter(u=>new URL(u).pathname.endsWith('/data/intros.json')).length,1,'intros should be cached');
      assert.deepEqual(errors,[]);
      await page.close();
    }
    const page=await browser.newPage();
    await page.goto(root+'/dist/?year=200&polity='+catalog.index['Roman Empire']);
    await page.locator('.detail-chronology').waitFor({state:'attached'});
    assert.equal(await page.locator('.detail-chronology li').count(),intros[catalog.index['Roman Empire']]['年表'].length);
    await page.close();
    console.log('v18b: lazy loading, cache, event fields, polity focus, structured intro, compact timeline, 320px layout and built assets passed');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
