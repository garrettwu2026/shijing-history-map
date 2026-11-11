// Same historical identities and feature IDs; only the display geometry changes.
// No detail manifest or payload is fetched below this fixed zoom threshold.
export const DETAIL_ZOOM=4.5;
export function createDetailController({map,state,json,render}){
  let manifest,land,coastBaseline,abort,generation=0,applied='',cache=new Map(),timer;
  window.historyDetailMetrics={threshold:DETAIL_ZOOM,requests:[],applied:[]};
  const metrics=window.historyDetailMetrics;
  async function update(){
    const token=++generation;abort?.abort();window.historyDetailPending=false;
    if(!state.layer||state.boundariesPending)return;
    if(map.isMoving()||state.dragging){timer=setTimeout(update,500);return;}
    if(!map.decorationsReady){const remaining=1000-(performance.now()-(state.visualReadyAt||performance.now()));if(remaining>0){timer=setTimeout(update,remaining);return;}map.decorationsReady=true;}
    map.setMotionQuality(false);
    if(state.playing){timer=setTimeout(update,500);return;}
    if(map.getZoom()<DETAIL_ZOOM){map.displayDetail(false);if(state.baseline&&coastBaseline!==state.baseline){map.getSource('coast').setData(state.baseline.coastGeometry||state.baseline);coastBaseline=state.baseline;}return;}
    const year=state.snapshot.year,key=String(year);if(applied===key){await enableDetail();return;}
    const controller=new AbortController();abort=controller;window.historyDetailPending=true;
    const start=performance.now();
    try{
      manifest ||= await json('data/detail/manifest.json',controller.signal);
      if(token!==generation)return;
      const row=manifest.snapshots[key];if(!row)return;
      const load=async file=>{metrics.requests.push({file,zoom:map.getZoom(),year,at:performance.now()});return json('data/detail/'+file,controller.signal);};
      const [fine,base]=await Promise.all([cache.get(key)||load(row),land||load(manifest.land)]);
      if(token!==generation||state.snapshot.year!==year||map.getZoom()<DETAIL_ZOOM)return;
      land=base;cache.set(key,fine);while(cache.size>2)cache.delete(cache.keys().next().value);
      const coarse=state.layer;
      const byIndex=new Map(fine.features.map(f=>[f.properties.index,f.geometry]));
      const features=coarse.features.map(f=>({...f,geometry:f.properties.NAME?.trim()?(byIndex.get(f.properties.detailIndex) || f.geometry):f.geometry}));
      // Keep coarse sources visible while independent fine sources are prepared.
      map.initializeDetail();render({...coarse,features});map.getSource('fine-land').setData(land);applied=key;await enableDetail();
      if(token===generation)metrics.applied.push({year,zoom:map.getZoom(),ms:performance.now()-start});
    }catch(error){if(error.name!=='AbortError')metrics.error=String(error);}
    finally{if(token===generation)window.historyDetailPending=false;}
  }
  async function enableDetail(){
    if(map.isMoving()||map.getZoom()<DETAIL_ZOOM)return;
    const current=applied,token=generation;map.prepareDetail();
    await new Promise(resolve=>{
      const done=()=>{map.off('sourcedata',check);map.off('detailcancel',check);resolve();};
      const check=()=>{if(token!==generation||!map.fineInitialized){done();return;}if(['fine-land','fine-polities','fine-disputed'].every(id=>map.getSource(id)&&map.isSourceLoaded(id)))done();};
      map.on('sourcedata',check);map.on('detailcancel',check);check();
    });
    if(token===generation&&!map.isMoving()&&map.getZoom()>=DETAIL_ZOOM&&applied===current)map.displayDetail(true);
  }
  function refresh(){clearTimeout(timer);timer=setTimeout(update,500);}
  function suspend(){clearTimeout(timer);++generation;map.fire('detailcancel');abort?.abort();window.historyDetailPending=false;map.displayDetail(false);map.removeFineLayers();applied='';}
  map.on('movestart',()=>{if(map.resizingQuality)return;map.setMotionQuality(true);suspend();});
  map.on('moveend',()=>{if(map.resizingQuality)return;refresh();});
  return {refresh,suspend,snapshotChanged(){suspend();refresh();}};
}
