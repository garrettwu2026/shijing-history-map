'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const MIN = -5000, MAX = 2026;
  const categories = {'戰爭':['#ed9588','⚔'],'王朝與政治':['#dfbc7d','♛'],'科技與發明':['#7ed1db','⚙'],'宗教與思想':['#c7a4ec','✧'],'文化與藝術':['#eea9cc','◆'],'探索與貿易':['#a8d394','➶']};
  const enabledCategories = new Set(Object.keys(categories));
  const state = {year: -300, snapshots: [], names: {}, events: [], cache: new Map(), layer: null, snapshot: null, request: 0, timer: null, playing: false, playGeneration: 0, labels: true, markers: true, window: 50, activeEvent: null};
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const yearText = y => y < 0 ? `西元前 ${Math.abs(y).toLocaleString('zh-TW')} 年` : `西元 ${y.toLocaleString('zh-TW')} 年`;
  const eventDate = e => `${e.dateNote === '約' ? '約 ' : ''}${yearText(e.year)}${e.dateNote === '傳統' ? '（傳統紀年）' : ''}`;
  const era = y => y < -1200 ? '早期文明' : y < 500 ? '古典時代' : y < 1450 ? '中古世界' : y < 1800 ? '航海與帝國' : y < 1945 ? '近代浪潮' : '當代世界';
  const status = (message = '') => { $('map-status').textContent = message; $('map-status').hidden = !message; };
  let map, eventLayer, labelLayer, borderTimer, prefetchHandle, baselinePromise;

  function hash(s) { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
  const polityColors=new Map();
  const color = name => polityColors.get(name) || (name.trim() ? `hsl(${hash(name) % 360} ${24 + (hash(name) >>> 9) % 16}% ${52 + (hash(name) >>> 17) % 13}%)` : '#60716b');
  function nameFor(key) {
    const p=state.catalog?.polities[state.catalog.index[key]];
    if(!p)return {zh:'',native:'',aliases:[],importance:0};
    const year=state.snapshot?.year ?? state.year;
    const period=p.periods.find(n=>year>=n.fromYear&&year<=n.toYear);
    const correction=state.errata?.overrides.find(n=>n.year===year&&n.match===key);
    const endonyms=p.endonyms.filter(n=>year>=n.fromYear&&year<=n.toYear);
    return {...p,zh:correction?.zh||period?.zh||p.zh,native:endonyms[0]?.original||'',endonyms,aliases:period?.aliases||[],correction};
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
    return `<div class="popup-kicker">疆界年：${esc(yearText(state.snapshot.year))}</div><h3 class="popup-title">${esc(n.zh||key)}</h3>${(n.endonyms||[]).map(e=>field('當時自稱',e.original)+field('轉寫',e.transliteration)+field('中文意譯',e.meaning)).join('')}${field('他稱／後世稱呼',(n.exonyms||[]).filter(Boolean).join('、'))}${field('地理別稱',(n.geographicAliases||[]).filter(Boolean).join('、'))}${field('資料集名稱',key)}${n.confidence?`<p>譯名可信度：${esc(n.confidence)}；${n.translationStatus==='untranslated'?'中文譯名待考證':'既有譯名仍待逐筆複核'}</p>`:''}${n.correction?`<p class="correction">勘誤：${esc(n.correction.note)} <a href="${esc(n.correction.source)}" target="_blank" rel="noopener">來源</a></p>`:''}<small>${n.id?`穩定 ID：${esc(n.id)}。`:''}疆界為概略重建。</small>`;
  }
  function eventHTML(e) { return `<div class="popup-event"><div class="popup-kicker">${esc(eventDate(e))} · ${esc(e.category)}</div><h3 class="popup-title">${esc(e.title)}</h3><p>${esc(e.description)}</p><p>選取年：${esc(yearText(state.year))}<br>疆界年：${esc(yearText(state.snapshot?.year||state.year))}<br>事件年：${esc(eventDate(e))}</p><button class="goto-event" data-event="${esc(e.id)}">切換到事件年代</button><p><a href="${esc(e.sourceUrl)}" target="_blank" rel="noopener">查考入口（${e.sourceStatus==='research-link-unverified'?'尚未逐筆核實':'已核實'}）</a></p></div>`; }
  const worker = new Worker('data-worker.js');
  const pending = new Map(); let workerID=0;
  worker.onmessage=({data:{id,data,error,name}})=>{const task=pending.get(id);if(!task)return;pending.delete(id);task.cleanup();error?task.reject(Object.assign(new Error(error),{name})):task.resolve(data);};
  worker.onerror=()=>{for(const task of pending.values()){task.cleanup();task.reject(new Error('資料 Worker 無法執行'));}pending.clear();};
  function json(path, signal) {
    return new Promise((resolve,reject)=>{
      const id=++workerID;
      const abort=()=>{worker.postMessage({id,cancel:true});pending.delete(id);reject(new DOMException('Aborted','AbortError'));};
      if(signal?.aborted){reject(new DOMException('Aborted','AbortError'));return;}
      pending.set(id,{resolve,reject,cleanup:()=>signal?.removeEventListener('abort',abort)});
      signal?.addEventListener('abort',abort,{once:true});
      worker.postMessage({id,path:`${path}?v=v3-20261027`});
    });
  }
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
  function updateSnapshotCaption(s, pending = false) {
    $('snapshot-note').classList.toggle('boundary-warning',state.year>2010);
    $('snapshot-label').textContent = `${pending ? '正在載入' : '疆界快照'}：${yearText(s.year)}`;
    $('snapshot-note').textContent = pending ? '地圖正在更新，請稍候' : state.year < s.year ? '早於最早可用資料，顯示最早快照' : state.year > state.snapshots.at(-1).year ? '最新疆界資料止於 2010 年，並非當代精確國界' : s.year === state.year ? '選取年份與疆界快照相同' : `使用選取年份之前最近的快照，相差 ${state.year - s.year} 年`;
  }
  async function loadBorders() {
    const s = snapshotFor(state.year);
    const token = ++state.request;
    cancelObsolete(s);
    if (state.snapshot?.file === s.file) { updateSnapshotCaption(s); status(); if(state.labelsPending)renderLabels(); prefetchAdjacent(s); return; }
    updateSnapshotCaption(s, true);
    // Keep the previous snapshot until its replacement is ready.
    const previousLayer=state.layer;
    status('正在展開歷史疆界…');
    try {
      const [snapshot,base] = await Promise.all([snapshotData(s),baselinePromise]);
      // The 5000 BCE snapshot omits Antarctica; use the same neutral land outline.
      const antarctica=base.features.find(isAntarctica);
      const data=snapshot.features.some(isAntarctica)||!antarctica?snapshot:{...snapshot,features:[...snapshot.features,antarctica]};
      if (token !== state.request) return;
      const nextRenderer=L.canvas();
      polityColors.clear();
      const colors=['#dcaa70','#78b3b0','#bba0d1','#b8c879','#d78f9b','#86a9d5','#d1ba92','#80bd91'];
      const neighbors=[];
      for(const f of data.features){if(!f.geometry || isAntarctica(f) || !f.properties?.NAME?.trim())continue;const name=f.properties.NAME;if(polityColors.has(name))continue;const b=f.labelGeometry.bounds;const bounds=L.latLngBounds([[b[1],b[0]],[b[3],b[2]]]);if(!bounds.isValid())continue;const used=new Set(neighbors.filter(n=>n.bounds.intersects(bounds)).map(n=>n.color));const chosen=colors.find(c=>!used.has(c))||colors[hash(name)%colors.length];polityColors.set(name,chosen);neighbors.push({bounds,color:chosen});}
      const layer = L.geoJSON(data, {
        renderer: nextRenderer,
        style: f => isAntarctica(f) || !f.properties?.NAME?.trim() ? {color:'#91a6ab',weight:.5,opacity:.35,fillColor:'#91a6ab',fillOpacity:isAntarctica(f)?.22:.12,interactive:isAntarctica(f)} : ({color: color(f.properties?.NAME || ''), weight: .8, opacity: .85, fillColor: color(f.properties?.NAME || ''), fillOpacity: .42, smoothFactor: 1.2}),
        onEachFeature: (f, polygon) => {
          const key = f.properties?.NAME?.trim();
          if(!key && !isAntarctica(f)){polygon.options.interactive=false;return;}
          if(isAntarctica(f))polygon.bindTooltip('南極洲 Antarctica · 地理區域');
          polygon.bindPopup(() => isAntarctica(f) ? antarcticaHTML() : polityHTML(key), {maxWidth: Math.min(330,innerWidth-100), autoPanPaddingTopLeft:[15,70], autoPanPaddingBottomRight:[15,document.querySelector('.time-dock').offsetHeight+65]});
          polygon.on('mouseover', () => polygon.setStyle({weight: 1.8, fillOpacity: .65, color: '#ead6a6'}));
          polygon.on('mouseout', () => layer.resetStyle(polygon));
        }
      }).addTo(map);
      // Leaflet schedules Canvas drawing in rAF. Keep the old canvas through a
      // complete paint opportunity, and discard a superseded staged snapshot.
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      if(token!==state.request){map.removeLayer(layer);map.removeLayer(nextRenderer);return;}
      state.snapshot=s;
      if(previousLayer){const oldRenderer=state.borderRenderer;map.removeLayer(previousLayer);if(oldRenderer)map.removeLayer(oldRenderer);}
      state.borderRenderer=nextRenderer;
      state.layer = layer; renderPolities();
      $('polity-count').textContent = `${new Set(data.features.filter(f=>!isAntarctica(f)).map(f => f.properties?.NAME).filter(n => n && n.trim())).size} 個政體與區域`;
      updateSnapshotCaption(s);
      renderLabels(); status();
      prefetchAdjacent(s);
    } catch (error) {
      if (token !== state.request || error.name==='AbortError') return;
      console.error('疆界載入失敗', error);
      $('snapshot-label').textContent = '疆界載入失敗';
      $('snapshot-note').textContent = '連線失敗，請重新選取年份重試；舊疆界仍保留';
      status('無法更新疆界，請檢查連線並重試。'); const retry=document.createElement('button');retry.textContent='重試疆界';retry.onclick=loadBorders;$('map-status').append(retry);
      setPlaying(false);
    }
  }
  function renderLabels() {
    if(state.dragging)return;
    state.labelsPending=false;
    labelLayer.clearLayers();
    if (!state.labels || !state.layer) return;
    const candidates=[], zoom=map.getZoom(), size=map.getSize();
    state.layer.eachLayer(layer => {
      if (!layer.getBounds || isAntarctica(layer.feature)) return;
      const key=layer.feature.properties?.NAME, bounds=layer.getBounds();
      if (!key?.trim() || key.trim()==='?' || !bounds.isValid() || !map.getBounds().intersects(bounds)) return;
      const area=layer.feature.labelGeometry.area;
      const n=nameFor(key), importance=n.importance || 0;
      const projected=area*Math.pow(2,2*zoom)*1200;
      if(projected < 3000/Math.max(1,zoom-1) && importance<8) return;
      const parts=layer.feature.labelGeometry.parts;
      const center=layer.getCenter ? layer.getCenter() : bounds.getCenter();
      candidates.push({key,n,center,parts,area,importance,score:Math.log1p(area*10000)+importance*1.6});
    });
    const occupied=[...document.querySelectorAll('.intro-card,.events-panel,.time-dock,.map-toolbar,.map-key,.leaflet-control-zoom')].filter(el=>el.getClientRects().length).map(el=>el.getBoundingClientRect());
    // Write every candidate first, then measure in one read phase. Anchor
    // collision trials use these dimensions and never read layout again.
    const mapRect=map.getContainer().getBoundingClientRect();
    const measurements=document.createElement('div');
    measurements.style.cssText='position:absolute;visibility:hidden;pointer-events:none';
    for(const c of candidates){
      c.html=`<span class="label-zh">${esc(c.n.zh)}</span>${c.n.native && c.n.native.length<28 && c.n.native!==c.n.zh?`<span class="label-native" dir="auto">${esc(c.n.native)}</span>`:''}`;
      c.className=`polity-label${c.importance>=8?' label-major':''}`;
      c.measure=document.createElement('div');c.measure.className=`leaflet-tooltip ${c.className}`;c.measure.innerHTML=c.html;measurements.append(c.measure);
    }
    map.getPane('tooltipPane').append(measurements);
    for(const c of candidates){const r=c.measure.getBoundingClientRect();c.width=r.width;c.height=r.height;delete c.measure;}
    measurements.remove();
    const seen=new Set();let count=0;
    const inside=(point,ring)=> {
      let yes=false;
      for(let i=0,j=ring.length-1;i<ring.length;j=i++) {
        const a=ring[i],b=ring[j];
        if((a[1]>point.lat)!==(b[1]>point.lat)&&point.lng<(b[0]-a[0])*(point.lat-a[1])/(b[1]-a[1])+a[0]) yes=!yes;
      }
      return yes;
    };
    const limit=Math.round(8+zoom*5);
    for(const c of candidates.sort((a,b)=>b.score-a.score)) {
      if(seen.has(c.n.id)) continue;
      const anchors=[c.center];
      // Interior fallback anchors keep large empires readable beside interface panels.
      for(const part of c.parts) {
        const points=part[0].map(p=>map.latLngToContainerPoint([p[1],p[0]]));
        const left=Math.max(20,Math.min(...points.map(p=>p.x))),right=Math.min(size.x-20,Math.max(...points.map(p=>p.x)));
        const top=Math.max(20,Math.min(...points.map(p=>p.y))),bottom=Math.min(size.y-20,Math.max(...points.map(p=>p.y)));
        for(const fy of [.5,.35,.65,.2,.8])for(const fx of [.5,.35,.65,.2,.8]) {
          const ll=map.containerPointToLatLng([left+(right-left)*fx,top+(bottom-top)*fy]);
          if(inside(ll,part[0])&&!part.slice(1).some(r=>inside(ll,r)))anchors.push(ll);
        }
      }
      const major=c.importance>=8;
      let placed=false;
      for(const anchor of anchors) {
        const p=map.latLngToContainerPoint(anchor);
        if(p.x<15||p.y<15||p.x>size.x-15||p.y>size.y-15)continue;
        const box={left:mapRect.left+p.x-c.width/2-7,right:mapRect.left+p.x+c.width/2+7,top:mapRect.top+p.y-c.height/2-5,bottom:mapRect.top+p.y+c.height/2+5};
        if(box.left<mapRect.left||box.right>mapRect.right||box.top<mapRect.top||box.bottom>mapRect.bottom||occupied.some(q=>box.left<q.right&&box.right>q.left&&box.top<q.bottom&&box.bottom>q.top))continue;
        L.marker(anchor,{pane:'tooltipPane',interactive:false,keyboard:false,icon:L.divIcon({className:c.className,html:c.html,iconSize:[c.width,c.height],iconAnchor:[c.width/2,c.height/2]})}).addTo(labelLayer);
        occupied.push(box);seen.add(c.n.id);count++;placed=true;break;
      }
      if(placed&&count>=limit)break;
    }
  }

  function selectEvent(e) {
    state.returnFocus=matchMedia('(max-width:760px)').matches ? $('sheet-toggle') : document.activeElement; state.activeEvent = e.id;
    if(matchMedia('(max-width:760px)').matches && $('events-panel').classList.contains('expanded')) $('sheet-toggle').click();
    document.querySelectorAll('.event-item').forEach(el => el.classList.toggle('active', el.dataset.id === e.id));
    const target = [e.lat,e.lon];
    const zoom = Math.max(map.getZoom(), 4);
    map.stop(); map.setView(target,zoom,{animate:false});
    L.popup({maxWidth:Math.min(310,innerWidth-60), autoPan:true,autoPanPaddingTopLeft:[15,70],autoPanPaddingBottomRight:[15,document.querySelector('.time-dock').offsetHeight+65]}).setLatLng(target).setContent(eventHTML(e)).openOn(map);
  }
  function renderEvents() {
    const signature=[state.year,state.window,[...enabledCategories].join(','),state.markers,map.getZoom(),state.events.length].join('|');
    if(state.eventsSignature===signature)return;state.eventsSignature=signature;
    eventLayer.clearLayers();
    const groups=new Map();
    const visible = state.events.filter(e => enabledCategories.has(e.category) && Math.abs(e.year - state.year) <= state.window);
    $('event-count').textContent = `${visible.length} 件`;
    const expanded=$('sheet-toggle').getAttribute('aria-expanded')==='true';
    $('sheet-toggle').textContent=`${expanded?'收合事件 ▾':'探索事件 ▴'} · ${visible.length} 件`;
    const list = $('event-list'); list.replaceChildren();
    if(state.eventsUnavailable){list.textContent='事件資料暫時無法載入；疆界與政體搜尋仍可使用。';return;}
    for (const e of visible) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'event-item'; button.dataset.id = e.id; button.classList.toggle('active',e.id===state.activeEvent);
      button.style.setProperty('--event-color',categories[e.category][0]);
      button.innerHTML = `<time>${Math.abs(e.year-state.year)} 年${e.year<state.year?'前':'後'} · ${categories[e.category][1]} ${esc(e.category)} · ${esc(eventDate(e))}</time><span class="event-arrow">↗</span><h3>${esc(e.title)}</h3><p>${esc(e.description)}</p>`;
      button.addEventListener('click', () => selectEvent(e)); list.append(button);
      if (state.markers) {
        const point=map.project([e.lat,e.lon],map.getZoom());
        const cell=map.getZoom()<4?`${Math.floor(point.x/58)},${Math.floor(point.y/58)}`:e.id;
        if(!groups.has(cell))groups.set(cell,[]);groups.get(cell).push(e);
      }
    }
    for(const group of groups.values()) {
      const e=group[0], [tint,symbol]=categories[e.category], many=group.length>1;
      const marker=L.marker([e.lat,e.lon],{icon:L.divIcon({className:'event-marker',html:`<span style="--event-color:${tint}">${many?group.length:symbol}</span>`,iconSize:[44,44],iconAnchor:[22,22]}),title:many?`${group.length} 件事件，放大展開`:e.title});
      marker.on('click',()=>many?map.setView([e.lat,e.lon],Math.min(8,map.getZoom()+2)):selectEvent(e));eventLayer.addLayer(marker);
    }
    $('announcer').textContent=`${yearText(state.year)}，${visible.length} 件事件`;
    if (!visible.length) {
      const empty = document.createElement('div'); empty.className = 'empty-events';
      empty.textContent = '這段時間沒有符合分類的事件。試著擴大探索範圍，或移動至鄰近年代。';
      const nearest = state.events.filter(e=>enabledCategories.has(e.category)).sort((a,b) => Math.abs(a.year-state.year)-Math.abs(b.year-state.year))[0];
      if (nearest) { const button = document.createElement('button'); button.type='button'; button.textContent=`前往最近事件：${yearText(nearest.year)} ↗`; button.onclick=()=>{setPlaying(false);setYear(nearest.year);selectEvent(nearest);}; empty.append(document.createElement('br'),button); }
      list.append(empty);
    }
  }
  function setYear(raw, direction = 1, debounceBorders = false) {
    let y = Math.min(MAX,Math.max(MIN,Math.round(Number(raw))));
    if (!Number.isFinite(y)) return;
    if (y === 0) y = direction < 0 ? -1 : 1;
    state.year = y;
    $('year-slider').value = positionFor(y); $('year-input').value = y;
    $('year-display').textContent = yearText(y); $('era-label').textContent = era(y);
    $('year-slider').setAttribute('aria-valuetext',yearText(y));
    $('year-slider').style.setProperty('--progress',`${positionFor(y)/10}%`);
    document.querySelectorAll('[data-year]').forEach(b => b.classList.toggle('active',Number(b.dataset.year)===y));
    map.closePopup();
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
  const segments=[[-5000,0],[-1000,200],[500,400],[1500,600],[1900,800],[2026,1000]];
  function interpolate(value,from,to){let i=0;while(i<segments.length-2&&value>segments[i+1][from])i++;const a=segments[i],b=segments[i+1];return a[to]+(value-a[from])/(b[from]-a[from])*(b[to]-a[to]);}
  const positionFor=y=>interpolate(y,0,1), yearFor=p=>Math.round(interpolate(p,1,0));
  function renderPolities(){
    const list=$('polity-list');if(!state.layer)return;list.replaceChildren();
    const q=$('polity-search').value.toLowerCase(),seen=new Set();
    state.layer.eachLayer(layer=>{const key=layer.feature.properties?.NAME;if(!key?.trim()||isAntarctica(layer.feature))return;const n=nameFor(key);if(!n.zh||seen.has(n.id)||!JSON.stringify([n.zh,n.native,n.aliases,n.endonyms,n.exonyms,n.geographicAliases,key]).toLowerCase().includes(q))return;seen.add(n.id);const b=document.createElement('button');b.textContent=n.zh;b.onclick=()=>{state.returnFocus=$('polity-open');$('polity-dialog').close();layer.openPopup(layer.getBounds().getCenter());};list.append(b);});
  }
  async function init() {
    $('time-options-toggle').onclick=()=>{const open=$('time-options').hidden;$('time-options').hidden=!open;$('time-options-toggle').setAttribute('aria-expanded',String(open));$('time-options-toggle').textContent=open?'收合 ▾':'設定 ▴';renderLabels();};
    $('polity-search').oninput=renderPolities;
    $('polity-open').onclick=()=>{$('polity-dialog').showModal();$('polity-search').focus();};
    $('polity-close').onclick=()=>$('polity-dialog').close();
    $('intro-toggle').onclick=()=>{const card=document.querySelector('.intro-card');card.classList.toggle('compact');$('intro-toggle').setAttribute('aria-expanded',String(!card.classList.contains('compact')));renderLabels();};
    new ResizeObserver(()=>{document.documentElement.style.setProperty('--dock-height',`${document.querySelector('.time-dock').offsetHeight}px`);}).observe(document.querySelector('.time-dock'));
    if (!window.L) { status('地圖元件未載入，請確認網路連線後重新整理。'); return; }
    map = L.map('map',{center:[26,45],zoom:2.25,minZoom:2,maxZoom:8,zoomSnap:.25,worldCopyJump:true,preferCanvas:true,zoomControl:true});
    map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
    map.createPane('land'); map.getPane('land').style.zIndex = 200;
    map.createPane('grid'); map.getPane('grid').style.zIndex = 210;
    map.attributionControl.addAttribution('疆界與陸地：<a href="https://github.com/aourednik/historical-basemaps">historical-basemaps</a> · GPL-3.0');
    baselinePromise=snapshotData({file:'world_2010.geojson'});
    baselinePromise.then(data => L.geoJSON(data,{renderer:L.canvas({pane:'land'}),pane:'land',interactive:false,style:{stroke:false,fillColor:'#354247',fillOpacity:1}}).addTo(map)).catch(()=>{});
    for (let lat = -60; lat <= 60; lat += 30) L.polyline([[lat,-180],[lat,180]],{pane:'grid',interactive:false,color:'#b0b9a3',weight:.5,opacity:.12,dashArray:'2 7'}).addTo(map);
    for (let lon = -180; lon <= 180; lon += 30) L.polyline([[-85,lon],[85,lon]],{pane:'grid',interactive:false,color:'#b0b9a3',weight:.5,opacity:.12,dashArray:'2 7'}).addTo(map);
    eventLayer=L.layerGroup().addTo(map); labelLayer=L.layerGroup().addTo(map);
    map.on('moveend zoomend resize',()=>{renderLabels();if(state.events.length)renderEvents();});
    map.on('popupopen',e=>{const el=e.popup.getElement();el.setAttribute('role','dialog');el.setAttribute('aria-label','歷史詳情');el.tabIndex=-1;el.focus({preventScroll:true});});
    map.on('popupclose',()=>{if(state.returnFocus?.isConnected)state.returnFocus.focus({preventScroll:true});});
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
    status('正在整理歷史資料…');
    try {
      const [snapshots,events,catalog,errata] = await Promise.all([json('data/snapshots.json'),json('data/events.json').catch(()=>{state.eventsUnavailable=true;return []}),json('data/polities.json'),json('data/errata.json')]);state.catalog=catalog;state.errata=errata;
      state.snapshots=snapshots.sort((a,b)=>a.year-b.year);state.events=events;
      const finishDrag=()=>{if(!state.dragging)return;state.dragging=false;clearTimeout(borderTimer);clearTimeout(state.eventTimer);renderEvents();state.labelsPending=true;loadBorders();};
      $('year-slider').addEventListener('pointerdown',()=>{state.dragging=true;});
      window.addEventListener('pointerup',finishDrag);
      window.addEventListener('pointercancel',finishDrag);
      $('year-slider').addEventListener('change',finishDrag);
      $('year-slider').oninput=e=>{setPlaying(false);setYear(yearFor(Number(e.target.value)),yearFor(Number(e.target.value))<state.year?-1:1,true);};
      $('year-form').onsubmit=e=>{e.preventDefault();if(!$('year-input').value.trim())return;setPlaying(false);setYear($('year-input').value);};
      $('play-button').onclick=async()=>{if(!state.playing&&state.year>=MAX)await setYear(MIN);setPlaying(!state.playing);};
      document.querySelectorAll('[data-year]').forEach(b=>b.onclick=()=>{setPlaying(false);setYear(b.dataset.year);});
      const initial = new URLSearchParams(location.search).get('year');
      await setYear(initial !== null && initial.trim() && Number.isFinite(Number(initial)) ? initial : -300);
    } catch(error) { console.error('歷史資料載入失敗',error); status('無法載入歷史資料。請透過 HTTP 伺服器開啟，並確認 data 資料夾完整。'); }
  }
  init();
})();
