(function initSiteContent() {
  const params = new URLSearchParams(location.search);
  const isLocalPreview = ['localhost', '127.0.0.1', '::1'].includes(location.hostname)
    && params.get('content-preview') === '1';
  const storageKey = window.PORTFOLIO_CONTENT_STORAGE_KEY;
  const defaults = window.PORTFOLIO_CONTENT_DEFAULTS;
  const supabase = window.PORTFOLIO_SUPABASE_CONFIG;
  const records = window.PORTFOLIO_CONTENT_RECORDS;

  const escapeHtml = value => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const safeUrl = value => {
    try {
      const url = new URL(String(value || ''), location.href);
      return ['http:', 'https:'].includes(url.protocol) ? escapeHtml(url.href) : '#';
    } catch {
      return '#';
    }
  };

  const setText = (selector, value) => {
    const element = document.querySelector(selector);
    if (element) element.textContent = value || '';
  };

  function renderInfoRows(items) {
    return (items || []).map(item => {
      const label = String(item.label || '');
      const value = String(item.value || '');
      const copyKind = /邮箱|邮件|email/i.test(label)
        ? '邮箱'
        : (/电话|手机|联系电话/.test(label) ? '联系电话' : '');

      if (copyKind) {
        return `
          <div class="info-row copy-row">
            <span class="lbl">${escapeHtml(label)}</span>
            <button type="button" class="copy-value-button" data-copy-value="${escapeHtml(value)}" data-copy-kind="${copyKind}" aria-label="复制${copyKind} ${escapeHtml(value)}">
              <span>${escapeHtml(value)}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>
            </button>
          </div>
        `;
      }

      return `
        <div class="info-row">
          <span class="lbl">${escapeHtml(label)}</span>
          <span class="val">${escapeHtml(value)}</span>
        </div>
      `;
    }).join('');
  }

  function renderExperience(experience, index) {
    const isPurple = experience.accent === 'purple' || index % 2 === 1;
    const accent = isPurple ? 'var(--purple)' : 'var(--green)';
    const periodStyle = isPurple
      ? 'color:var(--purple);background:rgba(167,139,250,0.1);border-color:rgba(167,139,250,0.2)'
      : '';
    const groups = (experience.groups || []).map(group => `
      ${group.title ? `<div class="tl-sub">${escapeHtml(group.title)}</div>` : ''}
      <ul class="tl-points">
        ${(group.bullets || []).map(bullet => `<li>${escapeHtml(bullet)}</li>`).join('')}
      </ul>
    `).join('');

    return `
      <div class="tl-item">
        <div class="tl-dot" style="background:${accent}"></div>
        <div class="tl-period" style="${periodStyle}">${escapeHtml(experience.period)}</div>
        <div class="tl-company">
          ${escapeHtml(experience.company)}
          ${experience.companyNote ? `<span style="font-size:12px;font-weight:400;color:var(--text2)">（${escapeHtml(experience.companyNote)}）</span>` : ''}
        </div>
        <div class="tl-role" style="color:${accent}">${escapeHtml(experience.role)}</div>
        <div class="tl-body">${groups}</div>
      </div>
    `;
  }

  function renderIpCases(cases) {
    return (cases || []).map(item => {
      const links = (item.links || []).map(link => `
        <a class="ip-link" href="${safeUrl(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)}</a>
      `).join('');
      const articles = (item.articles || []).map(article => `
        <li>
          <a class="article-link" href="${safeUrl(article.url)}" target="_blank" rel="noopener noreferrer">
            <span class="al-icon">${escapeHtml(article.icon || '📄')}</span>
            <span class="al-title">${escapeHtml(article.title)}</span>
            <span class="al-arrow">→</span>
          </a>
        </li>
      `).join('');

      return `
        <div class="ip-grid" style="margin-bottom:16px">
          <div class="ip-card" style="grid-column:1/-1">
            <div class="ip-name">${escapeHtml(item.name)}</div>
            <div class="ip-desc">
              ${escapeHtml(item.description)}
              ${item.metrics ? `<br><span style="color:var(--text2);font-size:12px">${escapeHtml(item.metrics)}</span>` : ''}
            </div>
            ${links ? `<div class="ip-links">${links}</div>` : ''}
          </div>
        </div>
        ${articles ? `
          <div class="info-card" style="margin-bottom:16px">
            <div class="info-card-title">${escapeHtml(item.name)} · 代表文章</div>
            <ul class="article-list">${articles}</ul>
          </div>
        ` : ''}
      `;
    }).join('');
  }

  function applyContent(content) {
    const resume = content.resume || defaults.resume;
    const hero = resume.hero || {};

    setText('[data-content="hero.name"]', hero.name);
    setText('[data-content="hero.role"]', hero.role);
    setText('[data-content="hero.location"]', hero.location);
    setText('[data-content="hero.company"]', hero.company);
    setText('[data-content="hero.education"]', hero.education);
    setText('[data-content="hero.readerSubtitle"]', hero.readerSubtitle);

    const readerMain = document.getElementById('readerMain');
    if (readerMain) readerMain.dataset.target = String(Number(hero.readerReach) || 1500);

    const stats = document.getElementById('heroStats');
    if (stats) {
      stats.innerHTML = (resume.stats || []).map(stat => `
        <div class="stat-item">
          <div class="stat-num"${stat.accent ? ' style="color:var(--green)"' : ''}>
            ${escapeHtml(stat.value)}<span style="font-size:18px;color:var(--text2)">${escapeHtml(stat.suffix)}</span>
          </div>
          <div class="stat-label">${escapeHtml(stat.label)}</div>
        </div>
      `).join('');
    }

    const basic = document.getElementById('resumeBasicInfo');
    const contact = document.getElementById('resumeContactInfo');
    const advantages = document.getElementById('resumeAdvantages');
    const timeline = document.getElementById('resumeTimeline');
    const education = document.getElementById('resumeEducation');

    if (basic) basic.innerHTML = renderInfoRows(resume.basicInfo);
    if (contact) contact.innerHTML = renderInfoRows(resume.contactInfo);
    if (advantages) {
      advantages.innerHTML = (resume.advantages || [])
        .map(item => `<li>${escapeHtml(item)}</li>`).join('');
    }
    if (timeline) {
      timeline.innerHTML = (resume.experiences || [])
        .map((experience, index) => renderExperience(experience, index)).join('');
    }
    if (education) {
      education.innerHTML = `
        <div class="edu-icon">🎓</div>
        <div>
          <div class="edu-school">${escapeHtml(resume.education?.school)}</div>
          <div class="edu-major">${escapeHtml(resume.education?.major)}</div>
          <div class="edu-period">${escapeHtml(resume.education?.period)}</div>
        </div>
      `;
    }

    const ipRoot = document.getElementById('ipCaseContent');
    if (ipRoot) ipRoot.innerHTML = renderIpCases(content.ipCases || defaults.ipCases);
  }

  async function fetchPublishedContent() {
    const recordIds = [records.resume.id, records.ipCases.id].join(',');
    const url = `${supabase.url}/rest/v1/portfolio_items?select=id,description&id=in.(${recordIds})&is_visible=eq.true`;
    const response = await fetch(url, {
      headers: {
        apikey: supabase.publishableKey,
        Authorization: `Bearer ${supabase.publishableKey}`
      }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const rows = await response.json();
    const parseContent = (row, fallback) => {
      if (!row?.description) return fallback;
      try {
        return JSON.parse(row.description);
      } catch {
        return fallback;
      }
    };
    const resumeRow = rows.find(row => row.id === records.resume.id);
    const ipRow = rows.find(row => row.id === records.ipCases.id);
    return {
      version: 1,
      resume: parseContent(resumeRow, defaults.resume),
      ipCases: parseContent(ipRow, defaults.ipCases)
    };
  }

  function readLocalPreview() {
    try {
      const saved = localStorage.getItem(storageKey);
      return {
        content: saved ? JSON.parse(saved) : defaults,
        hasDraft: Boolean(saved)
      };
    } catch (error) {
      console.warn('无法读取本地内容草稿：', error);
      return { content: defaults, hasDraft: false };
    }
  }

  function showPreviewBanner(hasDraft) {
    const style = document.createElement('style');
    style.textContent = `
      .content-preview-banner {
        position: fixed;
        right: 16px;
        bottom: 16px;
        z-index: 3000;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 9px 12px;
        color: #f5f7fb;
        background: rgba(12,16,24,.9);
        border: 1px solid rgba(99,230,211,.28);
        border-radius: 999px;
        box-shadow: 0 14px 38px rgba(0,0,0,.28);
        backdrop-filter: blur(18px);
        font-size: 12px;
      }
      .content-preview-banner strong { color: #63e6d3; }
      .content-preview-banner a {
        color: #07110f;
        background: #63e6d3;
        border-radius: 999px;
        padding: 5px 9px;
        text-decoration: none;
        font-weight: 700;
      }
      @media (max-width: 560px) {
        .content-preview-banner { right: 12px; bottom: 82px; left: 12px; width: auto; justify-content: space-between; }
        .content-preview-banner span { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
      }
    `;
    document.head.appendChild(style);

    const banner = document.createElement('div');
    banner.className = 'content-preview-banner';
    banner.innerHTML = `
      <span><strong>本地内容预览</strong> · ${hasDraft ? '正在显示后台草稿' : '尚未保存草稿，显示默认内容'}</span>
      <a href="admin/index.html?preview=1">返回后台</a>
    `;
    document.body.appendChild(banner);
  }

  window.PORTFOLIO_CONTENT_READY = (async () => {
    if (isLocalPreview) {
      const preview = readLocalPreview();
      applyContent(preview.content);
      showPreviewBanner(preview.hasDraft);
      return preview.content;
    }

    try {
      const published = await fetchPublishedContent();
      applyContent(published);
      return published;
    } catch (error) {
      console.warn('[site-content] 线上内容读取失败，使用页面默认内容。', error);
      applyContent(defaults);
      return defaults;
    }
  })();
})();
