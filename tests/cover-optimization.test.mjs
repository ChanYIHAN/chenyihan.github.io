import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as magick from '@imagemagick/magick-wasm';
import {sourceURL, fetchSource, boundedBytes, inspect, convert, MAX_BYTES, dimensions as imageSize} from '../supabase/functions/optimize-cover/core.mjs';

await magick.initializeImageMagick(await fs.readFile(new URL('../node_modules/@imagemagick/magick-wasm/dist/x86/magick.wasm',import.meta.url)));
test('only approved HTTPS sources and validated redirects', async () => {
  assert.equal(sourceURL('https://github.com/chanyihan/chenyihan.github.io/blob/main/portfolio_pages/page_48.png?raw=true').hostname,'raw.githubusercontent.com');
  for (const url of ['http://127.0.0.1/a','https://127.0.0.1/a','https://evil.test/a','https://www.ekhart.cn@evil.test/a','https://www.ekhart.cn:8443/a','https://raw.githubusercontent.com/other/repo/a']) assert.throws(()=>sourceURL(url));
  await assert.rejects(fetchSource('https://www.ekhart.cn/a', async()=>new Response(null,{status:302,headers:{location:'http://169.254.169.254/'}})));
});
test('byte and decoded-pixel limits', async () => {
  await assert.rejects(boundedBytes(new Response(new Uint8Array(MAX_BYTES+1))));
  assert.throws(()=>inspect(new Uint8Array(),imageSize));
  const bomb = new Uint8Array(24); bomb.set([137,80,78,71]); bomb.set([73,72,68,82],12);
  const view = new DataView(bomb.buffer); view.setUint32(16,9000); view.setUint32(20,9000);
  assert.throws(()=>inspect(bomb));
});
for (const page of [48,49,50]) {
  test(`planning cover ${page}: small/large WebP with correct aspect ratio`, async () => {
    const input = new Uint8Array(await fs.readFile(new URL(`../portfolio_pages/page_${page}.png`,import.meta.url)));
    const before = inspect(input,imageSize);
    const result = convert(input,magick);
    for (const [name,max] of [['thumbnail',800],['preview',1920]]) {
      const output = imageSize(result[name].bytes);
      assert.equal(output.type,'webp');
      assert.ok(Math.max(output.width,output.height)<=max);
      assert.ok(Math.abs(output.width/output.height - before.width/before.height)<0.01);
      assert.ok(result[name].bytes.length<input.length);
    }
    console.log(JSON.stringify({page,original:input.length,thumbnail:result.thumbnail.bytes.length,preview:result.preview.bytes.length}));
  });
}
