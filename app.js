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
  let map, eventLayer, labelLayer, borderRenderer, borderTimer, prefetchHandle;

  function hash(s) { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
  const color = name => name.trim() ? `hsl(${hash(name) % 360} ${24 + (hash(name) >>> 9) % 16}% ${52 + (hash(name) >>> 17) % 13}%)` : '#60716b';
  function nameFor(key) { return state.names[key] || {zh: key || '未命名區域', native: key || '未命名區域', aliases: []}; }
  function polityHTML(key) {
    const n = nameFor(key), known = !!state.names[key];
    return `<div class="popup-kicker">歷史政體 · ${esc(yearText(state.snapshot.year))}</div><h3 class="popup-title">${esc(n.zh)}</h3><div class="popup-native" dir="auto">${esc(n.native)}</div><div class="popup-aliases"><strong>別稱與資料集名稱</strong>${[...new Set([...(n.aliases || []),key])].map(esc).join(' · ')}</div>${known ? '' : '<div class="popup-note">尚無核實譯名，暫顯示資料集原名。</div>'}<div class="popup-note">疆界為歷史概略；不表示現代領土主張。</div>`;
  }
  function eventHTML(e) { return `<div class="popup-event"><div class="popup-kicker">${esc(eventDate(e))} · ${esc(e.category)}</div><h3 class="popup-title">${esc(e.title)}</h3><p>${esc(e.description)}</p></div>`; }
  async function json(path) { const response = await fetch(path); if (!response.ok) throw new Error(`${path} (${response.status})`); return response.json(); }
  async function snapshotData(s) {
    if (state.cache.has(s.file)) return state.cache.get(s.file);
    const promise = json(`data/${s.file}`);
    state.cache.set(s.file, promise);
    try {
      const data = await promise;
      return data;
    } catch (error) { state.cache.delete(s.file); throw error; }
  }
  function prefetchAdjacent(s) {
    const idle = window.requestIdleCallback || (callback => setTimeout(callback, 250));
    const cancelIdle = window.cancelIdleCallback || clearTimeout;
    if (prefetchHandle != null) cancelIdle(prefetchHandle);
    prefetchHandle = idle(async () => {
      prefetchHandle = null;
      const index = state.snapshots.indexOf(s);
      for (const adjacent of [state.snapshots[index + 1], state.snapshots[index - 1]]) {
        if (state.snapshot !== s) return;
        if (adjacent) await snapshotData(adjacent).catch(() => {});
      }
    });
  }
  function snapshotFor(year) { return state.snapshots.filter(s => s.year <= year).at(-1) || state.snapshots[0]; }
  function updateSnapshotCaption(s, pending = false) {
    $('snapshot-label').textContent = `${pending ? '正在載入' : '疆界快照'}：${yearText(s.year)}`;
    $('snapshot-note').textContent = pending ? '地圖正在更新，請稍候' : state.year < s.year ? '早於最早可用資料，顯示最早快照' : state.year > state.snapshots.at(-1).year ? '最新疆界資料止於 2010 年，並非當代精確國界' : s.year === state.year ? '選取年份與疆界快照相同' : `使用選取年份之前最近的快照，相差 ${state.year - s.year} 年`;
  }
  async function loadBorders() {
    const s = snapshotFor(state.year);
    const token = ++state.request;
    if (state.snapshot?.file === s.file) { updateSnapshotCaption(s); status(); return; }
    updateSnapshotCaption(s, true);
    // Remove the previous snapshot so its boundaries cannot be mistaken for the requested year.
    if (state.layer) { map.removeLayer(state.layer); state.layer = null; }
    state.snapshot = null;
    labelLayer.clearLayers();
    status('正在展開歷史疆界…');
    try {
      const data = await snapshotData(s);
      if (token !== state.request) return;
      state.snapshot = s;
      const layer = L.geoJSON(data, {
        renderer: borderRenderer,
        style: f => ({color: color(f.properties?.NAME || ''), weight: .8, opacity: .85, fillColor: color(f.properties?.NAME || ''), fillOpacity: .42, smoothFactor: 1.2}),
        onEachFeature: (f, polygon) => {
          const key = f.properties?.NAME || '未命名區域';
          polygon.bindPopup(() => polityHTML(key), {maxWidth: 330, autoPanPadding: [45, 60]});
          polygon.on('mouseover', () => polygon.setStyle({weight: 1.8, fillOpacity: .65, color: '#ead6a6'}));
          polygon.on('mouseout', () => layer.resetStyle(polygon));
        }
      }).addTo(map);
      state.layer = layer;
      $('polity-count').textContent = `${new Set(data.features.map(f => f.properties?.NAME).filter(n => n && n.trim())).size} 個政體與區域`;
      updateSnapshotCaption(s);
      renderLabels(); status();
      prefetchAdjacent(s);
    } catch (error) {
      if (token !== state.request) return;
      console.error('疆界載入失敗', error);
      $('snapshot-label').textContent = '疆界載入失敗';
      $('snapshot-note').textContent = '請確認 data 資料夾完整，重新選取年份即可重試';
      status('無法載入疆界。請確認伺服器與 data 資料夾，再重選年份。');
      setPlaying(false);
    }
  }
  // Spherical polygon area prevents a long, narrow bounding box from winning priority.
  function ringArea(ring) {
    let sum = 0;
    for (let i=0; i<ring.length; i++) {
      const a=ring[i], b=ring[(i+1)%ring.length];
      let dx=(b[0]-a[0])*Math.PI/180;
      if(dx>Math.PI) dx-=2*Math.PI; if(dx < -Math.PI) dx+=2*Math.PI;
      sum += dx*(2+Math.sin(a[1]*Math.PI/180)+Math.sin(b[1]*Math.PI/180));
    }
    return Math.abs(sum);
  }
  function renderLabels() {
    labelLayer.clearLayers();
    if (!state.labels || !state.layer) return;
    const candidates=[], zoom=map.getZoom(), size=map.getSize();
    state.layer.eachLayer(layer => {
      if (!layer.getBounds) return;
      const key=layer.feature.properties?.NAME, bounds=layer.getBounds();
      if (!key?.trim() || !bounds.isValid() || !map.getBounds().intersects(bounds)) return;
      const geometry=layer.feature.geometry;
      const polygons=geometry.type==='MultiPolygon'?geometry.coordinates:[geometry.coordinates];
      const area=polygons.reduce((sum,p)=>sum+Math.max(0,ringArea(p[0])-p.slice(1).reduce((v,r)=>v+ringArea(r),0)),0);
      const n=nameFor(key), importance=n.importance || 0;
      const projected=area*Math.pow(2,2*zoom)*1200;
      if(projected < 3000/Math.max(1,zoom-1) && importance<8) return;
      const parts=polygons.filter(p=>p[0]?.length).sort((a,b)=>ringArea(b[0])-ringArea(a[0]));
      const center=layer.getCenter ? layer.getCenter() : bounds.getCenter();
      candidates.push({key,n,center,parts,area,importance,score:Math.log1p(area*10000)+importance*1.6});
    });
    const occupied=[...document.querySelectorAll('.intro-card,.events-panel,.time-dock,.map-toolbar,.map-key,.leaflet-control-zoom')].filter(el=>el.getClientRects().length).map(el=>el.getBoundingClientRect());
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
      if(seen.has(c.key)) continue;
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
      const html=`<span class="label-zh">${esc(c.n.zh)}</span>${c.n.native!==c.n.zh?`<span class="label-native" dir="auto">${esc(c.n.native)}</span>`:''}`;
      let placed=false;
      const mapRect=map.getContainer().getBoundingClientRect();
      for(const anchor of anchors) {
        const p=map.latLngToContainerPoint(anchor);
        if(p.x<15||p.y<15||p.x>size.x-15||p.y>size.y-15)continue;
        const tip=L.tooltip({permanent:true,direction:'center',className:`polity-label${major?' label-major':''}`,opacity:1,interactive:false}).setLatLng(anchor).setContent(html).addTo(labelLayer);
        const r=tip.getElement().getBoundingClientRect();
        const box={left:r.left-7,right:r.right+7,top:r.top-5,bottom:r.bottom+5};
        if(box.left<mapRect.left||box.right>mapRect.right||box.top<mapRect.top||box.bottom>mapRect.bottom||occupied.some(q=>box.left<q.right&&box.right>q.left&&box.top<q.bottom&&box.bottom>q.top)) {labelLayer.removeLayer(tip);continue;}
        occupied.push(box);seen.add(c.key);count++;placed=true;break;
      }
      if(placed&&count>=limit)break;
    }
  }

  function selectEvent(e) {
    state.activeEvent = e.id;
    if(matchMedia('(max-width:760px)').matches && $('events-panel').classList.contains('expanded')) $('sheet-toggle').click();
    document.querySelectorAll('.event-item').forEach(el => el.classList.toggle('active', el.dataset.id === e.id));
    const target = [e.lat,e.lon];
    const zoom = Math.max(map.getZoom(), 4);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) map.setView(target,zoom); else map.flyTo(target,zoom,{duration:1.2});
    L.popup({maxWidth:310, autoPan:false}).setLatLng(target).setContent(eventHTML(e)).openOn(map);
  }
  function renderEvents() {
    eventLayer.clearLayers();
    const visible = state.events.filter(e => enabledCategories.has(e.category) && Math.abs(e.year - state.year) <= state.window);
    $('event-count').textContent = `${visible.length} 件`;
    const expanded=$('sheet-toggle').getAttribute('aria-expanded')==='true';
    $('sheet-toggle').textContent=`${expanded?'收合事件 ▾':'探索事件 ▴'} · ${visible.length} 件`;
    const list = $('event-list'); list.replaceChildren();
    for (const e of visible) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'event-item'; button.dataset.id = e.id; button.classList.toggle('active',e.id===state.activeEvent);
      button.style.setProperty('--event-color',categories[e.category][0]);
      button.innerHTML = `<time>${categories[e.category][1]} ${esc(e.category)} · ${esc(eventDate(e))}</time><span class="event-arrow">↗</span><h3>${esc(e.title)}</h3><p>${esc(e.description)}</p>`;
      button.addEventListener('click', () => selectEvent(e)); list.append(button);
      if (state.markers) {
        const [tint,symbol]=categories[e.category];
        const marker = L.marker([e.lat,e.lon], {icon:L.divIcon({className:'event-marker',html:`<span style="--event-color:${tint}">${symbol}</span>`,iconSize:[24,24],iconAnchor:[12,12]}),title:e.title,alt:e.title, keyboard:true,riseOnHover:true});
        marker.on('click', () => selectEvent(e)); eventLayer.addLayer(marker);
      }
    }
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
    $('year-slider').value = y; $('year-input').value = y;
    $('year-display').textContent = yearText(y); $('era-label').textContent = era(y);
    $('year-slider').setAttribute('aria-valuetext',yearText(y));
    $('year-slider').style.setProperty('--progress',`${(y-MIN)/(MAX-MIN)*100}%`);
    document.querySelectorAll('[data-year]').forEach(b => b.classList.toggle('active',Number(b.dataset.year)===y));
    map.closePopup(); renderEvents();
    const url = new URL(location.href); url.searchParams.set('year',y); history.replaceState(null,'',url);
    clearTimeout(borderTimer);
    if (debounceBorders) {
      // Invalidate an in-flight swap immediately, while the slider keeps moving.
      ++state.request;
      borderTimer = setTimeout(loadBorders, 150);
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
  async function init() {
    if (!window.L) { status('地圖元件未載入，請確認網路連線後重新整理。'); return; }
    map = L.map('map',{center:[26,45],zoom:2.25,minZoom:2,maxZoom:8,zoomSnap:.25,worldCopyJump:true,preferCanvas:true,zoomControl:true});
    borderRenderer = L.canvas();
    map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
    map.createPane('land'); map.getPane('land').style.zIndex = 200;
    map.createPane('grid'); map.getPane('grid').style.zIndex = 210;
    map.attributionControl.addAttribution('疆界與陸地：<a href="https://github.com/aourednik/historical-basemaps">historical-basemaps</a> · GPL-3.0');
    snapshotData({file:'world_2010.geojson'}).then(data => L.geoJSON(data,{renderer:L.canvas({pane:'land'}),pane:'land',interactive:false,style:{stroke:false,fillColor:'#354247',fillOpacity:1}}).addTo(map)).catch(()=>{});
    for (let lat = -60; lat <= 60; lat += 30) L.polyline([[lat,-180],[lat,180]],{pane:'grid',interactive:false,color:'#b0b9a3',weight:.5,opacity:.12,dashArray:'2 7'}).addTo(map);
    for (let lon = -180; lon <= 180; lon += 30) L.polyline([[-85,lon],[85,lon]],{pane:'grid',interactive:false,color:'#b0b9a3',weight:.5,opacity:.12,dashArray:'2 7'}).addTo(map);
    eventLayer=L.layerGroup().addTo(map); labelLayer=L.layerGroup().addTo(map);
    map.on('moveend zoomend resize',renderLabels);
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
      const [snapshots,names,events] = await Promise.all([json('data/snapshots.json'),json('data/names.json'),json('data/events.json')]);
      state.snapshots=snapshots.sort((a,b)=>a.year-b.year);state.names=names;state.events=events;
      $('year-slider').oninput=e=>{setPlaying(false);setYear(e.target.value,Number(e.target.value)<state.year?-1:1,true);};
      $('year-form').onsubmit=e=>{e.preventDefault();if(!$('year-input').value.trim())return;setPlaying(false);setYear($('year-input').value);};
      $('play-button').onclick=async()=>{if(!state.playing&&state.year>=MAX)await setYear(MIN);setPlaying(!state.playing);};
      document.querySelectorAll('[data-year]').forEach(b=>b.onclick=()=>{setPlaying(false);setYear(b.dataset.year);});
      const initial = new URLSearchParams(location.search).get('year');
      await setYear(initial !== null && initial.trim() && Number.isFinite(Number(initial)) ? initial : -300);
    } catch(error) { console.error('歷史資料載入失敗',error); status('無法載入歷史資料。請透過 HTTP 伺服器開啟，並確認 data 資料夾完整。'); }
  }
  init();
})();
