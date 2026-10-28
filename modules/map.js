import {cleanMapLabel} from './content.js';
const empty=()=>({type:'FeatureCollection',features:[]});
export async function createMap(){
  const map=new maplibregl.Map({container:'map',center:[45,26],zoom:1.25,minZoom:1,maxZoom:8,renderWorldCopies:true,fadeDuration:0,canvasContextAttributes:{antialias:false},pixelRatio:Math.min(devicePixelRatio,matchMedia('(max-width:760px)').matches?1:2),localIdeographFontFamily:"'Noto Sans TC','PingFang TC','Microsoft JhengHei',sans-serif",style:{version:8,glyphs:new URL('vendor/maplibre/glyphs/',location.href).href+'{fontstack}/{range}.pbf',sources:{},layers:[{id:'ocean',type:'background',paint:{'background-color':'#18282d'}}]},attributionControl:false});
  await new Promise((resolve,reject)=>{map.once('load',resolve);map.once('error',reject);});
  map.addControl(new maplibregl.NavigationControl({showCompass:false}),'top-left');
  const attribution=document.createElement('div');attribution.className='map-attribution';attribution.innerHTML='MapLibre GL JS · 疆界與陸地：<a href="https://github.com/aourednik/historical-basemaps">historical-basemaps</a> · GPL-3.0';document.querySelector('#time-options').append(attribution);
  for(const id of ['land','polities','disputed','labels'])map.addSource(id,{type:'geojson',data:empty(),tolerance:1,buffer:16,maxzoom:7,lineMetrics:false});
  map.addLayer({id:'land-fill',source:'land',type:'fill',paint:{'fill-antialias':false,'fill-color':'#354247'}});
  const grid=[];for(let lat=-60;lat<=60;lat+=30)grid.push({type:'Feature',geometry:{type:'LineString',coordinates:[[-180,lat],[180,lat]]}});for(let lon=-180;lon<=180;lon+=30)grid.push({type:'Feature',geometry:{type:'LineString',coordinates:[[lon,-85],[lon,85]]}});
  map.addSource('grid',{type:'geojson',data:{type:'FeatureCollection',features:grid}});map.addLayer({id:'grid-line',source:'grid',type:'line',paint:{'line-color':'#b0b9a3','line-opacity':.12,'line-width':.5,'line-dasharray':[2,7]}});
  const active=['any',['boolean',['feature-state','selected'],false],['boolean',['feature-state','hover'],false]];
  for(const source of ['polities','disputed']){
    map.addLayer({id:source+'-fill',source,type:'fill',paint:{'fill-antialias':false,'fill-color':['get','tint'],'fill-opacity':['case',active,.65,['get','alpha']]}});
    map.addLayer({id:source+'-line',source,type:'line',paint:{'line-color':['case',active,'#fff0b5',['get','border']],'line-width':['case',['boolean',['feature-state','selected'],false],3,['boolean',['feature-state','hover'],false],1.8,['get','weight']],'line-opacity':.85,...(source==='disputed'?{'line-dasharray':[9,4,2,4]}:{})}});
  }
  map.addLayer({id:'polity-labels',source:'labels',type:'symbol',layout:{'text-field':['get','name'],'text-font':['Noto Sans TC Regular'],'text-size':['interpolate',['linear'],['zoom'],1,13,4,16],'text-max-width':10,'text-padding':8,'symbol-sort-key':['get','priority'],'text-allow-overlap':false},paint:{'text-color':'#f0e8d2','text-halo-color':'#101b21','text-halo-width':2}});
  return map;
}
export function showPopup(map,point,content){
  map.activePopup?.remove();
  // Keep the geographic anchor, shifting only the popup to clear viewport edges and timeline.
  const rect=map.getContainer().getBoundingClientRect(),dockTop=document.querySelector('.time-dock').getBoundingClientRect().top;
  const available=Math.max(80,dockTop-rect.top-16);
  const anchor=map.project(point);
  const popup=new maplibregl.Popup({maxWidth:Math.min(360,innerWidth-32)+'px',anchor:'center',closeOnClick:false}).setLngLat(point);
  typeof content==='string'?popup.setHTML(content):popup.setDOMContent(content);
  map.activePopup=popup;popup.on('close',()=>map.fire('detailclose'));popup.addTo(map);
  // Escape the map's z-index:0 stacking context so HTML panels cannot cover details.
  map.getContainer().parentElement.append(popup.getElement());popup.getElement().querySelector('.maplibregl-popup-content').style.maxHeight=Math.max(60,available-16)+'px';
  const fit=()=>{
    const rect=map.getContainer().getBoundingClientRect();
    const available=Math.max(80,document.querySelector('.time-dock').getBoundingClientRect().top-rect.top-16);
    const el=popup.getElement();
    el.querySelector('.maplibregl-popup-content').style.maxHeight=Math.max(60,available-16)+'px';
    const box=el.getBoundingClientRect(),anchor=map.project(point);
    const x=Math.max(box.width/2+16,Math.min(rect.width-box.width/2-16,anchor.x));
    const y=Math.max(box.height/2+8,Math.min(available-box.height/2-8,anchor.y));
    popup.setOffset([x-anchor.x,y-anchor.y]);
  };
  // Lazy content and disclosure toggles change the height after opening.
  const observer=new ResizeObserver(fit);
  observer.observe(popup.getElement().querySelector('.maplibregl-popup-content'));
  map.on('resize',fit);popup.on('close',()=>{observer.disconnect();map.off('resize',fit);});
  fit();map.fire('detailopen');
  return popup;
}
export function renderGeometry(map,data,state,isAntarctica,stableColor){
  const groups={polities:empty(),disputed:empty()};map.activePopup?.remove();
  for(const source of Object.keys(groups))map.removeFeatureState({source});
  data.features.forEach((feature,i)=>{
    const key=feature.properties?.NAME||'',p=state.catalog.polities[state.catalog.index[key]],neutral=isAntarctica(feature)||!key.trim();
    const review=state.errata?.featureReviews?.some(r=>r.match===key&&state.snapshot.year>=r.fromYear&&state.snapshot.year<=r.toYear),disputed=review||p?.entityType==='cultural-area';
    const tint=neutral?'#91a6ab':stableColor(p?.id||key),source=disputed?'disputed':'polities';
    feature.id=i;feature.renderSource=source;
    groups[source].features.push({type:'Feature',id:i,geometry:feature.geometry,properties:{NAME:key,renderId:i,antarctica:isAntarctica(feature),tint,border:review?'#ffe3a3':tint,weight:review?2.5:.8,alpha:neutral?.22:p?.entityType==='cultural-area'?.18:.42}});
  });
  for(const [source,data] of Object.entries(groups))map.getSource(source).setData(data);
}
export function renderLabelsView({state,map,isAntarctica,nameFor}){
  if(state.dragging||state.boundariesPending)return;
  const features=[],seen=new Set();
  for(const f of [...(state.layer?.features||[])].sort((a,b)=>(b.labelGeometry?.area||0)-(a.labelGeometry?.area||0))){
    if(isAntarctica(f))continue;const n=nameFor(f.properties?.NAME),point=f.labelGeometry?.anchors?.[0];
    // Keep the clean spelling intact; details retain the annotated display name.
    const name=cleanMapLabel(n.zh);
    if(!point||!name||seen.has(n.id))continue;seen.add(n.id);
    features.push({type:'Feature',geometry:{type:'Point',coordinates:point},properties:{name,polityId:n.id,NAME:f.properties.NAME,priority:-(n.importance||0)}});
  }
  const visibility=state.labels?'visible':'none';
  if(map.getLayoutProperty('polity-labels','visibility')!==visibility)map.setLayoutProperty('polity-labels','visibility',visibility);
  const signature=`${state.snapshot?.year}|${features.length}`;
  if(state.labelSignature!==signature){map.getSource('labels').setData({type:'FeatureCollection',features});state.labelSignature=signature;}
}
export function polityBounds(features){
  const boxes=features.map(f=>f.labelGeometry.bounds),south=Math.min(...boxes.map(b=>b[1])),north=Math.max(...boxes.map(b=>b[3]));
  let west=Math.min(...boxes.map(b=>b[0])),east=Math.max(...boxes.map(b=>b[2]));
  if(east-west>180){const shifted=boxes.map(b=>b[0]<0?[b[0]+360,b[2]+360]:[b[0],b[2]]),w=Math.min(...shifted.map(b=>b[0])),e=Math.max(...shifted.map(b=>b[1]));if(e-w<east-west){west=w;east=e;}}
  return [[west,south],[east,north]];
}

// Populate MapLibre's local glyph cache once, before the first interactive snapshot.
// The transparent temporary layer uses only the catalog's existing CJK characters.
export async function warmLabelGlyphs(map,catalog,errata){
  const names=[];
  for(const p of Object.values(catalog.polities)){names.push(p.zh);for(const period of p.periods||[])names.push(period.zh);}
  for(const override of errata?.overrides||[])names.push(override.zh);
  const chars=[...new Set(names.filter(Boolean).join('').replace(/[^\u3400-\u9fff\uf900-\ufaff]/gu,''))].join('');
  map.addSource('glyph-warmup',{type:'geojson',data:{type:'FeatureCollection',features:[{type:'Feature',geometry:{type:'Point',coordinates:map.getCenter().toArray()},properties:{name:chars}}]}});
  map.addLayer({id:'glyph-warmup',type:'symbol',source:'glyph-warmup',layout:{'text-field':['get','name'],'text-font':['Noto Sans TC Regular'],'text-allow-overlap':true},paint:{'text-opacity':0}});
  await new Promise(resolve=>map.once('idle',resolve));
  map.removeLayer('glyph-warmup');map.removeSource('glyph-warmup');
}
