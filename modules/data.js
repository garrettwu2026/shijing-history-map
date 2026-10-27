export function createDataClient() {
  let worker;
  const pending = new Map(); let workerID=0;
  function start(){worker = new Worker('data-worker.js');
  worker.onmessage=({data:{id,data,error,name}})=>{const task=pending.get(id);if(!task)return;pending.delete(id);task.cleanup();error?task.reject(Object.assign(new Error(error),{name})):task.resolve(data);};
  worker.onerror=()=>{for(const task of pending.values()){task.cleanup();task.reject(new Error('資料 Worker 無法執行'));}pending.clear();worker.terminate();start();};
  }
  start();
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

return {json};
}
