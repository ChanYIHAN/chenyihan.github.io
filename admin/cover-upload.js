let coverObjectURL = null;
const coverStatusDefault = '保存时自动生成 WebP 小图和大图，保留原图。PNG/JPG/静态 WebP，≤5MB、≤800 万像素；其他域名请下载后上传。';

function clearCoverFile() {
  document.getElementById('fCoverFile').value = '';
  if (coverObjectURL) URL.revokeObjectURL(coverObjectURL);
  coverObjectURL = null;
}
function resetCoverUpload() {
  clearCoverFile();
  document.getElementById('coverOptimizeStatus').textContent = coverStatusDefault;
}
function previewCoverFile() {
  const file = document.getElementById('fCoverFile').files[0];
  if (!file) return;
  if (file.size > 5*1024*1024) { resetCoverUpload(); showToast('图片不能超过 5MB','error'); return; }
  if (coverObjectURL) URL.revokeObjectURL(coverObjectURL);
  coverObjectURL = URL.createObjectURL(file);
  const img = document.getElementById('coverPreviewImg');
  img.src = coverObjectURL;
  img.classList.add('show');
  document.getElementById('fCoverUrl').value = '';
  document.getElementById('coverOptimizeStatus').textContent = `已选择 ${file.name}，保存时生成大小 WebP 图片。`;
}

async function prepareCoverAssets(source, existing, progress) {
  const file = document.getElementById('fCoverFile').files[0];
  if (!file && !source) return {cover_url:null,cover_assets:null};
  const assets = existing?.cover_assets;
  if (!file && assets?.version === 'webp-v1' && assets.source === source && assets.thumbnail?.url && assets.preview?.url) {
    return {cover_url:source,cover_assets:assets};
  }
  progress('下载/上传并优化封面中，请稍候...');
  const response = await fetch(`${SB_URL}/functions/v1/optimize-cover`, {
    method:'POST',
    headers:{apikey:SB_ANON,Authorization:`Bearer ${adminAccessToken}`,'Content-Type':file ? 'application/octet-stream' : 'application/json'},
    body:file || JSON.stringify({url:source}),
    signal:AbortSignal.timeout(90000),
  });
  const result = await response.json().catch(()=>({}));
  if (!response.ok) throw new Error(result.error || result.message || '封面优化失败，原作品未更改');
  if (!result.cover_assets?.thumbnail?.url || !result.cover_assets?.preview?.url) throw new Error('图片尚未生成完整，请重试');
  progress(result.reused ? '已复用优化图片，正在保存...' : '大小 WebP 已生成，正在保存...');
  return {cover_url:result.cover_url,cover_assets:result.cover_assets};
}
