'use strict';
const requests = new Map();
function ringArea(ring) {
  let sum=0;
  for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length];let dx=(b[0]-a[0])*Math.PI/180;if(dx>Math.PI)dx-=2*Math.PI;if(dx< -Math.PI)dx+=2*Math.PI;sum+=dx*(2+Math.sin(a[1]*Math.PI/180)+Math.sin(b[1]*Math.PI/180));}
  return Math.abs(sum);
}
// Interior label candidates are computed once off the main thread.
function inside(point,ring){let yes=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>point[1])!==(b[1]>point[1])&&point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
function anchorsFor(parts){const anchors=[];for(const part of parts.slice(0,4)){const xs=part[0].map(p=>p[0]),ys=part[0].map(p=>p[1]);const left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);for(const fy of [.5,.35,.65,.2,.8])for(const fx of [.5,.35,.65,.2,.8]){const point=[left+(right-left)*fx,top+(bottom-top)*fy];if(inside(point,part[0])&&!part.slice(1).some(r=>inside(point,r)))anchors.push(point);}}return anchors;}
self.onmessage=async({data:{id,path,cancel}})=>{
  if(cancel){requests.get(id)?.abort();return;}
  const controller=new AbortController();requests.set(id,controller);
  const timer=setTimeout(()=>controller.abort(new DOMException('資料載入逾時','TimeoutError')),20000);
  try{
    const response=await fetch(path,{signal:controller.signal});
    if(!response.ok)throw Error(`${path} (${response.status})`);
    const data=await response.json();
    // Some snapshots merge all unnamed land into one MultiPolygon (1492).
    // Split its parts so the Antarctic continent can be classified separately.
    if(data.type==='FeatureCollection')data.features=data.features.flatMap(f=>
      !f.properties?.NAME?.trim() && f.geometry?.type==='MultiPolygon'
        ? f.geometry.coordinates.filter(p=>p[0]?.length).map(coordinates=>({...f,geometry:{type:'Polygon',coordinates}})) : [f]);
    if(data.type==='FeatureCollection')for(const f of data.features){
      if(!f.geometry?.coordinates)continue;
      const parts=f.geometry.type==='MultiPolygon'?f.geometry.coordinates:[f.geometry.coordinates];
      const bounds=[Infinity,Infinity,-Infinity,-Infinity];
      const visit=c=>{if(typeof c[0]==='number'){bounds[0]=Math.min(bounds[0],c[0]);bounds[1]=Math.min(bounds[1],c[1]);bounds[2]=Math.max(bounds[2],c[0]);bounds[3]=Math.max(bounds[3],c[1]);}else c.forEach(visit);};visit(f.geometry.coordinates);
      f.labelGeometry={bounds,area:parts.reduce((sum,p)=>sum+Math.max(0,ringArea(p[0])-p.slice(1).reduce((v,r)=>v+ringArea(r),0)),0),parts:parts.filter(p=>p[0]?.length).sort((a,b)=>ringArea(b[0])-ringArea(a[0]))};
    }
    if(data.type==='FeatureCollection')for(const f of data.features)if(f.labelGeometry)f.labelGeometry.anchors=anchorsFor(f.labelGeometry.parts);
    if(!controller.signal.aborted)self.postMessage({id,data});
    else self.postMessage({id,error:'Aborted',name:'AbortError'});
  }catch(error){const reason=controller.signal.aborted?controller.signal.reason:error;self.postMessage({id,error:reason.message,name:reason.name});}
  finally{clearTimeout(timer);requests.delete(id);}
};
