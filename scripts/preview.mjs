import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('.');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{
  try {
    const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if (name.split('/').some(part=>part.startsWith('.')||['node_modules','supabase','tests','scripts'].includes(part))) throw new Error('forbidden');
    const file=path.resolve(root,'.'+name+(name.endsWith('/')?'index.html':''));
    if (!file.startsWith(root+path.sep)) throw new Error('forbidden');
    const body=await fs.readFile(file);
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(body);
  } catch {res.writeHead(404);res.end('Not found');}
}).listen(4186,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:4186/admin/index.html?preview=1'));
