import {cleanMapLabel} from './content.js';
const empty=()=>({type:'FeatureCollection',features:[]});
export async function createMap(){
  const map=new maplibregl.Map({container:'map',center:[45,26],zoom:1.25,minZoom:1,maxZoom:8,renderWorldCopies:true,fadeDuration:0,canvasContextAttributes:{antialias:false},pixelRatio:Math.min(devicePixelRatio,matchMedia('(max-width:760px)').matches?1:.75),localIdeographFontFamily:"'Noto Sans TC','PingFang TC','Microsoft JhengHei',sans-serif",style:{version:8,state:{coarseOpacity:{default:1},fineOpacity:{default:1}},glyphs:new URL('vendor/maplibre/glyphs/',location.href).href+'{fontstack}/{range}.pbf',sources:{},layers:[{id:'ocean',type:'background',paint:{'background-color':'#101f27'}}]},attributionControl:false});
  await new Promise((resolve,reject)=>{map.once('load',resolve);map.once('error',reject);});
  map.addControl(new maplibregl.NavigationControl({showCompass:false}),'top-left');
  for(const id of ['land','coast','polities','disputed','labels','visible-labels'])map.addSource(id,{type:'geojson',data:empty(),tolerance:1,buffer:16,maxzoom:7,lineMetrics:false});
  map.addLayer({id:'land-fill',source:'land',type:'fill',paint:{'fill-antialias':false,'fill-color':'#414b49'}});
  const grid=[];for(let lat=-60;lat<=60;lat+=30)grid.push({type:'Feature',geometry:{type:'LineString',coordinates:[[-180,lat],[180,lat]]}});for(let lon=-180;lon<=180;lon+=30)grid.push({type:'Feature',geometry:{type:'LineString',coordinates:[[lon,-85],[lon,85]]}});
  map.addSource('grid',{type:'geojson',data:{type:'FeatureCollection',features:grid}});map.addLayer({id:'grid-line',source:'grid',type:'line',paint:{'line-color':'#b0b9a3','line-opacity':['interpolate',['linear'],['zoom'],1,.12,3,.05,4.5,0],'line-width':.5,'line-dasharray':[2,7]}});
  map.addLayer({id:'coast-line',source:'coast',type:'line',paint:{'line-color':'#9ba89d','line-opacity':.35,'line-width':['interpolate',['linear'],['zoom'],1,.35,5,.65,8,.85]}});
  const dots=new Uint8Array(16*16*4);for(let y=6;y<8;y++)for(let x=6;x<8;x++){const i=(y*16+x)*4;dots.set([190,205,191,110],i);}map.addImage('culture-dots',{width:16,height:16,data:dots});
  for(const source of ['polities','disputed']){
    map.addLayer({id:source+'-fill',source,type:'fill',filter:source==='polities'?['==',['get','neutral'],false]:['!=',['get','culture'],true],paint:{'fill-antialias':false,'fill-color':['get','tint'],'fill-opacity':['*',.53,['number',['global-state','coarseOpacity'],1]]}});
    map.addLayer({id:source+'-line',source,type:'line',filter:source==='disputed'?['==',['get','review'],true]:['==',['get','neutral'],false],paint:{'line-color':'#182b30','line-width':['interpolate',['linear'],['zoom'],1,.45,3,.65,5,1,8,1.4],'line-opacity':.95,...(source==='disputed'?{'line-dasharray':[9,4,2,4]}:{})}});
  }
  map.addLayer({id:'neutral-hit',source:'polities',type:'fill',filter:['==',['get','neutral'],true],paint:{'fill-opacity':0}});
  map.moveLayer('neutral-hit','polities-fill');
  map.addLayer({id:'culture-fill',source:'disputed',type:'fill',filter:['==',['get','culture'],true],paint:{'fill-antialias':false,'fill-color':['get','tint'],'fill-opacity':['*',.20,['number',['global-state','coarseOpacity'],1]]}});
  map.addLayer({id:'culture-pattern',source:'disputed',type:'fill',layout:{visibility:'none'},filter:['==',['get','culture'],true],paint:{'fill-pattern':'culture-dots','fill-opacity':['*',.6,['number',['global-state','coarseOpacity'],1]]}});
  map.addLayer({id:'culture-line',source:'disputed',type:'line',filter:['all',['==',['get','culture'],true],['==',['get','review'],false]],paint:{'line-color':'#839b94','line-width':['interpolate',['linear'],['zoom'],1,.4,8,1],'line-opacity':.6}});
  for(const source of ['polities','disputed'])map.addLayer({id:source+'-selection',source,type:'line',filter:['==',['get','NAME'],''],paint:{'line-color':'#efd397','line-width':['interpolate',['linear'],['zoom'],1,1.4,5,2.3,8,3],'line-opacity':1}});

  map.addLayer({id:'polity-labels',source:'visible-labels',type:'symbol',layout:{'text-field':['get','name'],'text-font':['Noto Sans TC Regular'],'text-size':['interpolate',['linear'],['zoom'],1,13,4,16],'text-max-width':10,'text-padding':8,'symbol-sort-key':['get','priority'],'text-allow-overlap':false},paint:{'text-color':'#f0e8d2','text-halo-color':'#101b21','text-halo-width':1.3}});
  // Fine sources and layers are created only after the first high-zoom payload.
  const displayLayers=map.getStyle().layers.filter(l=>['land','coast','polities','disputed'].includes(l.source));
  const opacityProperties={fill:'fill-opacity',line:'line-opacity'};
  map.initializeDetail=()=>{
    if(!map.fineInitialized){for(const id of ['fine-land','fine-polities','fine-disputed'])map.addSource(id,{type:'geojson',data:empty(),tolerance:1,buffer:16,maxzoom:8});map.fineInitialized=true;}
    for(const layer of displayLayers){
      const id='fine-'+layer.id;if(map.getLayer(id))continue;
      const clone=JSON.parse(JSON.stringify(layer).replaceAll('coarseOpacity','fineOpacity'));clone.id=id;clone.source=['land','coast'].includes(layer.source)?'fine-land':'fine-'+layer.source;clone.layout={...clone.layout,visibility:'none'};
      if(layer.id.endsWith('-selection'))clone.filter=map.getFilter(layer.id);
      map.addLayer(clone,'polity-labels');const property=opacityProperties[layer.type];map.setPaintProperty(layer.id,property+'-transition',{duration:0});map.setPaintProperty(id,property+'-transition',{duration:0});
    }
  };
  map.removeFineLayers=()=>{if(!map.fineInitialized)return;for(const layer of displayLayers)if(map.getLayer('fine-'+layer.id))map.removeLayer('fine-'+layer.id);for(const id of ['fine-land','fine-polities','fine-disputed']){map.removeSource(id);if(map.renderFeatureIDs)delete map.renderFeatureIDs[id];}map.fineInitialized=false;};
  map.displayDetail=enabled=>{map.detailDisplayed=enabled;if(!map.fineInitialized)return;map.setLayoutProperty('coast-line','visibility',map.motionQuality||!map.decorationsReady?'none':'visible');
    map.setGlobalStateProperty('coarseOpacity',enabled?0:1);map.setGlobalStateProperty('fineOpacity',1);
    for(const layer of displayLayers){
      const property=opacityProperties[layer.type],variable=layer.type==='fill'&&['polities','disputed'].includes(layer.source);
      if(!variable){map.setPaintProperty(layer.id,property,enabled?0:(layer.paint?.[property]??1));if(map.getLayer('fine-'+layer.id))map.setPaintProperty('fine-'+layer.id,property,layer.paint?.[property]??1);}
      if(map.getLayer('fine-'+layer.id))map.setLayoutProperty('fine-'+layer.id,'visibility',enabled?'visible':'none');
    }
  };
  map.prepareDetail=()=>{map.initializeDetail();map.displayDetail(false);map.setGlobalStateProperty('fineOpacity',0);
    for(const layer of displayLayers){if(!(layer.type==='fill'&&['polities','disputed'].includes(layer.source)))map.setPaintProperty('fine-'+layer.id,opacityProperties[layer.type],0);map.setLayoutProperty('fine-'+layer.id,'visibility','visible');}
  };
  map.setMotionQuality=moving=>{map.motionQuality=moving;
    for(const id of ['coast-line','culture-pattern'])map.setLayoutProperty(id,'visibility',moving||!map.decorationsReady?'none':'visible');
    map.setLayoutProperty('polity-labels','visibility',!moving&&map.labelsEnabled!==false?'visible':'none');
  };
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
export function renderGeometry(map,data,state,isAntarctica,stableColor,preservePopup=false,fine=false){
  const groups={polities:empty(),disputed:empty()};if(!preservePopup)map.activePopup?.remove();
  for(const source of Object.keys(groups))map.removeFeatureState({source:fine?'fine-'+source:source});
  data.features.forEach((feature,i)=>{
    const key=feature.properties?.NAME||'',p=state.catalog.polities[state.catalog.index[key]],neutral=isAntarctica(feature)||!key.trim();
    const review=state.errata?.featureReviews?.some(r=>r.match===key&&state.snapshot.year>=r.fromYear&&state.snapshot.year<=r.toYear),disputed=review||p?.entityType==='cultural-area';
    const tint=neutral?'#91a6ab':stableColor(p?.id||key),source=disputed?'disputed':'polities';
    feature.id=i;if(!fine)feature.renderSource=source;
    groups[source].features.push({type:'Feature',id:i,geometry:feature.geometry,properties:{NAME:key,renderId:i,antarctica:isAntarctica(feature),tint,review:!!review,culture:p?.entityType==='cultural-area',neutral,border:'#182b30',weight:.8,alpha:neutral?0:p?.entityType==='cultural-area'?.20:.53}});
  });
  updateSelectionOutline(map,state);
  for(const [key,data] of Object.entries(groups)){const source=fine?'fine-'+key:key;(map.renderFeatureIDs ||= {})[source]=data.features.map(f=>f.id);map.getSource(source).setData(data);for(const f of data.features)if(state.catalog.index[f.properties.NAME]===state.selectedPolity)map.setFeatureState({source,id:f.id},{selected:true});}
}
export function renderLabelsView({state,map,isAntarctica,nameFor}){
  if(state.dragging||state.boundariesPending)return;
  map.labelsEnabled=state.labels;const visibility=state.labels&&!map.motionQuality?'visible':'none';
  if(map.getLayoutProperty('polity-labels','visibility')!==visibility)map.setLayoutProperty('polity-labels','visibility',visibility);
  const viewSignature=[state.snapshot?.year,state.selectedPolity,map.getZoom().toFixed(2),map.getCenter().toArray().map(n=>n.toFixed(2)),innerWidth,innerHeight,state.eventsSignature,document.body.className,document.querySelector('.events-panel').className,document.querySelector('.intro-card').className,document.querySelector('#time-options').hidden,document.querySelector('#map-legend').className].join('|');
  if(state.labelViewSignature===viewSignature)return;state.labelViewSignature=viewSignature;
  const features=[],seen=new Set();
  const mapRect=map.getContainer().getBoundingClientRect(),blocked=[...document.querySelectorAll('.events-panel,.time-dock,.map-toolbar,.intro-card,.map-key')].filter(el=>getComputedStyle(el).visibility!=='hidden'&&el.getClientRects().length).map(el=>el.getBoundingClientRect());
  const markerRects=[...document.querySelectorAll('.event-marker')].map(el=>el.getBoundingClientRect());
  const clear=(point,name='')=>{
    const q=map.project(point),x=q.x+mapRect.left,y=q.y+mapRect.top;
    const size=13+Math.min(1,Math.max(0,(map.getZoom()-1)/3))*3;
    const halfWidth=Math.min(10,[...name].length)*size/2+8,halfHeight=Math.ceil(Math.max(1,[...name].length)/10)*size/2+6;
    const box={left:x-halfWidth,right:x+halfWidth,top:y-halfHeight,bottom:y+halfHeight};
    const overlaps=b=>box.right>b.left&&box.left<b.right&&box.bottom>b.top&&box.top<b.bottom;
    return box.left>mapRect.left+8&&box.right<mapRect.right-8&&box.top>mapRect.top+8&&box.bottom<mapRect.bottom-8&&!blocked.some(overlaps)&&!markerRects.some(overlaps);
  };
  for(const f of [...(state.layer?.features||[])].sort((a,b)=>(b.labelGeometry?.area||0)-(a.labelGeometry?.area||0))){
    if(isAntarctica(f))continue;const n=nameFor(f.properties?.NAME);
    // Keep the clean spelling intact; details retain the annotated display name.
    const name=cleanMapLabel(n.zh),point=f.labelGeometry?.anchors?.find(point=>clear(point,name))||f.labelGeometry?.anchors?.[0];
    if(!point||!name||seen.has(n.id))continue;seen.add(n.id);
    features.push({type:'Feature',geometry:{type:'Point',coordinates:point},properties:{clear:clear(point,name),name,polityId:n.id,NAME:f.properties.NAME,importance:n.importance||0,minZoom:state.selectedPolity===n.id?0:Math.min(n.importance>=8?1:8,(f.labelGeometry?.area||0)>.03?1:(f.labelGeometry?.area||0)>.002?2.5:(f.labelGeometry?.area||0)>.0001?4:5.5),priority:state.selectedPolity===n.id?-100:-(n.importance||0)}});
  }
  state.labelSnapshot=state.snapshot;
  const signature=`${state.snapshot?.year}|${JSON.stringify(features)}`;
  if(state.labelSignature!==signature){map.getSource('labels').setData({type:'FeatureCollection',features});map.getSource('visible-labels').setData({type:'FeatureCollection',features:features.filter(f=>f.properties.clear&&f.properties.minZoom<=map.getZoom())});state.labelSignature=signature;}
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

export function updateSelectionOutline(map,state){
 const names=Object.keys(state.catalog?.index||{}).filter(name=>state.catalog.index[name]===state.selectedPolity);
 for(const source of ['polities','disputed','fine-polities','fine-disputed'])if(map.getLayer(source+'-selection'))map.setFilter(source+'-selection',['in',['get','NAME'],['literal',names]]);
}
