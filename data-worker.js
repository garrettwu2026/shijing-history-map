'use strict';
const requests = new Map();
function ringArea(ring) {
  let sum=0;
  for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length];let dx=(b[0]-a[0])*Math.PI/180;if(dx>Math.PI)dx-=2*Math.PI;if(dx< -Math.PI)dx+=2*Math.PI;sum+=dx*(2+Math.sin(a[1]*Math.PI/180)+Math.sin(b[1]*Math.PI/180));}
  return Math.abs(sum);
}
self.onmessage=async({data:{id,path,cancel}})=>{
  if(cancel){requests.get(id)?.abort();return;}
  const controller=new AbortController();requests.set(id,controller);
  const timer=setTimeout(()=>controller.abort(new DOMException('資料載入逾時','TimeoutError')),20000);
  try{
    const response=await fetch(path,{signal:controller.signal});
    if(!response.ok)throw Error(`${path} (${response.status})`);
    const data=await response.json();
    if(data.type==='FeatureCollection')for(const f of data.features){
      if(!f.geometry?.coordinates)continue;
      const parts=f.geometry.type==='MultiPolygon'?f.geometry.coordinates:[f.geometry.coordinates];
      const bounds=[Infinity,Infinity,-Infinity,-Infinity];
      const visit=c=>{if(typeof c[0]==='number'){bounds[0]=Math.min(bounds[0],c[0]);bounds[1]=Math.min(bounds[1],c[1]);bounds[2]=Math.max(bounds[2],c[0]);bounds[3]=Math.max(bounds[3],c[1]);}else c.forEach(visit);};visit(f.geometry.coordinates);
      f.labelGeometry={bounds,area:parts.reduce((sum,p)=>sum+Math.max(0,ringArea(p[0])-p.slice(1).reduce((v,r)=>v+ringArea(r),0)),0),parts:parts.filter(p=>p[0]?.length).sort((a,b)=>ringArea(b[0])-ringArea(a[0]))};
    }
    if(!controller.signal.aborted)self.postMessage({id,data});
    else self.postMessage({id,error:'Aborted',name:'AbortError'});
  }catch(error){const reason=controller.signal.aborted?controller.signal.reason:error;self.postMessage({id,error:reason.message,name:reason.name});}
  finally{clearTimeout(timer);requests.delete(id);}
};
