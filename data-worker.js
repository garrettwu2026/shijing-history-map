'use strict';
const requests = new Map();
function ringArea(ring) {
  let sum=0;
  for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length];let dx=(b[0]-a[0])*Math.PI/180;if(dx>Math.PI)dx-=2*Math.PI;if(dx< -Math.PI)dx+=2*Math.PI;sum+=dx*(2+Math.sin(a[1]*Math.PI/180)+Math.sin(b[1]*Math.PI/180));}
  return Math.abs(sum);
}
// Interior label candidates are computed once off the main thread.
function inside(point,ring){let yes=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>point[1])!==(b[1]>point[1])&&point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
function scanlineAnchor(part){
  const ys=[...new Set(part.flatMap(r=>r.map(p=>p[1])))].sort((a,b)=>a-b);
  for(let i=1;i<ys.length;i++){
    const y=(ys[i-1]+ys[i])/2,xs=[];
    for(const ring of part)for(let a=0,b=ring.length-1;a<ring.length;b=a++){
      const p=ring[a],q=ring[b];if((p[1]>y)!==(q[1]>y))xs.push(p[0]+(y-p[1])*(q[0]-p[0])/(q[1]-p[1]));
    }
    xs.sort((a,b)=>a-b);
    for(let j=1;j<xs.length;j+=2){const point=[(xs[j-1]+xs[j])/2,y];if(xs[j]>xs[j-1]&&inside(point,part[0])&&!part.slice(1).some(r=>inside(point,r)))return point;}
  }
}
function anchorsFor(parts){const anchors=[];for(const part of parts.slice(0,4)){const xs=part[0].map(p=>p[0]),ys=part[0].map(p=>p[1]);const left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);for(const fy of [.5,.35,.65,.2,.8])for(const fx of [.5,.35,.65,.2,.8]){const point=[left+(right-left)*fx,top+(bottom-top)*fy];if(inside(point,part[0])&&!part.slice(1).some(r=>inside(point,r)))return [point];}if(!anchors.length){const point=scanlineAnchor(part);if(point)return [point];}}return anchors;}
function geometrySignature(data){
  let count=0,sum=0;
  const visit=c=>{if(typeof c==='number'){count++;sum+=c*count;}else if(Array.isArray(c))for(const v of c)visit(v);};
  for(const f of data.features)visit(f.geometry?.coordinates);
  return `${count}:${sum}`;
}
function prepareGeometry(data){
    // Some snapshots merge all unnamed land into one MultiPolygon (1492).
    // Split its parts so the Antarctic continent can be classified separately.
    if(data.type==='FeatureCollection')data.features=data.features.flatMap(f=>
      !f.properties?.NAME?.trim() && f.geometry?.type==='MultiPolygon'
        ? f.geometry.coordinates.filter(p=>p[0]?.length).map(coordinates=>({...f,geometry:{type:'Polygon',coordinates}})) : [f]);
    if(data.type==='FeatureCollection')for(const f of data.features){
      if(!f.geometry?.coordinates)continue;
      const parts=f.geometry.type==='MultiPolygon'?f.geometry.coordinates:[f.geometry.coordinates];
      // Unwrap short edges at the dateline before tiling and anchor calculation.
      // World-spanning polar rings retain their explicit full-width geometry.
      for(const part of parts){
        if(!part[0]?.length||part[0].some(p=>p[1]<-85))continue;
        for(const ring of part){for(let i=1;i<ring.length;i++){while(ring[i][0]-ring[i-1][0]>180)ring[i][0]-=360;while(ring[i][0]-ring[i-1][0]<-180)ring[i][0]+=360;}}
        const ref=part[0][0][0];for(const hole of part.slice(1)){const shift=Math.round((ref-hole[0][0])/360)*360;for(const point of hole)point[0]+=shift;}
      }

      const bounds=[Infinity,Infinity,-Infinity,-Infinity];
      const visit=c=>{if(typeof c[0]==='number'){bounds[0]=Math.min(bounds[0],c[0]);bounds[1]=Math.min(bounds[1],c[1]);bounds[2]=Math.max(bounds[2],c[0]);bounds[3]=Math.max(bounds[3],c[1]);}else c.forEach(visit);};visit(f.geometry.coordinates);
      f.labelGeometry={bounds,area:parts.reduce((sum,p)=>sum+Math.max(0,ringArea(p[0])-p.slice(1).reduce((v,r)=>v+ringArea(r),0)),0),parts:parts.filter(p=>p[0]?.length).sort((a,b)=>ringArea(b[0])-ringArea(a[0]))};
    }
    if(data.type==='FeatureCollection')for(const f of data.features)if(f.labelGeometry){f.labelGeometry.anchors=anchorsFor(f.labelGeometry.parts);delete f.labelGeometry.parts;}
    data.labelGeometryPrepared=geometrySignature(data);
    return data;
}
self.onmessage=async({data:{id,path,cancel}})=>{
  if(cancel){requests.get(id)?.abort();return;}
  const controller=new AbortController();requests.set(id,controller);
  const timer=setTimeout(()=>controller.abort(new DOMException('資料載入逾時','TimeoutError')),20000);
  try{
    const response=await fetch(path,{signal:controller.signal});
    if(!response.ok)throw Error(`${path} (${response.status})`);
    const data=await response.json();
    if(data.type==='FeatureCollection'&&data.labelGeometryPrepared!==geometrySignature(data))prepareGeometry(data);
    if(!controller.signal.aborted){
      if(data.type==='FeatureCollection'){const bytes=new TextEncoder().encode(JSON.stringify(data));self.postMessage({id,bytes:bytes.buffer},[bytes.buffer]);}
      else self.postMessage({id,data});
    }
    else self.postMessage({id,error:'Aborted',name:'AbortError'});
  }catch(error){const reason=controller.signal.aborted?controller.signal.reason:error;self.postMessage({id,error:reason.message,name:reason.name});}
  finally{clearTimeout(timer);requests.delete(id);}
};
