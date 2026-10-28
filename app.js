import {renderEventsView} from './modules/events.js';
import {renderLabelsView} from './modules/map.js';
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
  let map, eventLayer, labelLayer, borderTimer, prefetchHandle;

  let displayText=value=>String(value??'');
  const geometryCache=new WeakMap();
  function lowZoomFeature(feature){
    if(!['Polygon','MultiPolygon'].includes(feature.geometry?.type))return feature;
    if(geometryCache.has(feature))return geometryCache.get(feature);
    // Cheap radial-distance LOD. Preserve ring closure, holes and small rings;
    // original coordinates remain available for zoomed-in rendering.
    const ring=points=>{
      if(points.length<8)return points;
      const result=[points[0]];let last=points[0];
      for(let i=1;i<points.length-1;i++){const p=points[i];if(Math.abs(p[0]-last[0])>=.06||Math.abs(p[1]-last[1])>=.06){result.push(p);last=p;}}
      result.push(points.at(-1));return result.length>=4?result:points;
    };
    const polygon=rings=>rings.map(ring);
    const geometry={...feature.geometry,coordinates:feature.geometry.type==='Polygon'?polygon(feature.geometry.coordinates):feature.geometry.coordinates.map(polygon)};
    const result={...feature,geometry,sourceGeometry:feature.geometry};geometryCache.set(feature,result);return result;
  }
  const yieldMount=()=>new Promise(resolve=>window.requestIdleCallback?requestIdleCallback(resolve,{timeout:32}):requestAnimationFrame(resolve));
  async function updateGeometry(){
    const token=state.geometryRequest=(state.geometryRequest||0)+1;
    const layer=state.layer;if(!layer)return;
    const low=map.getZoom()<4;state.geometryPending=true;
    let start=performance.now();
    for(const polygon of layer.getLayers()){
      if(token!==state.geometryRequest||layer!==state.layer)return;
      if(polygon.fullGeometry&&polygon.geometryLow!==low){
        const geometry=low?(polygon.lowGeometry ||= lowZoomFeature({...polygon.feature,geometry:polygon.fullGeometry}).geometry):polygon.fullGeometry;
        polygon.setLatLngs(L.GeoJSON.coordsToLatLngs(geometry.coordinates,geometry.type==='Polygon'?1:2));polygon.geometryLow=low;
      }
      if(performance.now()-start>=8){await yieldMount();start=performance.now();}
    }
    state.geometryPending=false;scheduleRefresh();
  }
  let refreshFrame=null, eventsDirty=false, labelsDirty=false;
  function scheduleRefresh(events=false){
    eventsDirty ||= events; labelsDirty=true;
    if(refreshFrame!=null)return;
    refreshFrame=requestAnimationFrame(()=>{
      refreshFrame=null;
      if(eventsDirty){eventsDirty=false;renderEventsView({state,map,eventLayer,enabledCategories,categories,$,eventDate,esc,selectEvent,displayText,yearText,setPlaying,setYear});}
      if(labelsDirty&&!state.dragging&&!state.boundariesPending&&!state.geometryPending){
        labelsDirty=false;const start=performance.now();renderLabelsView({state,map,labelLayer,isAntarctica,nameFor,esc});
        const profile=window.historyProfiles?.at(-1);if(profile&&profile.labelPasses===0){profile.labelsMs=performance.now()-start;profile.totalMs+=profile.labelsMs;profile.labelPasses=1;}
      }
    });
  }
  function nameFor(key) {
    const cacheKey=`${state.snapshot?.year??state.year}|${key}`;
    if(state.nameCache?.has(cacheKey))return state.nameCache.get(cacheKey);
    const p=state.catalog?.polities[state.catalog.index[key]];
    if(!p)return {zh:'',native:'',aliases:[],importance:0,nameStatus:'pending'};
    const year=state.snapshot?.year ?? state.year;
    const period=p.periods.find(n=>year>=n.fromYear&&year<=n.toYear);
    const correction=state.errata?.overrides.find(n=>year>=(n.fromYear??n.year)&&year<=(n.toYear??n.year)&&n.match===key);
    const endonyms=p.endonyms.filter(n=>n.sourceStatus==='verified'&&n.sourceUrl&&year>=n.fromYear&&year<=n.toYear);
    const result={...p,zh:correction?.zh||period?.zh||p.zh,translationStatus:correction?.translationStatus||period?.translationStatus||p.translationStatus,nameStatus:(correction?.translationStatus==='untranslated'||period?.translationStatus==='untranslated'||p.translationStatus==='untranslated'||p.terminologyStatus==='restored-v10')?'pending':'accepted',native:endonyms[0]?.original||'',endonyms,aliases:period?.aliases||[],correction};
    (state.nameCache ||= new Map()).set(cacheKey,result);return result;
  }
  // Identify the continent by geometry, including snapshots with a name.
  function isAntarctica(f) {
    const b=f.labelGeometry?.bounds;
    return b && b[1]<=-85 && b[3]<-60 && b[2]-b[0]>300;
  }
  function antarcticaHTML() {
    return `<div class="popup-kicker">地理區域 · ${esc(yearText(state.year))}</div><h3 class="popup-title">南極洲 Antarctica</h3><p>地理區域，非政體。無人定居（無永久居民；近現代有季節性與全年科研人員）。</p>${state.year>=1959?'<p>《南極條約》體系：條約於 1959 年簽署，1961 年生效；以和平利用及科學合作為原則。</p><p><a href="https://www.ats.aq/e/antarctictreaty.html" target="_blank" rel="noopener">南極條約秘書處</a></p>':''}`;
  }
  function polityHTML(key) {
    const n=nameFor(key);
    const field=(label,value)=>value?.trim()?`<p dir="auto">${label}：${esc(value)}</p>`:'';
    return `<div class="popup-kicker">疆界年：${esc(yearText(state.snapshot.year))}</div><h3 class="popup-title">${esc(nameDisplay(n.zh||key,n.nameStatus))}</h3>${field('實體類型',({'polity-or-community':'政體或社群','cultural-area':'文化分布區','people':'民族／族群'})[n.entityType]||'區域')}${!n.endonyms?.length&&n.importance>=8?'<p class="self-designation-pending">自稱待考證</p>':''}${(n.endonyms||[]).map(e=>'<section class="self-designation"><h4>當時自稱</h4>'+field('原文',e.original)+field('轉寫',e.transliteration)+field('中文意譯',e.meaning)+field('語言',e.language)+field('用稱性質',e.kind)+field('使用時期',`${yearText(e.fromYear)}至${yearText(e.toYear)}`)+`<p>自稱出處：${e.sourceStatus==='verified'?'已查核':'待查核'} <a href="${esc(e.sourceUrl)}" target="_blank" rel="noopener">參考文獻</a></p></section>`).join('')}${field('他稱／後世稱呼',(n.exonyms||[]).filter(Boolean).join('、'))}${field('地理別稱',(n.geographicAliases||[]).filter(Boolean).join('、'))}${field('資料集名稱',key)}${n.translationStatus==='untranslated'?'<p>譯名待考：保留來源原文，尚未取得合格的譯名依據。</p>':''}${n.correction?`<p class="correction">${n.correction.nameStatus==='corrected'?'名稱已修正；疆界待考證':'名稱及疆界待考證'}：${esc(n.correction.note)} <a href="${esc(n.correction.source)}" target="_blank" rel="noopener">來源</a></p>`:''}<small>疆界為概略重建。</small>`;
  }
  function eventHTML(e) { return `<div class="popup-event"><div class="popup-kicker">${esc(eventDate(e))} · ${esc(e.category)}</div><h3 class="popup-title">${esc(displayText(e.title))}</h3><p>${esc(displayText(e.description))}</p><p>選取年：${esc(yearText(state.year))}<br>疆界年：${esc(yearText(state.snapshot?.year||state.year))}<br>事件年：${esc(eventDate(e))}</p><button class="goto-event" data-event="${esc(e.id)}">切換到事件年代</button><p><a href="${esc(e.sourceUrl)}" target="_blank" rel="noopener">查考入口（${e.sourceStatus==='verified'?'已核實':e.sourceStatus==='article-unverified'?'具體條目，內容待核實':'搜尋入口，待查證'}）</a></p></div>`; }
  const {json} = createDataClient();
  function snapshotData(s) {
    if(state.cache.has(s.file)){const hit=state.cache.get(s.file);state.cache.delete(s.file);state.cache.set(s.file,hit);return hit.promise;}
    const controller=new AbortController();
    const entry={controller,promise:null,ready:false};
    entry.promise=json(`data/${s.file}`,controller.signal).then(data=>{entry.ready=true;return data;}).catch(error=>{if(state.cache.get(s.file)===entry)state.cache.delete(s.file);throw error;});
    state.cache.set(s.file,entry);
    while(state.cache.size>10){const key=state.cache.keys().next().value;state.cache.get(key).controller.abort();state.cache.delete(key);}
    return entry.promise;
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
    prefetchHandle=idle(()=>{prefetchHandle=null;if(state.snapshot!==s)return;const i=state.snapshots.indexOf(s);for(const offset of [-1,1,-2,2]){const next=state.snapshots[i+offset];if(next)snapshotData(next).catch(()=>{});}});
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
    if (state.snapshot?.file === s.file) { updateSnapshotCaption(s); status(); state.boundariesPending=false;renderLabels(); prefetchAdjacent(s); return; }
    state.boundariesPending=true;
    updateSnapshotCaption(s, true);
    // Keep the previous snapshot until its replacement is ready.
    const previousLayer=state.layer;
    status('正在展開歷史疆界…');
    let stagedLayer,stagedRenderer;
    try {
      const start=performance.now();
      const snapshot = await snapshotData(s),base=state.baseline;
      const fetched=performance.now();
      // The 5000 BCE snapshot omits Antarctica; use the same neutral land outline.
      const antarctica=base?.features.find(isAntarctica);
      const data=snapshot.features.some(isAntarctica)||!antarctica?snapshot:{...snapshot,features:[...snapshot.features,antarctica]};
      if (token !== state.request) return;
      state.selectedPolity=null;
      // A hover/update callback may already be queued when an old canvas is detached.
      const BorderCanvas=L.Canvas.extend({_redraw(){if(!this._map||!this._ctx){this._redrawRequest=null;return;}L.Canvas.prototype._redraw.call(this);}});
      const nextRenderer=stagedRenderer=new BorderCanvas();
      nextRenderer.addTo(map);nextRenderer._container.style.opacity=0;nextRenderer._container.style.pointerEvents='none';
      const styles=new Map();
      for(const f of data.features){const key=f.properties?.NAME||'';if(styles.has(key))continue;const p=state.catalog.polities[state.catalog.index[key]];const tint=stableColor(p?.id||key);const review=state.errata?.featureReviews?.find(r=>r.match===key&&s.year>=r.fromYear&&s.year<=r.toYear);styles.set(key,{color:review?'#ffe3a3':tint,weight:review?2.5:.8,opacity:.85,fillColor:tint,fillOpacity:p?.entityType==='cultural-area' ? .18 : .42,dashArray:review?'9 4 2 4':p?.entityType==='cultural-area'?'5 5':null});}
      const prepared=performance.now();
      const layer = stagedLayer = L.geoJSON(null, {
        renderer: nextRenderer,
        smoothFactor: map.getZoom()<4?4:1,
        style: f => isAntarctica(f) || !f.properties?.NAME?.trim() ? {color:'#91a6ab',weight:.5,opacity:.35,fillColor:'#91a6ab',fillOpacity:isAntarctica(f)?.22:.12,interactive:isAntarctica(f)} : styles.get(f.properties.NAME),
        onEachFeature: (f, polygon) => {
          polygon.fullGeometry=f.sourceGeometry||f.geometry;polygon.geometryLow=map.getZoom()<4;if(f.sourceGeometry)polygon.lowGeometry=f.geometry;
          const key = f.properties?.NAME?.trim();
          if(!key && !isAntarctica(f)){polygon.options.interactive=false;return;}
          polygon.bindTooltip(()=>isAntarctica(f)?'南極洲 Antarctica · 地理區域':esc(nameDisplay(nameFor(key).zh||key,nameFor(key).nameStatus)));
          polygon.bindPopup(() => isAntarctica(f) ? antarcticaHTML() : polityHTML(key), {maxWidth: Math.min(330,innerWidth-100), autoPanPaddingTopLeft:[15,70], autoPanPaddingBottomRight:[15,document.querySelector('.time-dock').offsetHeight+65]});
          polygon.on('mouseover', () => polygon.setStyle({weight: 1.8, fillOpacity: .65, color: '#ead6a6'}));
          polygon.on('mouseout', () => {layer.resetStyle(polygon);if(state.selectedPolity===nameFor(key).id)polygon.setStyle({weight:3,color:'#fff0b5',fillOpacity:.65});});
        }
      });
      // Mount into the hidden renderer as we build, so projection and path
      // initialization are part of each budget, not one final addTo(map).
      layer.addTo(map);
      const vertexCount=coordinates=>!coordinates?0:typeof coordinates[0]==='number'?1:coordinates.reduce((n,c)=>n+vertexCount(c),0);
      let batchStart=performance.now(),vertices=0;
      for(const feature of data.features){
        if(token!==state.request)return;
        const displayFeature=map.getZoom()<4?lowZoomFeature(feature):feature;
        layer.addData(displayFeature);
        vertices+=vertexCount(displayFeature.geometry?.coordinates);
        if(performance.now()-batchStart>=8||vertices>=6000){await yieldMount();batchStart=performance.now();vertices=0;}
      }
      const built=performance.now();
      // Leaflet schedules Canvas drawing in rAF. Keep the old canvas through a
      // complete paint opportunity, and discard a superseded staged snapshot.
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      if(token!==state.request){map.removeLayer(layer);removeRenderer(nextRenderer);return;}
      nextRenderer._container.style.opacity=1;nextRenderer._container.style.pointerEvents='';
      state.boundariesPending=false;state.snapshot=s;state.nameCache=new Map();
      if(previousLayer){const oldRenderer=state.borderRenderer;map.removeLayer(previousLayer);removeRenderer(oldRenderer);}
      state.borderRenderer=nextRenderer;
      state.layer = layer; stagedLayer=null;stagedRenderer=null;state.geometryPending=false;if($('polity-dialog').open)renderPolities();
      updateGeometry();
      $('polity-count').textContent = `${new Set(data.features.filter(f=>!isAntarctica(f)).map(f => f.properties?.NAME).filter(n => n && n.trim())).size} 個政體與區域`;
      updateSnapshotCaption(s);
      renderLabels(); status();
      const profile={year:s.year,fetchMs:fetched-start,prepareMs:prepared-fetched,buildMs:built-prepared,labelsMs:0,labelPasses:0,totalMs:performance.now()-start};
      (window.historyProfiles ||= []).push(profile);
      prefetchAdjacent(s);
    } catch (error) {
      if (token !== state.request || error.name==='AbortError') return;
      console.error('疆界更新失敗',error);
      state.boundariesPending=false;renderLabels();updateBoundaryIndicator();
      $('snapshot-label').textContent = '疆界載入失敗';
      $('snapshot-note').textContent = '連線失敗，請重新選取年份重試；舊疆界仍保留';
      status('無法更新疆界，請檢查連線並重試。'); const retry=document.createElement('button');retry.textContent='重試疆界';retry.onclick=loadBorders;$('map-status').append(retry);
      setPlaying(false);
    } finally {if(stagedLayer)map.removeLayer(stagedLayer);if(stagedRenderer)removeRenderer(stagedRenderer);}
  }
  function removeRenderer(renderer){if(!renderer)return;L.Util.cancelAnimFrame(renderer._redrawRequest);renderer._redrawRequest=null;map.removeLayer(renderer);}
  function renderLabels(){scheduleRefresh();}
  function selectEvent(e) {
    state.returnFocus=matchMedia('(max-width:760px)').matches ? $('sheet-toggle') : document.activeElement; state.activeEvent = e.id;
    if(matchMedia('(max-width:760px)').matches && $('events-panel').classList.contains('expanded')) $('sheet-toggle').click();
    document.querySelectorAll('.event-item').forEach(el => el.classList.toggle('active', el.dataset.id === e.id));
    const target = [e.lat,e.lon];
    const zoom = Math.max(map.getZoom(), 4);
    map.stop(); map.setView(target,zoom,{animate:false});
    L.popup({maxWidth:Math.min(310,innerWidth-60), autoPan:true,autoPanPaddingTopLeft:[15,70],autoPanPaddingBottomRight:[15,document.querySelector('.time-dock').offsetHeight+65]}).setLatLng(target).setContent(eventHTML(e)).openOn(map);
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
    state.suppressRestore=true;map.closePopup();state.suppressRestore=false;state.returnFocus=null;
    updateBoundaryIndicator(true);
    const updateURL=()=>{const url=new URL(location.href);url.searchParams.set('year',y);history.replaceState(null,'',url);};
    clearTimeout(state.urlTimer);if(debounceBorders)state.urlTimer=setTimeout(updateURL,160);else updateURL();
    clearTimeout(borderTimer);
    clearTimeout(state.eventTimer);
    if(debounceBorders)state.eventTimer=setTimeout(renderEvents,160);else renderEvents();
    if (debounceBorders) {
      // Invalidate an in-flight swap immediately, while the slider keeps moving.
      ++state.request;
      cancelObsolete(snapshotFor(y));
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
    state.layer.eachLayer(layer=>{const key=layer.feature.properties?.NAME;if(!key?.trim()||isAntarctica(layer.feature))return;const n=nameFor(key);if(!n.zh)return;if(!groups.has(n.id))groups.set(n.id,{n,key,layers:[]});groups.get(n.id).layers.push(layer);});
    for(const {n,key,layers} of groups.values()){
      if(!JSON.stringify([n.zh,n.native,n.aliases,n.datasetNames,n.endonyms,n.exonyms,n.geographicAliases,key]).toLowerCase().includes(q))continue;
      const boxes=layers.map(l=>l.feature.labelGeometry.bounds);
      const bounds=[Math.min(...boxes.map(b=>b[0])),Math.min(...boxes.map(b=>b[1])),Math.max(...boxes.map(b=>b[2])),Math.max(...boxes.map(b=>b[3]))];
      const region=regionFor(bounds,key,n.regions);
      const b=document.createElement('button');b.textContent=`${nameDisplay(n.zh,n.nameStatus)}${region?' · '+region:''} · 疆界 ${yearText(state.snapshot.year)}`;
      b.onclick=()=>{
        state.returnFocus=$('polity-open');$('polity-dialog').close();
        state.selectedPolity=n.id;state.layer.eachLayer(l=>state.layer.resetStyle(l));
        const bounds=L.latLngBounds([]);for(const l of layers){bounds.extend(l.getBounds());l.setStyle({weight:3,color:'#fff0b5',fillOpacity:.65});}
        const mobile=innerWidth<=760;
        map.fitBounds(bounds,{animate:false,paddingTopLeft:[mobile?20:320,90],paddingBottomRight:[mobile?65:370,document.querySelector('.time-dock').offsetHeight+(mobile?100:30)],maxZoom:6});
        const main=[...layers].sort((a,b)=>b.feature.labelGeometry.area-a.feature.labelGeometry.area)[0];
        const anchor=main.feature.labelGeometry.anchors[0];
        const point=anchor?L.latLng(anchor[1],anchor[0]):main.getLatLngs().flat(3).find(p=>p instanceof L.LatLng);
        main.openPopup(point);
        window.politySelection={id:n.id,count:layers.length,bounds:[[bounds.getSouth(),bounds.getWest()],[bounds.getNorth(),bounds.getEast()]],anchor:[point.lat,point.lng],highlighted:layers.every(l=>l.options.weight===3),view:[[map.getBounds().getSouth(),map.getBounds().getWest()],[map.getBounds().getNorth(),map.getBounds().getEast()]]};
      };list.append(b);
    }
    if(!list.childElementCount)list.textContent='找不到符合的政體。請試試別稱，或切換疆界年份。';
  }
  async function init() {
    $('boundary-warning').onclick=()=>{const el=$('boundary-warning-text');el.hidden=!el.hidden;$('boundary-warning').setAttribute('aria-expanded',String(!el.hidden));};
    $('time-options-toggle').onclick=()=>{const open=$('time-options').hidden;$('time-options').hidden=!open;$('time-options-toggle').setAttribute('aria-expanded',String(open));$('time-options-toggle').textContent=open?'收合 ▾':'設定 ▴';renderLabels();};
    $('polity-search').oninput=renderPolities;
    $('polity-open').onclick=()=>{renderPolities();$('polity-dialog').showModal();$('polity-search').focus();};
    $('polity-close').onclick=()=>$('polity-dialog').close();
    $('intro-toggle').onclick=()=>{const card=document.querySelector('.intro-card');card.classList.toggle('compact');$('intro-toggle').setAttribute('aria-expanded',String(!card.classList.contains('compact')));renderLabels();};
    new ResizeObserver(()=>{document.documentElement.style.setProperty('--dock-height',`${document.querySelector('.time-dock').offsetHeight}px`);}).observe(document.querySelector('.time-dock'));
    if (!window.L) { status('地圖元件未載入，請確認網路連線後重新整理。'); return; }
    map = L.map('map',{center:[26,45],zoom:2.25,minZoom:2,maxZoom:8,zoomSnap:.25,worldCopyJump:true,preferCanvas:true,zoomControl:true});
    map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
    map.createPane('land'); map.getPane('land').style.zIndex = 200;
    map.createPane('grid'); map.getPane('grid').style.zIndex = 210;
    map.attributionControl.addAttribution('疆界與陸地：<a href="https://github.com/aourednik/historical-basemaps">historical-basemaps</a> · GPL-3.0');
    $('time-options').append(document.querySelector('.leaflet-control-attribution'));
    async function loadBaseline(){
      $('baseline-status').hidden=true;
      try{const data=await json('data/world_2010.geojson');state.baseline=data;
        L.geoJSON(data,{renderer:L.canvas({pane:'land'}),pane:'land',interactive:false,style:{stroke:false,fillColor:'#354247',fillOpacity:1}}).addTo(map);
      }catch{ $('baseline-status').hidden=false; }
    }
    $('baseline-retry').onclick=loadBaseline;
    loadBaseline();
    for (let lat = -60; lat <= 60; lat += 30) L.polyline([[lat,-180],[lat,180]],{pane:'grid',interactive:false,color:'#b0b9a3',weight:.5,opacity:.12,dashArray:'2 7'}).addTo(map);
    for (let lon = -180; lon <= 180; lon += 30) L.polyline([[-85,lon],[85,lon]],{pane:'grid',interactive:false,color:'#b0b9a3',weight:.5,opacity:.12,dashArray:'2 7'}).addTo(map);
    eventLayer=L.layerGroup().addTo(map); labelLayer=L.layerGroup().addTo(map);
    map.on('moveend zoomend resize',()=>{if(state.events.length)state.eventsSignature=null;scheduleRefresh(!!state.events.length);});
    map.on('zoomend',()=>{updateGeometry();});
    map.on('popupopen',e=>{document.body.classList.add('popup-open');const el=e.popup.getElement();el.setAttribute('role','dialog');el.setAttribute('aria-label','歷史詳情');el.tabIndex=-1;el.focus({preventScroll:true});});
    map.on('popupclose',()=>{document.body.classList.remove('popup-open');const target=state.returnFocus;state.returnFocus=null;if(!state.suppressRestore&&target?.isConnected)target.focus({preventScroll:true});});
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
    $('home-view').onclick=()=>map.flyTo([26,45],2.25,{duration:1});
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
      const [snapshots,events,catalog,errata,glossary] = await Promise.all([recover('data/snapshots.json','快照目錄'),json('data/events.json').catch(()=>{state.eventsUnavailable=true;recover('data/events.json','事件',true).then(events=>{state.eventsUnavailable=false;state.events=events;state.eventsSignature=null;renderEvents();});return [];}),recover('data/polities.json','政體目錄'),recover('data/errata.json','考證資料'),recover('data/glossary.json','詞彙狀態')]);state.catalog=catalog;state.errata=errata;displayText=createNameDisplay(glossary);
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
      const initial = new URLSearchParams(location.search).get('year');
      await setYear(initial !== null && initial.trim() && Number.isFinite(Number(initial)) ? initial : -300);
    } catch(error) { console.error('歷史資料載入失敗',error); status('無法載入歷史資料。請透過 HTTP 伺服器開啟，並確認 data 資料夾完整。'); }
  }
  init();
})();
