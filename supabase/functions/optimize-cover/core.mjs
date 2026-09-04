export const MAX_BYTES = 5 * 1024 * 1024;
export const VERSION = 'webp-v1';

// Never fetch arbitrary URLs with privileged backend credentials.
export function sourceURL(input) {
  const url = new URL(input, 'https://www.ekhart.cn/');
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) {
    throw new Error('请使用 HTTPS 图片链接，或直接上传图片文件');
  }
  if (url.hostname === 'github.com') {
    const match = url.pathname.match(/^\/chanyihan\/chenyihan\.github\.io\/blob\/(.+)$/i);
    if (!match) throw new Error('仅支持本站仓库的 GitHub 图片，请直接上传文件');
    return sourceURL('https://raw.githubusercontent.com/chanyihan/chenyihan.github.io/' + match[1]);
  }
  const siteHosts = ['www.ekhart.cn', 'ekhart.cn', 'chenyihan-github-io.pages.dev'];
  const ownRaw = url.hostname === 'raw.githubusercontent.com' && /^\/chanyihan\/chenyihan\.github\.io\//i.test(url.pathname);
  if (!siteHosts.includes(url.hostname) && !ownRaw) {
    throw new Error('暂不支持这个图片域名，请下载图片后使用“上传图片文件”');
  }
  url.hash = '';
  return url;
}

export async function boundedBytes(response) {
  if (Number(response.headers.get('content-length')) > MAX_BYTES) throw new Error('图片不能超过 5MB');
  if (!response.body) throw new Error('图片内容为空');
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) throw new Error('图片不能超过 5MB');
      chunks.push(value);
    }
  } finally { await reader.cancel(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}

export async function fetchSource(input, fetcher = fetch) {
  let url = sourceURL(input);
  const signal = AbortSignal.timeout(20000);
  for (let hop = 0; hop < 4; hop++) {
    const response = await fetcher(url, {redirect: 'manual', signal});
    if ([301,302,303,307,308].includes(response.status)) {
      const location = response.headers.get('location');
      await response.body?.cancel();
      if (!location) throw new Error('图片跳转地址无效');
      url = sourceURL(new URL(location, url).href);
      continue;
    }
    if (!response.ok) { await response.body?.cancel(); throw new Error(`图片下载失败 (${response.status})，请改为上传文件`); }
    return boundedBytes(response);
  }
  throw new Error('图片重定向过多，请直接上传文件');
}

export function dimensions(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ascii = (start, length) => String.fromCharCode(...bytes.subarray(start,start+length));
  if (bytes.length >= 24 && ascii(1,3) === 'PNG' && bytes[0] === 137 && ascii(12,4) === 'IHDR') {
    return {type:'png',width:view.getUint32(16),height:view.getUint32(20)};
  }
  if (bytes.length >= 30 && ascii(0,4) === 'RIFF' && ascii(8,4) === 'WEBP') {
    const kind = ascii(12,4);
    if (kind === 'VP8X') {
      if (bytes[20] & 2) throw new Error('请使用静态图片，暂不支持动画');
      const uint24 = offset => bytes[offset] + bytes[offset+1]*256 + bytes[offset+2]*65536;
      return {type:'webp',width:uint24(24)+1,height:uint24(27)+1};
    }
    if (kind === 'VP8 ' && ascii(23,3) === '\x9d\x01\x2a') return {type:'webp',width:view.getUint16(26,true)&16383,height:view.getUint16(28,true)&16383};
    if (kind === 'VP8L' && bytes[20] === 47) {
      const bits = view.getUint32(21,true);
      return {type:'webp',width:(bits&16383)+1,height:((bits>>>14)&16383)+1};
    }
  }
  if (bytes[0] === 255 && bytes[1] === 216) {
    let offset = 2;
    while (offset+4 <= bytes.length) {
      if (bytes[offset++] !== 255) break;
      while (bytes[offset] === 255) offset++;
      const marker = bytes[offset++];
      if (marker === 217 || marker === 218) break;
      if (marker === 1 || (marker >= 208 && marker <= 215)) continue;
      if (offset+2>bytes.length) break;
      const length = view.getUint16(offset);
      if (length<2 || offset+length>bytes.length) break;
      if ([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker) && length>=7) {
        return {type:'jpg',width:view.getUint16(offset+5),height:view.getUint16(offset+3)};
      }
      offset += length;
    }
  }
  throw new Error('无法识别图片，请使用 PNG、JPG 或静态 WebP');
}

export function inspect(bytes) {
  if (!bytes.length || bytes.length > MAX_BYTES) throw new Error('请选择不超过 5MB 的图片');
  const info = dimensions(bytes);
  if (!['png','jpg','webp'].includes(info.type)) throw new Error('仅支持 PNG、JPG、WebP 静态图片');
  if (!info.width || !info.height || info.width * info.height > 8000000) throw new Error('图片请控制在 800 万像素以内');
  return info;
}

export function convert(bytes, magick) {
  const {ImageMagick, MagickFormat} = magick;
  return ImageMagick.read(bytes, img => {
    img.autoOrient();
    img.strip();
    const variants = {};
    // Resize the decoded image progressively, preserving its aspect ratio.
    for (const [name, max, quality] of [['preview',1920,86], ['thumbnail',800,80]]) {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      if (scale < 1) img.resize(Math.max(1,Math.round(img.width*scale)), Math.max(1,Math.round(img.height*scale)));
      img.quality = quality;
      variants[name] = {width:img.width, height:img.height, bytes:img.write(MagickFormat.WebP, data=>new Uint8Array(data))};
    }
    return variants;
  });
}
