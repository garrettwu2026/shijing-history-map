// Run an existing verifier unchanged except its hardcoded localhost port.
// Assertions, timeouts and validation thresholds are never rewritten.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const filename=path.resolve(process.argv[2]);if(!filename.startsWith(path.resolve('scripts')+path.sep))throw Error('Expected a project verifier');
const instance=new Module(filename,module);instance.filename=filename;instance.paths=Module._nodeModulePaths(path.dirname(filename));
const port=process.env.V20_PORT||'8025';instance._compile(fs.readFileSync(filename,'utf8').replaceAll('http://localhost:8000',`http://localhost:${port}`),filename);
