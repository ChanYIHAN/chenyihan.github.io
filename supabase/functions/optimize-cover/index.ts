import * as magick from 'npm:@imagemagick/magick-wasm@0.0.43';
import { VERSION, fetchSource, boundedBytes, inspect, convert } from './core.mjs';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
await magick.initializeImageMagick(await Deno.readFile(new URL('x86/magick.wasm',import.meta.resolve('npm:@imagemagick/magick-wasm@0.0.43'))));
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {status, headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response(null, {status:204, headers:cors});
  if (req.method !== 'POST') return json({error:'Method not allowed'},405);
  const base = Deno.env.get('SUPABASE_URL')!;
  const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}').default;
  const authorization = req.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return json({error:'请先登录管理员账号'},401);
  // Validate the token server-side, then use trusted app_metadata for authorization.
  const auth = await fetch(`${base}/auth/v1/user`, {headers:{apikey:secret, authorization}, signal:AbortSignal.timeout(10000)}).catch(()=>null);
  if (!auth?.ok) return json({error:'登录已过期，请重新登录'},401);
  const user = await auth.json();
  if (user.app_metadata?.role !== 'admin') return json({error:'仅管理员可优化封面'},403);

  try {
    let bytes: Uint8Array;
    let source = '';
    if (req.headers.get('content-type')?.includes('application/json')) {
      const body = await boundedBytes(req);
      if (body.length > 8192) throw new Error('链接参数过长');
      source = String(JSON.parse(new TextDecoder().decode(body)).url || '').trim();
      if (!source) throw new Error('请填写图片链接');
      bytes = await fetchSource(source);
    } else {
      // Raw bytes, not multipart: streaming limit applies before buffering.
      bytes = await boundedBytes(req);
    }
    const info = inspect(bytes);
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
    const hash = Array.from(digest, b=>b.toString(16).padStart(2,'0')).join('');
    const prefix = `${VERSION}/${hash}`;
    const publicBase = `${base}/storage/v1/object/public/portfolio-covers`;
    const manifestPath = `${prefix}/manifest.json`;
    const cached = await fetch(`${publicBase}/${manifestPath}`, {signal:AbortSignal.timeout(10000)});
    if (cached.ok) {
      const assets = await cached.json();
      return json({cover_url:source || assets.preview.url, cover_assets:{...assets,source:source || assets.preview.url}, reused:true});
    }
    await cached.body?.cancel();
    const variants = convert(bytes, magick);
    const originalPath = `${hash}/original.${info.type === 'jpg' ? 'jpg' : info.type}`;
    const put = async (bucket: string, path: string, data: Uint8Array, contentType: string) => {
      const response = await fetch(`${base}/storage/v1/object/${bucket}/${path}`, {
        method:'POST', headers:{apikey:secret,authorization:`Bearer ${secret}`,'Content-Type':contentType,'Cache-Control':'31536000','x-upsert':'true'},
        body:data, signal:AbortSignal.timeout(20000),
      });
      if (!response.ok) throw new Error('图片存储失败，请稍后重试');
      await response.body?.cancel();
    };
    const assets: Record<string,unknown> = {version:VERSION, original_path:originalPath, original_bytes:bytes.length};
    await put('portfolio-originals',originalPath,bytes,info.type === 'jpg' ? 'image/jpeg' : `image/${info.type}`);
    for (const name of ['preview','thumbnail']) {
      const variant = variants[name];
      const path = `${prefix}/${name}.webp`;
      await put('portfolio-covers',path,variant.bytes,'image/webp');
      assets[name] = {url:`${publicBase}/${path}`,width:variant.width,height:variant.height,bytes:variant.bytes.length};
    }
    // Written last: a manifest means all outputs were successfully persisted.
    await put('portfolio-covers',manifestPath,new TextEncoder().encode(JSON.stringify(assets)),'application/json');
    const outputSource = source || (assets.preview as {url:string}).url;
    return json({cover_url:outputSource,cover_assets:{...assets,source:outputSource},reused:false});
  } catch (error) {
    console.error('cover optimization failed', error instanceof Error ? error.name : 'unknown');
    return json({error:error instanceof Error ? error.message : '图片优化失败'},400);
  }
});
