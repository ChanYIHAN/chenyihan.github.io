/**
 * portfolio-loader.js
 * 将此脚本引入 index.html，实现从 Supabase 动态加载作品集数据
 * 注意：请将下方的配置替换为你的 Supabase 项目信息
 */

// ============================================================
// 配置区 - 请修改为你自己的 Supabase 信息
// ============================================================
const PORTFOLIO_CONFIG = {
  supabaseUrl:    'https://zgyhnlsfyytjunktsefz.supabase.co',
  supabaseAnon:   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpneWhubHNmeXl0anVua3RzZWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MjAxMDcsImV4cCI6MjA5MzE5NjEwN30.pI6mtuWh9AY_sHQB836urNxc8oLVi1ZE2hQ2LYrmfMM',
};

// ============================================================
// 从 Supabase 加载作品集数据并渲染到页面
// ============================================================
(async function initPortfolio() {
  const { supabaseUrl, supabaseAnon } = PORTFOLIO_CONFIG;

  // 从 Supabase 获取数据
  async function fetchItems(section) {
    const url = `${supabaseUrl}/rest/v1/portfolio_items?section=eq.${section}&is_visible=eq.true&order=sort_order,created_at`;
    const res = await fetch(url, {
      headers: {
        'apikey': supabaseAnon,
        'Authorization': `Bearer ${supabaseAnon}`
      }
    });
    if (!res.ok) throw new Error(`Fetch error: ${res.status}`);
    return res.json();
  }

  // 生成标签 HTML
  function renderTags(tags, tagColors) {
    return (tags || []).map((tag, i) => {
      const color = (tagColors || [])[i] || 'tag-blue';
      return `<span class="tag ${color}">${escHtml(tag)}</span>`;
    }).join('');
  }

  // 生成单张作品卡片
  function renderCard(item, sectionType) {
    const openBtnText = sectionType === 'video' ? '▶ 观看视频' : '↗ 阅读原文';
    const coverHtml = item.cover_url
      ? `<img src="${escHtml(item.cover_url)}" alt="${escHtml(item.title)}" loading="lazy">`
      : `<div style="width:100%;height:100%;background:#1a1d27;display:flex;align-items:center;justify-content:center;color:#4a4d61;font-size:32px">🖼️</div>`;

    return `
      <a class="work-card" href="${item.link ? escHtml(item.link) : '#'}" target="${item.link ? '_blank' : '_self'}">
        <div class="card-cover">
          ${coverHtml}
          <div class="card-cover-overlay">
            <span class="open-btn">${openBtnText}</span>
          </div>
        </div>
        <div class="card-body">
          <div class="card-tags">${renderTags(item.tags, item.tag_colors)}</div>
          <div class="card-title">${escHtml(item.title)}</div>
        </div>
      </a>
    `;
  }

  // 按分类分组
  function groupByCategory(items) {
    const groups = new Map();
    items.forEach(item => {
      const key = item.category || '其他';
      if (!groups.has(key)) {
        groups.set(key, { icon: item.category_icon || '', items: [] });
      }
      groups.get(key).items.push(item);
    });
    return groups;
  }

  // 渲染一个版块
  async function renderSection(sectionId, sectionType) {
    const container = document.getElementById(sectionId);
    if (!container) return;

    // 找到 section-header 之后的区域，清空并重新渲染
    // 保留 section-header，清除其后的 portfolio-section 元素
    const existingSections = container.querySelectorAll('.portfolio-section');
    existingSections.forEach(el => el.remove());

    try {
      const items = await fetchItems(sectionType);

      if (items.length === 0) {
        const empty = document.createElement('div');
        empty.style.cssText = 'text-align:center;padding:48px;color:#8b8fa8;font-size:14px';
        empty.textContent = '暂无内容';
        container.appendChild(empty);
        return;
      }

      const groups = groupByCategory(items);

      groups.forEach((groupData, categoryName) => {
        const section = document.createElement('div');
        section.className = 'portfolio-section';

        const count = groupData.items.length;
        const unit  = sectionType === 'video' ? '个' : '篇';

        section.innerHTML = `
          <div class="portfolio-section-header">
            <span>${groupData.icon}</span>
            <span class="portfolio-section-title">${escHtml(categoryName)}</span>
            <span class="portfolio-section-count">${count} ${unit}</span>
          </div>
          <div class="card-grid">
            ${groupData.items.map(item => renderCard(item, sectionType)).join('')}
          </div>
        `;

        container.appendChild(section);
      });

    } catch (err) {
      console.error(`加载 ${sectionId} 失败：`, err);
      const errEl = document.createElement('div');
      errEl.style.cssText = 'text-align:center;padding:32px;color:#f87171;font-size:13px';
      errEl.textContent = '内容加载失败，请刷新重试';
      container.appendChild(errEl);
    }
  }

  function escHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // 渲染所有动态版块
  await Promise.allSettled([
    renderSection('graphic', 'graphic'),
    renderSection('video',   'video'),
  ]);

  // IP 案例和策划方案单独渲染（结构不同，可按需扩展）
  // 如果需要也动态化，取消下方注释
  // await renderSection('ip', 'ip');
  // await renderSection('planning', 'planning');

})();
