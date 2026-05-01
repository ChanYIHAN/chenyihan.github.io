/**
 * portfolio-loader.js
 * 从 Supabase 动态加载作品集数据，无缝补充/替换页面中的静态内容。
 *
 * 策略：
 *   - 如果 Supabase 有数据 → 删除静态 .portfolio-section，用动态数据渲染
 *   - 如果 Supabase 为空或请求失败 → 保留页面原有的静态内容（降级）
 */

const PORTFOLIO_CONFIG = {
  supabaseUrl:  'https://zgyhnlsfyytjunktsefz.supabase.co',
  supabaseAnon: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpneWhubHNmeXl0anVua3RzZWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MjAxMDcsImV4cCI6MjA5MzE5NjEwN30.pI6mtuWh9AY_sHQB836urNxc8oLVi1ZE2hQ2LYrmfMM',
};

(async function initPortfolio() {
  const { supabaseUrl, supabaseAnon } = PORTFOLIO_CONFIG;

  /* ── helpers ── */
  function escHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  async function fetchItems(section) {
    const url = `${supabaseUrl}/rest/v1/portfolio_items?section=eq.${section}&is_visible=eq.true&order=sort_order,created_at`;
    const res = await fetch(url, {
      headers: { apikey: supabaseAnon, Authorization: `Bearer ${supabaseAnon}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  function renderTags(tags, tagColors) {
    return (tags || []).map((t, i) => {
      const c = (tagColors || [])[i] || 'tag-blue';
      return `<span class="tag ${c}">${escHtml(t)}</span>`;
    }).join('');
  }

  function renderCard(item, type) {
    const btn = type === 'video' ? '▶ 观看视频' : '↗ 阅读原文';
    const cover = item.cover_url
      ? `<img src="${escHtml(item.cover_url)}" alt="${escHtml(item.title)}" loading="lazy">`
      : `<div style="width:100%;height:100%;background:#1a1d27;display:flex;align-items:center;justify-content:center;color:#4a4d61;font-size:32px">🖼️</div>`;
    return `<a class="work-card" href="${item.link ? escHtml(item.link) : '#'}" target="${item.link ? '_blank' : '_self'}"><div class="card-cover">${cover}<div class="card-cover-overlay"><span class="open-btn">${btn}</span></div></div><div class="card-body"><div class="card-tags">${renderTags(item.tags, item.tag_colors)}</div><div class="card-title">${escHtml(item.title)}</div></div></a>`;
  }

  function groupByCategory(items) {
    const g = new Map();
    items.forEach(item => {
      const k = item.category || '其他';
      if (!g.has(k)) g.set(k, { icon: item.category_icon || '', items: [] });
      g.get(k).items.push(item);
    });
    return g;
  }

  /* ── 渲染单个版块 ── */
  async function renderSection(sectionId, sectionType) {
    const container = document.getElementById(sectionId);
    if (!container) return;

    try {
      const items = await fetchItems(sectionType);

      // Supabase 没有数据 → 保留原有静态内容，什么都不做
      if (!items || items.length === 0) {
        console.log(`[portfolio-loader] ${sectionId}: 无动态数据，保留静态内容`);
        return;
      }

      // 有数据 → 先移除静态的 .portfolio-section
      container.querySelectorAll('.portfolio-section').forEach(el => el.remove());

      const groups = groupByCategory(items);
      const unit = sectionType === 'video' ? '个' : '篇';

      groups.forEach(({ icon, items: gItems }, name) => {
        const sec = document.createElement('div');
        sec.className = 'portfolio-section';
        sec.innerHTML = `
          <div class="portfolio-section-header">
            <span>${icon}</span>
            <span class="portfolio-section-title">${escHtml(name)}</span>
            <span class="portfolio-section-count">${gItems.length} ${unit}</span>
          </div>
          <div class="card-grid">
            ${gItems.map(item => renderCard(item, sectionType)).join('')}
          </div>`;
        container.appendChild(sec);
      });

      console.log(`[portfolio-loader] ${sectionId}: 已加载 ${items.length} 条动态数据`);
    } catch (err) {
      // 网络错误或 API 异常 → 保留静态内容
      console.warn(`[portfolio-loader] ${sectionId} 加载异常，保留静态内容:`, err);
    }
  }

  // 并行加载图文和视频版块
  await Promise.allSettled([
    renderSection('graphic', 'graphic'),
    renderSection('video',   'video'),
  ]);
})();
