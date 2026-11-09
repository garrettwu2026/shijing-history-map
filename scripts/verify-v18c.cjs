const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const events = require('../data/events.json');
const details = require('../data/event-details.json');
const progress = require('./v18c-tech-progress.json').task22;
const baseline = new Set(progress.baselineEventIds);
const added = events.filter(e => !baseline.has(e.id));
const fs = require('node:fs');
const places = require('./v18c-tech-places.json');
const registry = require('../data/event-id-registry.json');
const narratives = require('./v18c-tech-narratives.json');
const catalog = require('../data/polities.json').index;
const authored = fs.readFileSync(require.resolve('./v18c-tech.tsv'),'utf8')
  .split('\n').filter(line=>line && !line.startsWith('#')).map(line=>line.split('|'));

(async () => {
  assert(added.length >= 500);
  assert.equal(added.length,authored.length,'all authored additions saved exactly once');
  assert.equal(progress.completed,added.length,'checkpoint count matches saved events');
  assert.deepEqual(new Set(progress.completedEventIds),new Set(added.map(e=>e.id)),
    'checkpoint identities match saved events');
  assert(progress.baselineEventIds.every(id=>events.some(e=>e.id===id)),
    'all baseline event identities preserved');
  for (const event of added) {
    assert.equal(event.category,'科技與發明');
    const item=details[event.id];
    assert(item,`complete details: ${event.title}`);
    for (const [field,min,max] of [['description',100,250],['背景',50,150],['經過',50,150],['影響',50,150]]) {
      assert(typeof item[field]==='string' && [...item[field]].length>=min && [...item[field]].length<=max,
        `${event.title}: ${field} length`);
    }
  }
  for(const [year,title,place] of authored) {
    const event=added.find(e=>e.id===registry[title]);
    assert(event,`registered addition: ${title}`);
    const [lat,lon,region,polity]=places[place];
    assert.deepEqual([event.title,event.year,event.lat,event.lon,event.region],
      [title,Number(year),lat,lon,region],`authored date and location: ${title}`);
    assert.deepEqual(details[event.id]['參與方'],[catalog[polity]],`existing polity: ${title}`);
    assert.equal(event.description,details[event.id].description);
    if(narratives[title]) {
      for(const field of ['背景','經過','影響']) {
        assert.equal(details[event.id][field],narratives[title][field],`authored narrative: ${title} ${field}`);
      }
    }
  }
  const {positionFor, yearFor} = await import('../modules/timeline.js');
  for (const year of [-1000000,-20000,-5000,-1000,500,1500,1900,2026]) {
    assert.equal(yearFor(positionFor(year)),year,'timeline round trip');
    assert(positionFor(year)>=0 && positionFor(year)<=1000);
  }
  const browser = await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try {
    for (const width of [1440,320]) {
      const page = await browser.newPage({viewport:{width,height:width===320?568:900}});
      const errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.route('**/app.js',async route=>{
        const response=await route.fetch();
        await route.fulfill({response,body:(await response.text()).replace('  init();','  window.v18cTest={selectEvent};\n  init();')});
      });
      await page.goto('http://localhost:8000/?year=-1000000');
      await page.waitForFunction(()=>window.historyState?.snapshot && document.querySelector('#map-status').hidden);
      assert.equal(await page.evaluate(()=>historyState.year),-1000000);
      assert.equal(await page.locator('#year-input').getAttribute('min'),'-1000000');
      assert((await page.locator('#snapshot-note').textContent()).includes('早於最早'));
      const fire=added.find(e=>e.year===-1000000);
      await page.evaluate(e=>v18cTest.selectEvent(e),fire);
      await page.locator('.event-details').waitFor();
      assert.equal(await page.locator('.event-description').textContent(),details[fire.id].description);
      await page.locator('.event-details summary').click();
      assert.equal(await page.locator('.event-details .polity-chip').count(),1);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      await page.goto('http://localhost:8000/?year=1971');
      await page.waitForFunction(()=>window.historyState?.snapshot && document.querySelector('#map-status').hidden);
      if(width===320) await page.locator('#sheet-toggle').click();
      for(const chip of await page.locator('.category-chip').all()) {
        if(!(await chip.textContent()).includes('科技與發明')) await chip.click();
      }
      await page.waitForFunction(()=>document.querySelectorAll('.event-item').length>0);
      const titles=await page.locator('.event-item').allTextContents();
      assert(titles.some(t=>t.includes('微處理器')),'new technology available through existing filter');
      assert.deepEqual(errors,[]);
      await page.close();
    }
    const page=await browser.newPage();
    await page.goto('http://localhost:8000/dist/?year=-1000000');
    await page.waitForFunction(()=>window.historyState?.snapshot && document.querySelector('#map-status').hidden);
    assert.equal(await page.evaluate(()=>historyState.year),-1000000);
    await page.close();
    console.log('v18c: 500+ additions, timeline round trips, prehistoric navigation, details, polity links, technology filter, 320px layout and built assets passed');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
