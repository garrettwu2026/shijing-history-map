// Reuse the worker's geometry preparation without changing source data.
const fs=require('node:fs'),vm=require('node:vm');
const context={self:{},Map,AbortController,setTimeout,clearTimeout};
vm.createContext(context);vm.runInContext(fs.readFileSync('data-worker.js','utf8'),context);
const prepared={};
for(const {file} of JSON.parse(fs.readFileSync('data/snapshots.json','utf8'))){
 if(prepared[file])continue;
 prepared[file]=context.prepareGeometry(JSON.parse(fs.readFileSync('data/'+file,'utf8')));
}
process.stdout.write(JSON.stringify(prepared));
