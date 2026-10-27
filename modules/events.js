import {eventDistance,intersects} from './content.js';
export function renderEventsView({state,map,eventLayer,enabledCategories,categories,$,eventDate,esc,selectEvent,renderLabels,yearText,setPlaying,setYear}) {
    const signature=[state.year,state.window,[...enabledCategories].join(','),state.markers,map.getZoom(),state.events.length].join('|');
    if(state.eventsSignature===signature)return;state.eventsSignature=signature;
    eventLayer.clearLayers();
    const groups=new Map();
    const visible = state.events.filter(e => enabledCategories.has(e.category) && intersects(e,state.year,state.window)).sort((a,b)=>eventDistance(a,state.year)-eventDistance(b,state.year)||a.startYear-b.startYear||a.id.localeCompare(b.id));
    $('event-count').textContent = `${visible.length} 件`;
    const expanded=$('sheet-toggle').getAttribute('aria-expanded')==='true';
    $('sheet-toggle').textContent=`${expanded?'收合事件 ▾':'探索事件 ▴'} · ${visible.length} 件`;
    const list = $('event-list');
    const existing=new Map([...list.querySelectorAll('.event-item')].map(el=>[el.dataset.id,el]));
    const wanted=new Set(visible.map(e=>e.id));
    for(const child of [...list.children])if(!wanted.has(child.dataset.id))child.remove();
    let rowIndex=0;
    if(state.eventsUnavailable){list.textContent='事件資料暫時無法載入；疆界與政體搜尋仍可使用。';return;}
    for (const e of visible) {
      const button = existing.get(e.id)||document.createElement('button'); button.type = 'button'; button.className = 'event-item'; button.dataset.id = e.id; button.classList.toggle('active',e.id===state.activeEvent);
      button.style.setProperty('--event-color',categories[e.category][0]);
      const html = `<time>${eventDistance(e,state.year)===0?'涵蓋選取年':`${eventDistance(e,state.year)} 年${e.endYear<state.year?'前':'後'}`} · ${categories[e.category][1]} ${esc(e.category)} · ${esc(eventDate(e))}</time><span class="event-arrow">↗</span><h3>${esc(e.title)}</h3><p>${esc(e.description)}</p>`;
      if(button.innerHTML!==html)button.innerHTML=html;
      button.onclick=()=>selectEvent(e);if(list.children[rowIndex]!==button)list.insertBefore(button,list.children[rowIndex]||null);rowIndex++;
      if (state.markers) {
        const point=map.project([e.lat,e.lon],map.getZoom());
        const cell=`${Math.floor(point.x/64)},${Math.floor(point.y/64)}`;
        if(!groups.has(cell))groups.set(cell,[]);groups.get(cell).push(e);
      }
    }
    const clusters=[];
    for(const group of groups.values()) {const point=map.latLngToContainerPoint([group[0].lat,group[0].lon]);const near=clusters.find(c=>c.point.distanceTo(point)<58);if(near)near.events.push(...group);else clusters.push({point,events:[...group]});}
    for(const {events:group} of clusters) {
      const e=group[0], [tint,symbol]=categories[e.category], many=group.length>1;
      const marker=L.marker([e.lat,e.lon],{icon:L.divIcon({className:'event-marker',html:`<span style="--event-color:${tint}">${many?group.length:symbol}</span>`,iconSize:[44,44],iconAnchor:[22,22]}),title:many?`${group.length} 件事件，放大展開`:e.title});
      marker.on('click',()=>{if(many){const list=document.createElement('div');list.className='cluster-list';for(const item of group){const button=document.createElement('button');button.textContent=`${item.title} · ${eventDate(item)}`;button.onclick=()=>selectEvent(item);list.append(button);}L.popup({maxWidth:Math.min(310,innerWidth-60)}).setLatLng([e.lat,e.lon]).setContent(list).openOn(map);}else selectEvent(e);});eventLayer.addLayer(marker);
    }
    renderLabels();
    $('announcer').textContent=`${yearText(state.year)}，${visible.length} 件事件`;
    if (!visible.length) {
      const empty = document.createElement('div'); empty.className = 'empty-events';
      empty.textContent = '這段時間沒有符合分類的事件。試著擴大探索範圍，或移動至鄰近年代。';
      const nearest = state.events.filter(e=>enabledCategories.has(e.category)).sort((a,b) => eventDistance(a,state.year)-eventDistance(b,state.year))[0];
      if (nearest) { const button = document.createElement('button'); button.type='button'; button.textContent=`前往最近事件：${yearText(nearest.year)} ↗`; button.onclick=()=>{setPlaying(false);setYear(nearest.year);selectEvent(nearest);}; empty.append(document.createElement('br'),button); }
      list.append(empty);
    }
  }
