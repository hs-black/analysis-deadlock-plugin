const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const routes={'/':'preview/index.html','/preview.js':'preview/preview.js','/data.js':'src/data.js','/engine.js':'src/engine.js','/statistics.js':'src/statistics.js','/stats-data.js':'src/stats-data.js'};
const server=http.createServer((req,res)=>{let file=routes[req.url.split('?')[0]];if(!file){res.writeHead(404);res.end('Not found');return;}
res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':'text/javascript; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(fs.readFileSync(path.join(root,file)));});
server.listen(4173,'127.0.0.1',()=>console.log('Development preview: http://127.0.0.1:4173 (simulated roster, not connected to Deadlock)'));
