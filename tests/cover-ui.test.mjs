import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const uploadScript = await fs.readFile(new URL('../admin/cover-upload.js',import.meta.url),'utf8');
const loader = await fs.readFile(new URL('../portfolio-loader.js',import.meta.url),'utf8');
const assets = {version:'webp-v1',source:'https://www.ekhart.cn/a.png',thumbnail:{url:'https://assets.test/small.webp'},preview:{url:'https://assets.test/large.webp'}};
function adminContext(fetcher, file) {
  const context = vm.createContext({fetch:fetcher,AbortSignal,JSON,URL,SB_URL:'https://backend.test',SB_ANON:'public-key',adminAccessToken:'test-token',document:{getElementById:()=>({files:file?[file]:[]})}});
  vm.runInContext(uploadScript,context);
  return context;
}
test('unchanged optimized cover is not converted again', async()=>{
  const context = adminContext(()=>{throw new Error('must not request');});
  const result = await context.prepareCoverAssets(assets.source,{cover_assets:assets},()=>{});
  assert.equal(result.cover_assets,assets);
});
test('new URL is sent to backend and complete metadata returned', async()=>{
  const context = adminContext(async(url,options)=>{
    assert.equal(JSON.parse(options.body).url,assets.source);
    assert.ok(url.endsWith('/functions/v1/optimize-cover'));
    return new Response(JSON.stringify({cover_url:assets.source,cover_assets:assets}));
  });
  const result = await context.prepareCoverAssets(assets.source,null,()=>{});
  assert.equal(result.cover_assets.thumbnail.url,assets.thumbnail.url);
});
test('failed conversion rejects instead of returning a publishable payload', async()=>{
  const context = adminContext(async()=>new Response(JSON.stringify({error:'download failed'}),{status:400}));
  await assert.rejects(context.prepareCoverAssets(assets.source,null,()=>{}),/download failed/);
});
test('direct upload uses raw bytes without another download',async()=>{
  const file = new Blob(['image bytes']);
  const context = adminContext(async(url,options)=>{
    assert.equal(options.body,file);
    assert.equal(options.headers['Content-Type'],'application/octet-stream');
    return new Response(JSON.stringify({cover_url:assets.source,cover_assets:assets}));
  },file);
  await context.prepareCoverAssets('',null,()=>{});
});
test('list markup requests only thumbnail; stale metadata is ignored',()=>{
  const context = vm.createContext({coverCandidates:url=>[url],escHtml:s=>String(s).replaceAll('"','&quot;')});
  const helpers=loader.slice(loader.indexOf('  function optimizedAsset'),loader.indexOf('  function stabilizeCoverImages'));
  vm.runInContext(helpers,context);
  const markup = context.coverImageMarkup({cover_url:assets.source,cover_assets:assets});
  assert.ok(markup.includes('src="https://assets.test/small.webp"'));
  assert.ok(!markup.includes(assets.preview.url));
  assert.equal(context.optimizedAsset({cover_url:'new.png',cover_assets:assets},'preview'),null);
  assert.equal(context.optimizedAsset({cover_url:assets.source,cover_assets:assets},'preview'),assets.preview.url);
});
test('all inline JavaScript parses',async()=>{
  for (const path of ['../index.html','../admin/index.html']) {
    const html=await fs.readFile(new URL(path,import.meta.url),'utf8');
    for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) new vm.Script(match[1]);
  }
});
