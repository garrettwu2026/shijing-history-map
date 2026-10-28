import {nameDisplay} from './content.js';
export function renderLabelsView({state,map,labelLayer,isAntarctica,nameFor,esc}) {
    if(state.dragging||state.boundariesPending)return;
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
      const anchor=layer.feature.labelGeometry.anchors?.[0];
      const center=anchor?L.latLng(anchor[1],anchor[0]):bounds.getCenter();
      candidates.push({key,n,center,parts,anchors:layer.feature.labelGeometry.anchors,area,importance,score:Math.log1p(area*10000)+importance*1.6});
    });
    const occupied=[...document.querySelectorAll('.event-marker')].map(el=>el.getBoundingClientRect());
    occupied.push(...[...document.querySelectorAll('.intro-card,.events-panel,.time-dock,.map-toolbar,.map-key,.leaflet-control-zoom')].filter(el=>el.getClientRects().length).map(el=>el.getBoundingClientRect()));
    // Write every candidate first, then measure in one read phase. Anchor
    // collision trials use these dimensions and never read layout again.
    const mapRect=map.getContainer().getBoundingClientRect();
    const measurements=document.createElement('div');
    measurements.style.cssText='position:absolute;visibility:hidden;pointer-events:none';
    for(const c of candidates){
      const cleanName=nameDisplay(c.n.zh,c.n.nameStatus,false);
      c.html=`<span class="label-zh">${esc(cleanName)}</span>${c.n.native && c.n.native.length<28 && c.n.native!==c.n.zh?`<span class="label-native" dir="auto">${esc(c.n.native)}</span>`:''}`;
      c.className=`polity-label${c.importance>=8?' label-major':''}`;
      c.measure=document.createElement('div');c.measure.className=`leaflet-tooltip ${c.className}`;c.measure.innerHTML=c.html;measurements.append(c.measure);
    }
    map.getPane('tooltipPane').append(measurements);
    for(const c of candidates){const r=c.measure.getBoundingClientRect();c.width=r.width;c.height=r.height;delete c.measure;}
    measurements.remove();
    const seen=new Set();let count=0;
    const limit=Math.round(8+zoom*5);
    for(const c of candidates.sort((a,b)=>b.score-a.score)) {
      if(seen.has(c.n.id)) continue;
      const anchors=[c.center];
      for(const point of c.anchors||[])anchors.push(L.latLng(point[1],point[0]));
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
