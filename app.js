import {renderEventsView} from './modules/events.js';
import {renderLabelsView,createMap,showPopup,renderGeometry,polityBounds,warmLabelGlyphs} from './modules/map.js';
import {createDataClient} from './modules/data.js';
import {positionFor,yearFor} from './modules/timeline.js';
import {eventDistance,intersects,regionFor,stableColor,nameDisplay,createNameDisplay} from './modules/content.js';
'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const MIN = -5000, MAX = 2026;
  const categories = {'戰爭':['#ed9588','⚔'],'王朝與政治':['#dfbc7d','♛'],'科技與發明':['#7ed1db','⚙'],'宗教與思想':['#c7a4ec','✧'],'文化與藝術':['#eea9cc','◆'],'探索與貿易':['#a8d394','➶']};
  const enabledCategories = new Set(Object.keys(categories));
  const state = {year: -300, snapshots: [], names: {}, events: [], cache: new Map(), layer: null, snapshot: null, request: 0, timer: null, playing: false, playGeneration: 0, labels: true, markers: true, window: 50, activeEvent: null};
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const yearText = y => y < 0 ? `西元前 ${Math.abs(y).toLocaleString('zh-TW')} 年` : `西元 ${y.toLocaleString('zh-TW')} 年`;
  const singleDate = e => `${e.dateNote === '約' ? '約 ' : ''}${yearText(e.year)}${e.dateNote === '傳統' ? '（傳統紀年）' : ''}`;
  const eventDate = e => e.startYear!==e.endYear ? `${yearText(e.startYear)} — ${yearText(e.endYear)}${e.precision==='approximate'?'（約）':''}` : singleDate(e);
  const era = y => y < -1200 ? '古代' : y < 500 ? '古代' : y < 1450 ? '中古' : y < 1800 ? '近世' : y < 1945 ? '近代' : '當代';
  const status = (message = '') => { $('loading-status').textContent=message; $('map-status').textContent = message; $('map-status').hidden = !message; };
  let map, eventLayer, borderTimer, prefetchHandle;

  let displayText=value=>String(value??'');
  let refreshFrame=null, eventsDirty=false, labelsDirty=false;
  function scheduleRefresh(events=false){
    eventsDirty ||= events; labelsDirty=true;
    if(refreshFrame!=null)return;
    refreshFrame=requestAnimationFrame(()=>{
      refreshFrame=null;
      if(eventsDirty){eventsDirty=false;renderEventsView({state,map,eventLayer,enabledCategories,categories,$,eventDate,esc,selectEvent,displayText,yearText,setPlaying,setYear});if(labelsDirty){scheduleRefresh();return;}}
      if(labelsDirty&&!state.dragging&&!state.boundariesPending&&!state.geometryPending){
        labelsDirty=false;const start=performance.now();renderLabelsView({state,map,isAntarctica,nameFor,esc});
        const profile=window.historyProfiles?.at(-1);if(profile&&profile.labelPasses===0){profile.labelsMs=performance.now()-start;profile.totalMs+=profile.labelsMs;profile.labelPasses=1;}
      }
    });
  }
  function updateURL(){const url=new URL(location.href);url.searchParams.set('year',state.year);if(state.selectedPolity)url.searchParams.set('polity',state.selectedPolity);else url.searchParams.delete('polity');history.replaceState(null,'',url);}
  function nameFor(key) {
    const cacheKey=`${state.snapshot?.year??state.year}|${state.year}|${key}`;
    if(state.nameCache?.has(cacheKey))return state.nameCache.get(cacheKey);
    const p=state.catalog?.polities[state.catalog.index[key]];
    if(!p)return {zh:'',native:'',aliases:[],importance:0,nameStatus:'pending'};
    const year=state.snapshot?.year ?? state.year;
    const period=p.periods.find(n=>year>=n.fromYear&&year<=n.toYear);
    const correction=state.errata?.overrides.find(n=>year>=(n.fromYear??n.year)&&year<=(n.toYear??n.year)&&n.match===key);
    const endonyms=[...(state.endonyms?.[p.id]||[]).filter(n=>state.year>=n.fromYear&&state.year<=n.toYear),...p.endonyms.filter(n=>n.sourceStatus==='verified'&&n.sourceUrl&&year>=n.fromYear&&year<=n.toYear)].filter((n,i,all)=>all.findIndex(e=>e.original===n.original)===i);
    const result={...p,zh:correction?.zh||period?.zh||p.zh,translationStatus:correction?.translationStatus||period?.translationStatus||p.translationStatus,nameStatus:(correction?.translationStatus==='untranslated'||period?.translationStatus==='untranslated'||p.translationStatus==='untranslated'||p.terminologyStatus==='restored-v10')?'pending':'accepted',native:endonyms[0]?.original||'',endonyms,aliases:period?.aliases||[],correction};
    (state.nameCache ||= new Map()).set(cacheKey,result);return result;
  }
  // Identify the continent by geometry, including snapshots with a name.
  function isAntarctica(f) {
    const b=f.labelGeometry?.bounds;
    return b && b[1]<=-85 && b[3]<-60 && b[2]-b[0]>300;
  }
  function antarcticaHTML() {
    return `<div class="popup-kicker">地理區域 · ${esc(yearText(state.year))}</div><h3 class="popup-title">南極洲 Antarctica</h3><p>地理區域，非政體。無人定居（無永久居民；近現代有季節性與全年科研人員）。</p>${state.year>=1959?'<p>《南極條約》體系：條約於 1959 年簽署，1961 年生效；以和平利用及科學合作為原則。</p>':''}`;
  }
  let introsPromise;
  let eventDetailsPromise;
  const detailParagraphs=(item,labels)=>labels.filter(label=>item[label]).map(label=>`<h4>${label}</h4><p>${esc(item[label])}</p>`).join('');
  const compactValues=(label,rows)=>rows.length?`<h4>${label}</h4><dl class="detail-values">${rows.map(([key,value])=>`<dt>${esc(key)}</dt><dd>${esc(value)}</dd>`).join('')}</dl>`:'';
  const polityChip=(id,name)=>`<button type="button" class="polity-chip" data-focus-polity="${esc(id)}">${esc(name)}</button>`;
  function loadEventDetails(el) {
    const slot=el.querySelector('[data-event-detail]');
    if(!slot)return;
    slot.setAttribute('aria-busy','true');
    eventDetailsPromise ||= json('data/event-details.json').catch(error=>{eventDetailsPromise=null;throw error;});
    eventDetailsPromise.then(details=>{
      if(!slot.isConnected)return;
      slot.removeAttribute('aria-busy');
      const item=details[slot.dataset.eventDetail];
      if(!item){slot.remove();return;}
      el.querySelector('.event-description').textContent=item.description;
      slot.innerHTML=`<details class="event-details"><summary>事件詳情</summary>${detailParagraphs(item,['背景','經過','影響'])}<h4>參與方</h4><div class="polity-chips">${item['參與方'].map(id=>polityChip(id,state.catalog.polities[id].zh)).join('')}</div><p class="participant-note">${esc(item['參與方說明']||'點選政體可前往有疆界資料的年代。')}</p></details>`;
    }).catch(()=>{if(slot.isConnected){slot.removeAttribute('aria-busy');slot.innerHTML='<button type="button" class="event-details-retry">重新載入事件詳情</button>';}});
  }
  function loadIntro(el) {
    const slot=el.querySelector('[data-intro-id]');
    if(!slot)return;
    introsPromise ||= json('data/intros.json').catch(error=>{introsPromise=null;throw error;});
    introsPromise.then(intros=>{
      if(!slot.isConnected)return;
      const intro=intros[slot.dataset.introId];
      if(!intro){slot.remove();return;}
      const field=(label,value)=>value?`<p>${label}：${esc(value)}</p>`:'';
      slot.innerHTML=`<details class="polity-intro"><summary>政體介紹</summary><small>跨年代概述，不代表選取年的狀態。</small><p>${esc(intro.summary)}</p>${['存續年代','首都','主要族群/語言'].map(label=>field(label,intro[label])).join('')}${detailParagraphs(intro,['背景'])}${intro['年表']?.length?'<h4>年表</h4><ol class="detail-chronology">'+intro['年表'].map(item=>`<li><time>${esc(yearText(item.year))}</time> ${esc(item.text)}</li>`).join('')+'</ol>':''}${compactValues('重要人物',(intro['重要人物']||[]).map(person=>[person.name,person.role]))}${compactValues('關鍵數據',Object.entries(intro['關鍵數據']||{}))}${detailParagraphs(intro,['影響'])}${intro['重要事件'].length?'<h4>重要事件</h4><ul>'+intro['重要事件'].map(event=>`<li>${esc(event)}</li>`).join('')+'</ul>':''}${intro['前身/後繼'].length?'<h4>前身／後繼</h4><div class="polity-chips">'+intro['前身/後繼'].map(item=>item.id?polityChip(item.id,item.name):esc(item.name)).join('')+'</div>':''}</details>`;
    }).catch(()=>{if(slot.isConnected)slot.innerHTML='<button class="intro-retry" type="button">重新載入政體介紹</button>';});
  }
  document.addEventListener('click',event=>{if(event.target.closest('.intro-retry'))loadIntro(event.target.closest('[role="dialog"]'));});
  document.addEventListener('click',async event=>{
    if(event.target.closest('.event-details-retry'))loadEventDetails(event.target.closest('[role="dialog"]'));
    const chip=event.target.closest('[data-focus-polity]');
    if(!chip)return;
    const id=chip.dataset.focusPolity,polity=state.catalog.polities[id];
    if(!polity)return;
    const inSnapshot=()=>state.layer?.features.filter(f=>nameFor(f.properties?.NAME).id===id&&f.labelGeometry)||[];
    let layers=inSnapshot();
    if(!layers.length){
      // Catalog validity is snapshot coverage, not a claim about historical founding dates.
      const candidates=state.snapshots.filter(s=>s.year>=polity.validFrom&&s.year<=polity.validTo).sort((a,b)=>Math.abs(a.year-state.year)-Math.abs(b.year-state.year));
      for(const snapshot of candidates){
        const data=await snapshotData(snapshot).catch(()=>null);
        if(!data?.features.some(f=>state.catalog.index[f.properties?.NAME]===id))continue;
        setYear(snapshot.year);await loadBorders();layers=inSnapshot();break;
      }
    }
    if(layers.length)selectPolity(nameFor(layers[0].properties.NAME),layers[0].properties.NAME,layers);
    else status('此政體目前沒有可聚焦的疆界快照。');
  });
  function polityHTML(key) {
    const n=nameFor(key);
    const searchName=nameDisplay(n.zh||key,'',false).replace(/（[^）]*）|\([^)]*\)/g,'').trim()||key;
    const links=`<nav class="polity-links" aria-label="延伸查詢"><a href="https://www.google.com/search?q=${encodeURIComponent(searchName+' 歷史')}" target="_blank" rel="noopener">Google 搜尋</a><a href="https://zh.wikipedia.org/w/index.php?search=${encodeURIComponent(searchName)}&amp;variant=zh-tw" target="_blank" rel="noopener">維基百科</a></nav>`;
    const field=(label,value)=>value?.trim()?`<p dir="auto"${/[\u1800-\u18af]/u.test(value)?' class="mongolian-text"':''}>${label}：${esc(value)}</p>`:'';
    return `<div class="popup-kicker">疆界年：${esc(yearText(state.snapshot.year))}</div><h3 class="popup-title">${esc(nameDisplay(n.zh||key,n.nameStatus))}</h3>${links}<div data-intro-id="${esc(n.id||'')}"></div>${field('實體類型',({'polity-or-community':'政體或社群','cultural-area':'文化分布區','people':'民族／族群'})[n.entityType]||'區域')}${!n.endonyms?.length&&n.importance>=8?'<p class="self-designation-pending">自稱待考證</p>':''}${(n.endonyms||[]).map(e=>'<section class="self-designation"><h4>當時自稱</h4>'+field('原文',e.original)+field('轉寫',e.transliteration)+field('中文意譯',e.meaning)+field('語言',e.language)+field('用稱性質',e.kind)+field('使用時期',e.period||`${yearText(e.fromYear)}至${yearText(e.toYear)}`)+'</section>').join('')}${field('他稱／後世稱呼',(n.exonyms||[]).filter(Boolean).join('、'))}${field('地理別稱',(n.geographicAliases||[]).filter(Boolean).join('、'))}${field('資料集名稱',key)}${n.translationStatus==='untranslated'?'<p>譯名待考：保留來源原文，尚未取得合格的譯名依據。</p>':''}${n.correction?`<p class="correction">${n.correction.nameStatus==='corrected'?'名稱已修正；疆界待考證':'名稱及疆界待考證'}：${esc(n.correction.note)}</p>`:''}<small>疆界為概略重建。</small>`;
  }
  function eventHTML(e) { return `<div class="popup-event"><div class="popup-kicker">${esc(eventDate(e))} · ${esc(e.category)}</div><h3 class="popup-title">${esc(displayText(e.title))}</h3><p class="event-description">${esc(displayText(e.description))}</p><div data-event-detail="${esc(e.id)}" aria-live="polite"></div><p>選取年：${esc(yearText(state.year))}<br>疆界年：${esc(yearText(state.snapshot?.year||state.year))}<br>事件年：${esc(eventDate(e))}</p><button class="goto-event" data-event="${esc(e.id)}">切換到事件年代</button></div>`; }
  const {json} = createDataClient();
  function snapshotData(s, prefetch=false) {
    const materialize=entry=>prefetch?entry.promise:entry.promise.then(data=>{if(data.bytes){entry.data ||= JSON.parse(new TextDecoder().decode(data.bytes));return entry.data;}return data;});
    if(state.cache.has(s.file)){const hit=state.cache.get(s.file);state.cache.delete(s.file);state.cache.set(s.file,hit);return materialize(hit);}
    const controller=new AbortController();
    const entry={controller,promise:null,ready:false};
    entry.promise=json(`data/${s.file}`,controller.signal,true).then(data=>{entry.ready=true;return data;}).catch(error=>{if(state.cache.get(s.file)===entry)state.cache.delete(s.file);throw error;});
    state.cache.set(s.file,entry);
    while(state.cache.size>10){const key=state.cache.keys().next().value;state.cache.get(key).controller.abort();state.cache.delete(key);}
    return materialize(entry);
  }
  function cancelObsolete(s) {
    if(prefetchHandle!=null){(window.cancelIdleCallback || clearTimeout)(prefetchHandle);prefetchHandle=null;}
    const i=state.snapshots.indexOf(s), keep=new Set(state.snapshots.slice(Math.max(0,i-2),i+3).map(x=>x.file));
    keep.add('world_2010.geojson');
    for(const [key,entry] of state.cache)if(!entry.ready&&!keep.has(key)){entry.controller.abort();state.cache.delete(key);}
  }
  function prefetchAdjacent(s) {
    if(navigator.connection?.saveData || /2g/.test(navigator.connection?.effectiveType||''))return;
    const idle=window.requestIdleCallback || (callback=>setTimeout(callback,250));
    (window.cancelIdleCallback || clearTimeout)(prefetchHandle);
    prefetchHandle=idle(()=>{prefetchHandle=null;if(state.snapshot!==s)return;const i=state.snapshots.indexOf(s);for(const offset of [-1,1,-2,2]){const next=state.snapshots[i+offset];if(next)snapshotData(next,true).catch(()=>{});}});
  }
  function snapshotFor(year) { return state.snapshots.filter(s => s.year <= year).at(-1) || state.snapshots[0]; }
  function updateBoundaryIndicator(pending=false) {
    const shown=state.snapshot?.year;
    $('boundary-indicator').textContent=`疆界年 ${shown==null?'載入中':shown<0?'前'+Math.abs(shown):shown}`;
    const notes=[pending?'正在更新疆界；目前仍顯示原快照':'',state.year>2010?'最新疆界至 2010 年，並非當代精確國界':'',shown===1200?'蒙古疆界待查證（疆界待考證）':'',shown!=null&&shown!==state.year?`選取年與疆界年相差 ${Math.abs(state.year-shown)} 年`:''].filter(Boolean);
    $('boundary-warning').hidden=!notes.length;
    $('boundary-warning').title=notes.join('；');
    $('boundary-warning-text').textContent=notes.join('；');
    for(const delta of [-1,1])$('snapshot-'+(delta<0?'prev':'next')).disabled=!state.snapshots.some(s=>s.year>=MIN&&s.year<=MAX&&(delta<0?s.year<state.year:s.year>state.year));
  }
  function updateSnapshotCaption(s, pending = false) {
    updateBoundaryIndicator(pending);
    $('snapshot-note').classList.toggle('boundary-warning',state.year>2010);
    $('snapshot-label').textContent = `${pending ? '正在載入' : '疆界快照'}：${yearText(s.year)}`;
    $('snapshot-note').textContent = pending ? '地圖正在更新，請稍候' : state.year < s.year ? '早於最早可用資料，顯示最早快照' : state.year > state.snapshots.at(-1).year ? '最新疆界資料止於 2010 年，並非當代精確國界' : s.year === state.year ? '選取年份與疆界快照相同' : `使用選取年份之前最近的快照，相差 ${state.year - s.year} 年`;
  }
  async function loadBorders() {
    const s = snapshotFor(state.year);
    const token = ++state.request;
    cancelObsolete(s);
    if (state.snapshot?.file === s.file) { updateSnapshotCaption(s); status(); state.boundariesPending=false;restoreSelection();renderLabels(); prefetchAdjacent(s); return; }
    state.boundariesPending=true;
    updateSnapshotCaption(s, true);
    status('正在展開歷史疆界…');
    try {
      const start=performance.now(),snapshot=await snapshotData(s),fetched=performance.now();
      const antarctica=state.baseline?.features.find(isAntarctica);
      const data=snapshot.features.some(isAntarctica)||!antarctica?snapshot:{...snapshot,features:[...snapshot.features,antarctica]};
      if(token!==state.request)return;
      state.snapshot=s;state.nameCache=new Map();
      renderGeometry(map,data,state,isAntarctica,stableColor);
      state.layer=data;state.boundariesPending=false;
      restoreSelection();
      if($('polity-dialog').open)renderPolities();
      $('polity-count').textContent=`${new Set(data.features.filter(f=>!isAntarctica(f)).map(f=>f.properties?.NAME).filter(Boolean)).size} 個政體與區域`;
      updateSnapshotCaption(s);renderLabels();status();
      (window.historyProfiles ||= []).push({year:s.year,fetchMs:fetched-start,buildMs:performance.now()-fetched,labelsMs:0,labelPasses:0,totalMs:performance.now()-start});
      prefetchAdjacent(s);
    } catch(error) {
      if(token!==state.request||error.name==='AbortError')return;
      state.geometryPending=false;state.boundariesPending=false;updateBoundaryIndicator();
      $('snapshot-label').textContent='疆界載入失敗';
      status('無法更新疆界，請檢查連線並重試。');
      const retry=document.createElement('button');retry.textContent='重試疆界';retry.onclick=loadBorders;$('map-status').append(retry);setPlaying(false);
    }
  }
  function renderLabels(){scheduleRefresh();}
  function selectEvent(e) {
    state.returnFocus=matchMedia('(max-width:760px)').matches ? $('sheet-toggle') : document.activeElement; state.activeEvent = e.id;
    if(matchMedia('(max-width:760px)').matches && $('events-panel').classList.contains('expanded')) $('sheet-toggle').click();
    document.querySelectorAll('.event-item').forEach(el => el.classList.toggle('active', el.dataset.id === e.id));
    const zoom = Math.max(map.getZoom(), 4);
    map.stop(); map.jumpTo({center:[e.lon,e.lat],zoom});
    showPopup(map,[e.lon,e.lat],eventHTML(e));
  }
  function renderEvents(){scheduleRefresh(true);}
  function setYear(raw, direction = 1, debounceBorders = false) {
    let y = Math.min(MAX,Math.max(MIN,Math.round(Number(raw))));
    if (!Number.isFinite(y)) return;
    if (y === 0) y = direction < 0 ? -1 : 1;
    state.boundariesPending=state.snapshot?.file!==snapshotFor(y).file;
    state.year = y;
    $('year-slider').value = positionFor(y); $('year-input').value = y;
    $('year-display').textContent = `選取年 ${y<0?'前':''}${Math.abs(y).toLocaleString('zh-TW')}`; $('era-label').textContent = era(y);
    $('year-slider').setAttribute('aria-valuetext',yearText(y));
    $('year-slider').style.setProperty('--progress',`${positionFor(y)/10}%`);
    document.querySelectorAll('[data-year]').forEach(b => b.classList.toggle('active',Number(b.dataset.year)===y));
    state.suppressRestore=true;map.activePopup?.remove();state.suppressRestore=false;state.returnFocus=null;
    updateBoundaryIndicator(true);
    clearTimeout(state.urlTimer);if(debounceBorders)state.urlTimer=setTimeout(updateURL,160);else updateURL();
    clearTimeout(borderTimer);
    clearTimeout(state.eventTimer);
    if(debounceBorders)state.eventTimer=setTimeout(renderEvents,160);else renderEvents();
    if (debounceBorders) {
      // Invalidate an in-flight swap immediately, while the slider keeps moving.
      ++state.request;
      cancelObsolete(snapshotFor(y));
      snapshotData(snapshotFor(y),true).catch(()=>{});
      if(!state.dragging)borderTimer = setTimeout(loadBorders, 150);
      return;
    }
    return loadBorders();
  }
  function setPlaying(playing) {
    clearTimeout(state.timer); state.timer=null; state.playing=playing; state.playGeneration++;
    $('play-icon').textContent = playing ? 'Ⅱ' : '▶';
    $('play-button').setAttribute('aria-label',playing ? '暫停歷史動畫' : '播放歷史動畫');
    $('play-button').setAttribute('aria-pressed',String(playing));
    if (playing) state.timer = setTimeout(tick,1100);
  }
  async function tick() {
    if (!state.playing) return;
    const generation = state.playGeneration;
    const next = Math.min(MAX,state.year+Number($('speed-select').value));
    await setYear(next);
    if (!state.playing || generation !== state.playGeneration) return;
    if (next >= MAX) setPlaying(false); else state.timer = setTimeout(tick,1100);
  }
  function renderPolities(){
    const list=$('polity-list');if(!state.layer)return;list.replaceChildren();
    const q=$('polity-search').value.toLowerCase(),groups=new Map();
    for(const feature of state.layer.features){const key=feature.properties?.NAME;if(!key?.trim()||!feature.labelGeometry||isAntarctica(feature))continue;const n=nameFor(key);if(!n.zh)continue;if(!groups.has(n.id))groups.set(n.id,{n,key,layers:[]});groups.get(n.id).layers.push(feature);}
    for(const {n,key,layers} of groups.values()){
      if(!JSON.stringify([n.zh,n.native,n.aliases,n.datasetNames,n.endonyms,n.exonyms,n.geographicAliases,key]).toLowerCase().includes(q))continue;
      const boxes=layers.map(l=>l.labelGeometry.bounds);
      const bounds=[Math.min(...boxes.map(b=>b[0])),Math.min(...boxes.map(b=>b[1])),Math.max(...boxes.map(b=>b[2])),Math.max(...boxes.map(b=>b[3]))];
      const region=regionFor(bounds,key,n.regions);
      const b=document.createElement('button');b.textContent=`${nameDisplay(n.zh,n.nameStatus)}${region?' · '+region:''} · 疆界 ${yearText(state.snapshot.year)}`;
      b.onclick=()=>{
        state.returnFocus=$('polity-open');$('polity-dialog').close();
        selectPolity(n,key,layers);
      };list.append(b);
    }
    if(!list.childElementCount)list.textContent='找不到符合的政體。請試試別稱，或切換疆界年份。';
  }
  function selectPolity(n,key,layers){
        state.selectedPolity=n.id;
        for(const source of ['polities','disputed'])map.removeFeatureState({source});
        for(const feature of state.layer.features){if(nameFor(feature.properties?.NAME).id===n.id)map.setFeatureState({source:feature.renderSource,id:feature.id},{selected:true});}
        const bounds=polityBounds(layers),mobile=innerWidth<=760;
        map.fitBounds(bounds,{duration:0,padding:{left:mobile?20:320,top:90,right:mobile?65:370,bottom:document.querySelector('.time-dock').offsetHeight+(mobile?100:30)},maxZoom:6});
        const main=[...layers].sort((a,b)=>b.labelGeometry.area-a.labelGeometry.area)[0];
        const anchor=main.labelGeometry.anchors[0]||bounds[0];
        showPopup(map,anchor,polityHTML(key));
        const view=map.getBounds();
        window.politySelection={id:n.id,count:layers.length,bounds:[[bounds[0][1],bounds[0][0]],[bounds[1][1],bounds[1][0]]],anchor:[anchor[1],anchor[0]],highlighted:true,view:[[view.getSouth(),view.getWest()],[view.getNorth(),view.getEast()]]};
        updateURL();
  }
  function restoreSelection(){
    if(!state.selectedPolity)return;
    const layers=state.layer.features.filter(f=>nameFor(f.properties?.NAME).id===state.selectedPolity&&f.labelGeometry);
    if(layers.length)selectPolity(nameFor(layers[0].properties.NAME),layers[0].properties.NAME,layers);
    else {state.selectedPolity=null;updateURL();}
  }
  async function init() {
    $('boundary-warning').onclick=()=>{const el=$('boundary-warning-text');el.hidden=!el.hidden;$('boundary-warning').setAttribute('aria-expanded',String(!el.hidden));};
    $('time-options-toggle').onclick=()=>{const open=$('time-options').hidden;$('time-options').hidden=!open;$('time-options-toggle').setAttribute('aria-expanded',String(open));$('time-options-toggle').textContent=open?'收合 ▾':'設定 ▴';renderLabels();};
    $('polity-search').oninput=renderPolities;
    $('polity-open').onclick=()=>{renderPolities();$('polity-dialog').showModal();$('polity-search').focus();};
    $('polity-close').onclick=()=>$('polity-dialog').close();
    $('intro-toggle').onclick=()=>{const card=document.querySelector('.intro-card');card.classList.toggle('compact');$('intro-toggle').setAttribute('aria-expanded',String(!card.classList.contains('compact')));renderLabels();};
    new ResizeObserver(()=>{document.documentElement.style.setProperty('--dock-height',`${document.querySelector('.time-dock').offsetHeight}px`);}).observe(document.querySelector('.time-dock'));
    const fallback=()=>{status('無法啟用互動地圖：此瀏覽器不支援 WebGL，或圖形初始化失敗。請啟用硬體加速，或改用支援 WebGL 的瀏覽器後重新整理。');$('map-status').classList.add('webgl-fallback');};
    if(window.maplibregl&&!maplibregl.supported)maplibregl.supported=()=>{try{return !!document.createElement('canvas').getContext('webgl2');}catch{return false;}};
    if(!window.maplibregl||!maplibregl.supported()){fallback();return;}
    try{map=await createMap();}catch{fallback();return;}
    window.historyMap=map;window.historyState=state;
    eventLayer={markers:[],clearLayers(){this.markers.forEach(m=>m.remove());this.markers=[];},addLayer(m){this.markers.push(m);m.addTo(map);}};
    async function loadBaseline(){
      $('baseline-status').hidden=true;
      try{const data=await json('data/world_2010.geojson');state.baseline=data;map.getSource('land').setData(data);}catch{$('baseline-status').hidden=false;}
    }
    $('baseline-retry').onclick=loadBaseline;loadBaseline();
    for(const event of ['moveend','zoomend','resize'])map.on(event,()=>{if(state.events.length)state.eventsSignature=null;scheduleRefresh(!!state.events.length);});
    map.on('click','polities-fill',e=>{const f=e.features[0];if(f.properties.antarctica)showPopup(map,e.lngLat,antarcticaHTML());else if(f.properties.NAME?.trim()){state.selectedPolity=nameFor(f.properties.NAME).id;updateURL();showPopup(map,e.lngLat,polityHTML(f.properties.NAME));}});
    map.on('click','disputed-fill',e=>{state.selectedPolity=nameFor(e.features[0].properties.NAME).id;updateURL();showPopup(map,e.lngLat,polityHTML(e.features[0].properties.NAME));});
    let hover;
    for(const layer of ['polities-fill','disputed-fill']){
      map.on('mousemove',layer,e=>{if(hover)map.setFeatureState(hover,{hover:false});const f=e.features[0];hover={source:f.source,id:f.id};map.setFeatureState(hover,{hover:true});map.getCanvas().style.cursor='pointer';
        if(f.properties.NAME?.trim()){$('map').title=nameDisplay(nameFor(f.properties.NAME).zh||f.properties.NAME,nameFor(f.properties.NAME).nameStatus);}
      });
      map.on('mouseleave',layer,()=>{if(hover)map.setFeatureState(hover,{hover:false});hover=null;map.getCanvas().style.cursor='';$('map').title='';});
    }
    map.on('detailopen',()=>{document.body.classList.add('popup-open');const el=map.activePopup.getElement();state.selectedPolity=el.querySelector('[data-intro-id]')?.dataset.introId||null;updateURL();loadIntro(el);loadEventDetails(el);el.setAttribute('role','dialog');el.setAttribute('aria-label','歷史詳情');el.tabIndex=-1;el.focus({preventScroll:true});});
    map.on('detailclose',()=>{document.body.classList.remove('popup-open');if(!state.suppressRestore){state.selectedPolity=null;updateURL();}const target=state.returnFocus;state.returnFocus=null;if(!state.suppressRestore&&target?.isConnected)target.focus({preventScroll:true});});
    document.addEventListener('click',e=>{const b=e.target.closest('.goto-event');if(b){const event=state.events.find(x=>x.id===b.dataset.event);setYear(event.year);}});
    document.fonts?.ready.then(renderLabels);
    const sheet=$('events-panel'), sheetButton=$('sheet-toggle');
    sheet.addEventListener('transitionend',renderLabels);
    sheetButton.onclick=()=>{const expanded=sheetButton.getAttribute('aria-expanded')!=='true';sheetButton.setAttribute('aria-expanded',String(expanded));sheet.classList.toggle('expanded',expanded);sheetButton.textContent=`${expanded?'收合事件 ▾':'探索事件 ▴'} · ${$('event-count').textContent}`;renderLabels();};
    for(const [name,[tint,symbol]] of Object.entries(categories)) {
      const button=document.createElement('button');button.type='button';button.className='category-chip';button.style.setProperty('--event-color',tint);button.setAttribute('aria-pressed','true');button.innerHTML=`<span aria-hidden="true">${symbol}</span> ${name}`;
      button.onclick=()=>{enabledCategories.has(name)?enabledCategories.delete(name):enabledCategories.add(name);button.setAttribute('aria-pressed',String(enabledCategories.has(name)));renderEvents();};
      $('category-filters').append(button);
    }
    $('home-view').onclick=()=>map.flyTo({center:[45,26],zoom:1.25,duration:1000});
    $('labels-toggle').onclick=()=>{state.labels=!state.labels;$('labels-toggle').setAttribute('aria-pressed',String(state.labels));renderLabels();};
    $('events-toggle').onclick=()=>{state.markers=!state.markers;$('events-toggle').setAttribute('aria-pressed',String(state.markers));renderEvents();};
    $('window-select').onchange=e=>{state.window=Number(e.target.value);renderEvents();};
    $('about-button').onclick=()=>$('about-dialog').showModal();
    $('close-about').onclick=()=>$('about-dialog').close();
    $('about-dialog').addEventListener('click',e=>{if(e.target===$('about-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
    const dependentControls=[...document.querySelectorAll('.time-dock button,.time-dock input,.time-dock select,#polity-open')].filter(el=>!['time-options-toggle','boundary-warning'].includes(el.id));
    dependentControls.forEach(el=>el.disabled=true);
    status('正在整理歷史資料…');
    try {
      const recover=async(path,label,failed=false)=>{for(;;){try{if(failed){failed=false;throw new Error('重試載入');}return await json(path);}catch{await new Promise(resolve=>{const box=document.createElement('div');box.className='data-retry';box.textContent=label+'載入失敗。';const button=document.createElement('button');button.textContent='重試'+label;button.onclick=()=>{box.remove();resolve();};box.append(button);$('data-retries').append(box);});}}};
      const [snapshots,events,catalog,errata,glossary,endonyms] = await Promise.all([recover('data/snapshots.json','快照目錄'),json('data/events.json').catch(()=>{state.eventsUnavailable=true;recover('data/events.json','事件',true).then(events=>{state.eventsUnavailable=false;state.events=events;state.eventsSignature=null;renderEvents();});return [];}),recover('data/polities.json','政體目錄'),recover('data/errata.json','考證資料'),recover('data/glossary.json','詞彙狀態'),recover('data/endonyms.json','自稱資料')]);state.endonyms=endonyms;state.catalog=catalog;state.errata=errata;displayText=createNameDisplay(glossary);
      await warmLabelGlyphs(map,catalog,errata);
      dependentControls.forEach(el=>el.disabled=false);
      state.snapshots=snapshots.sort((a,b)=>a.year-b.year);state.events=events;
      const finishDrag=()=>{if(!state.dragging)return;state.dragging=false;clearTimeout(borderTimer);clearTimeout(state.eventTimer);state.boundariesPending=state.snapshot?.file!==snapshotFor(state.year).file;renderEvents();loadBorders();};
      $('year-slider').addEventListener('pointerdown',()=>{state.dragging=true;});
      window.addEventListener('pointerup',finishDrag);
      window.addEventListener('pointercancel',finishDrag);
      $('year-slider').addEventListener('change',finishDrag);
      $('year-slider').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const delta=['ArrowLeft','ArrowDown'].includes(e.key)?-1:1;setPlaying(false);setYear(state.year+delta,delta);});
      $('year-slider').oninput=e=>{setPlaying(false);setYear(yearFor(Number(e.target.value)),yearFor(Number(e.target.value))<state.year?-1:1,true);};
      $('year-form').onsubmit=e=>{e.preventDefault();if(!$('year-input').value.trim())return;setPlaying(false);setYear($('year-input').value);};
      $('play-button').onclick=async()=>{if(!state.playing&&state.year>=MAX)await setYear(MIN);setPlaying(!state.playing);};
      document.querySelectorAll('[data-year]').forEach(b=>b.onclick=()=>{setPlaying(false);setYear(b.dataset.year);});
      for(const delta of [-1,1])$('year-'+(delta<0?'prev':'next')).onclick=()=>{setPlaying(false);setYear(state.year+delta,delta);};
      for(const delta of [-1,1])$('snapshot-'+(delta<0?'prev':'next')).onclick=()=>{setPlaying(false);const next=delta<0?[...state.snapshots].reverse().find(s=>s.year>=MIN&&s.year<=MAX&&s.year<state.year):state.snapshots.find(s=>s.year>=MIN&&s.year<=MAX&&s.year>state.year);if(next)setYear(next.year);};
      state.selectedPolity=new URLSearchParams(location.search).get('polity');
      const initial = new URLSearchParams(location.search).get('year');
      await setYear(initial !== null && initial.trim() && Number.isFinite(Number(initial)) ? initial : -300);
    } catch(error) { console.error('歷史資料載入失敗',error); status('無法載入歷史資料。請透過 HTTP 伺服器開啟，並確認 data 資料夾完整。'); }
  }
  document.addEventListener('keydown',e=>{if(e.key==='Escape')map?.activePopup?.remove();});
  init();
})();
