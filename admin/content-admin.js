(function initContentAdmin() {
  const storageKey = window.PORTFOLIO_CONTENT_STORAGE_KEY;
  const defaults = window.PORTFOLIO_CONTENT_DEFAULTS;
  const records = window.PORTFOLIO_CONTENT_RECORDS;
  const clone = value => JSON.parse(JSON.stringify(value));
  const localMode = typeof isLocalPreview !== 'undefined' && isLocalPreview;
  let currentContentView = 'profile_resume';
  let contentDraft = clone(defaults);
  let lastSavedAt = null;
  let loadError = null;
  let isDirty = false;
  let contentReady = loadDraft();

  const escapeHtml = value => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  async function loadDraft() {
    if (localMode) {
      try {
        const saved = localStorage.getItem(storageKey);
        contentDraft = saved ? JSON.parse(saved) : clone(defaults);
      } catch {
        contentDraft = clone(defaults);
      }
      return contentDraft;
    }

    try {
      const recordIds = [records.resume.id, records.ipCases.id].join(',');
      const rows = await sbFetch(`portfolio_items?select=id,description,updated_at&id=in.(${recordIds})`);
      const parseContent = (row, fallback) => {
        if (!row?.description) return clone(fallback);
        try {
          return JSON.parse(row.description);
        } catch {
          return clone(fallback);
        }
      };
      const resumeRow = rows.find(row => row.id === records.resume.id);
      const ipRow = rows.find(row => row.id === records.ipCases.id);
      contentDraft = {
        version: 1,
        resume: parseContent(resumeRow, defaults.resume),
        ipCases: parseContent(ipRow, defaults.ipCases)
      };
      const timestamps = rows.map(row => row.updated_at).filter(Boolean).sort();
      lastSavedAt = timestamps[timestamps.length - 1] || null;
      loadError = null;
    } catch (error) {
      contentDraft = clone(defaults);
      loadError = error;
    }
    return contentDraft;
  }

  function getByPath(object, path) {
    return path.split('.').reduce((value, key) => value?.[key], object);
  }

  function setByPath(object, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((cursor, key) => cursor[key], object);
    target[lastKey] = value;
  }

  function field(label, path, options = {}) {
    const value = getByPath(contentDraft, path);
    const type = options.type || 'text';
    const full = options.full ? ' full' : '';
    const hint = options.hint ? `<div class="field-hint">${escapeHtml(options.hint)}</div>` : '';
    const labelMeta = options.meta ? `<span>${escapeHtml(options.meta)}</span>` : '';
    const attributes = [
      `data-content-path="${escapeHtml(path)}"`,
      options.format ? `data-content-format="${escapeHtml(options.format)}"` : '',
      type === 'number' ? 'inputmode="numeric"' : '',
      options.placeholder ? `placeholder="${escapeHtml(options.placeholder)}"` : ''
    ].filter(Boolean).join(' ');

    if (type === 'textarea') {
      const rows = options.rows || 4;
      const textValue = options.format === 'lines' && Array.isArray(value)
        ? value.join('\n')
        : String(value ?? '');
      return `
        <div class="editor-field${full}">
          <label>${escapeHtml(label)}${labelMeta}</label>
          <textarea rows="${rows}" ${attributes}>${escapeHtml(textValue)}</textarea>
          ${hint}
        </div>
      `;
    }

    return `
      <div class="editor-field${full}">
        <label>${escapeHtml(label)}${labelMeta}</label>
        <input type="${type}" value="${escapeHtml(value)}" ${attributes}>
        ${hint}
      </div>
    `;
  }

  function editorHero(title, description, anchor) {
    const sourceTime = localMode ? contentDraft._previewSavedAt : lastSavedAt;
    const savedAt = sourceTime
      ? new Date(sourceTime).toLocaleString('zh-CN', { hour12: false })
      : '尚未保存';
    const statusPrefix = localMode ? '仅本地草稿' : 'Supabase 已连接';
    const saveLabel = localMode ? '保存本地草稿' : '发布到前台';
    return `
      <div class="content-editor-hero">
        <div>
          <span class="draft-pill" id="contentDraftStatus">${statusPrefix} · ${escapeHtml(savedAt)}</span>
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(description)}</p>
        </div>
        <div class="editor-actions">
          <button class="btn btn-secondary" type="button" onclick="resetContentDraft()">${localMode ? '恢复当前内容' : '撤销未保存修改'}</button>
          <button class="btn btn-secondary" type="button" onclick="previewContentDraft('${anchor}')">预览前台 ↗</button>
          <button class="btn btn-primary" type="button" onclick="saveContentDraft()">${saveLabel}</button>
        </div>
      </div>
    `;
  }

  function section(title, description, content, action = '') {
    return `
      <section class="editor-section">
        <div class="editor-section-heading">
          <div>
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(description)}</p>
          </div>
          ${action}
        </div>
        ${content}
      </section>
    `;
  }

  function renderProfileResume() {
    const resume = contentDraft.resume;
    const heroFields = `
      <div class="editor-grid">
        ${field('姓名', 'resume.hero.name')}
        ${field('职业定位', 'resume.hero.role')}
        ${field('期望城市', 'resume.hero.location')}
        ${field('当前公司与职位', 'resume.hero.company')}
        ${field('年龄 / 学历 / 专业', 'resume.hero.education')}
        ${field('全网累计阅读量（万）', 'resume.hero.readerReach', { type: 'number' })}
        ${field('阅读量说明', 'resume.hero.readerSubtitle', { full: true })}
      </div>
    `;

    const statFields = `
      <div class="stats-editor-grid">
        ${(resume.stats || []).map((stat, index) => `
          <div class="mini-stat-editor">
            ${field('数字', `resume.stats.${index}.value`)}
            ${field('单位', `resume.stats.${index}.suffix`)}
            ${field('说明', `resume.stats.${index}.label`)}
          </div>
        `).join('')}
      </div>
    `;

    const infoBlock = type => {
      const path = `resume.${type}`;
      const title = type === 'basicInfo' ? '基本信息' : '联系方式';
      const rows = getByPath(contentDraft, path) || [];
      return `
        <div class="repeat-card">
          <div class="repeat-card-heading">
            <div>
              <div class="repeat-index">${escapeHtml(title)}</div>
              <p>每一行对应前台卡片中的一项。</p>
            </div>
            <button class="btn btn-secondary btn-sm" type="button" onclick="addInfoRow('${type}')">＋ 添加一行</button>
          </div>
          <div class="repeat-list">
            ${rows.map((row, index) => `
              <div class="group-editor-top">
                <div class="editor-grid">
                  ${field('字段名', `${path}.${index}.label`)}
                  ${field('内容', `${path}.${index}.value`)}
                </div>
                <button class="icon-btn danger" type="button" title="删除" onclick="removeInfoRow('${type}', ${index})">✕</button>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    };

    const experiences = (resume.experiences || []).map((experience, index) => `
      <article class="repeat-card">
        <div class="repeat-card-heading">
          <div>
            <div class="repeat-index">工作经历 ${index + 1}</div>
            <h4>${escapeHtml(experience.company || '未命名公司')}</h4>
            <p>${escapeHtml(experience.period || '请填写任职时间')}</p>
          </div>
          <div class="card-tools">
            <button class="icon-btn" type="button" title="上移" onclick="moveExperience(${index}, -1)">↑</button>
            <button class="icon-btn" type="button" title="下移" onclick="moveExperience(${index}, 1)">↓</button>
            <button class="icon-btn danger" type="button" title="删除" onclick="removeExperience(${index})">✕</button>
          </div>
        </div>
        <div class="editor-grid">
          ${field('任职时间', `resume.experiences.${index}.period`)}
          ${field('公司名称', `resume.experiences.${index}.company`)}
          ${field('公司备注', `resume.experiences.${index}.companyNote`, { placeholder: '例如：港股上市企业' })}
          ${field('职位', `resume.experiences.${index}.role`)}
        </div>
        <div class="experience-groups">
          ${(experience.groups || []).map((group, groupIndex) => `
            <div class="group-editor">
              <div class="group-editor-top">
                ${field('职责分组标题', `resume.experiences.${index}.groups.${groupIndex}.title`, { placeholder: '可留空' })}
                <button class="icon-btn danger" type="button" title="删除分组" onclick="removeExperienceGroup(${index}, ${groupIndex})">✕</button>
              </div>
              ${field('工作内容', `resume.experiences.${index}.groups.${groupIndex}.bullets`, {
                type: 'textarea',
                rows: 5,
                format: 'lines',
                hint: '每行一条，前台会自动显示为项目符号。'
              })}
            </div>
          `).join('')}
          <div>
            <button class="btn btn-secondary btn-sm" type="button" onclick="addExperienceGroup(${index})">＋ 添加职责分组</button>
          </div>
        </div>
      </article>
    `).join('');

    return `
      <div class="content-editor-shell">
        ${editorHero(
          '把简历当成一张随时可更新的名片',
          localMode
            ? '这里的修改会同步影响前台首屏和“个人简历”区。当前仅保存到这台电脑的浏览器中，线上网站不会变化。'
            : '这里的修改会同步影响前台首屏和“个人简历”区。点击发布后，线上网站会读取最新内容。',
          'resume'
        )}
        ${section('首屏身份信息', '控制姓名、定位、城市、当前职位与顶部累计阅读量。', heroFields)}
        ${section('数字亮点', '保持四项最有说服力的数据，前台会自动按桌面端与移动端排版。', statFields)}
        ${section('信息卡片', '管理简历区的基本资料和联系方式。', `<div class="editor-grid">${infoBlock('basicInfo')}${infoBlock('contactInfo')}</div>`)}
        ${section(
          '个人优势',
          '建议保留 3–5 条，每条只表达一个清晰优势。',
          field('优势内容', 'resume.advantages', {
            type: 'textarea',
            rows: 8,
            full: true,
            format: 'lines',
            hint: '每行一条，前台会自动生成项目符号。'
          })
        )}
        ${section(
          '工作经历',
          '支持新增、删除和排序；每段经历还可以拆成多个职责分组。',
          `<div class="repeat-list">${experiences || '<div class="empty-editor">还没有工作经历</div>'}</div>`,
          '<button class="btn btn-secondary btn-sm" type="button" onclick="addExperience()">＋ 新增经历</button>'
        )}
        ${section(
          '教育经历',
          '当前前台使用一张精简教育卡片。',
          `<div class="editor-grid three">
            ${field('学校', 'resume.education.school')}
            ${field('专业与学历', 'resume.education.major')}
            ${field('就读时间', 'resume.education.period')}
          </div>`
        )}
        <div class="editor-footer-note">${localMode
          ? '本地草稿只对当前浏览器有效，清除浏览器数据后会消失。'
          : '发布内容由 Supabase 安全保存，只有管理员账号可以修改。'}</div>
      </div>
    `;
  }

  function renderLinkEditor(caseIndex, links) {
    return `
      <div class="experience-groups">
        <div class="repeat-card-heading">
          <div>
            <h4>主页链接</h4>
            <p>可添加 B 站、抖音、栏目主页等入口。</p>
          </div>
          <button class="btn btn-secondary btn-sm" type="button" onclick="addIpLink(${caseIndex})">＋ 添加链接</button>
        </div>
        ${(links || []).map((link, linkIndex) => `
          <div class="group-editor-top">
            <div class="editor-grid">
              ${field('按钮文字', `ipCases.${caseIndex}.links.${linkIndex}.label`)}
              ${field('链接地址', `ipCases.${caseIndex}.links.${linkIndex}.url`, { type: 'url' })}
            </div>
            <button class="icon-btn danger" type="button" title="删除链接" onclick="removeIpLink(${caseIndex}, ${linkIndex})">✕</button>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderArticleEditor(caseIndex, articles) {
    return `
      <div class="experience-groups">
        <div class="repeat-card-heading">
          <div>
            <h4>代表文章</h4>
            <p>前台会按这里的顺序展示。</p>
          </div>
          <button class="btn btn-secondary btn-sm" type="button" onclick="addIpArticle(${caseIndex})">＋ 添加文章</button>
        </div>
        ${(articles || []).map((article, articleIndex) => `
          <div class="group-editor">
            <div class="group-editor-top">
              <div class="editor-grid three">
                ${field('图标', `ipCases.${caseIndex}.articles.${articleIndex}.icon`)}
                ${field('文章标题', `ipCases.${caseIndex}.articles.${articleIndex}.title`)}
                ${field('链接地址', `ipCases.${caseIndex}.articles.${articleIndex}.url`, { type: 'url' })}
              </div>
              <button class="icon-btn danger" type="button" title="删除文章" onclick="removeIpArticle(${caseIndex}, ${articleIndex})">✕</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderIpContent() {
    const cases = (contentDraft.ipCases || []).map((item, index) => `
      <article class="repeat-card">
        <div class="repeat-card-heading">
          <div>
            <div class="repeat-index">IP 案例 ${index + 1}</div>
            <h4>${escapeHtml(item.name || '未命名案例')}</h4>
            <p>${(item.articles || []).length} 篇代表文章 · ${(item.links || []).length} 个主页链接</p>
          </div>
          <div class="card-tools">
            <button class="icon-btn" type="button" title="上移" onclick="moveIpCase(${index}, -1)">↑</button>
            <button class="icon-btn" type="button" title="下移" onclick="moveIpCase(${index}, 1)">↓</button>
            <button class="icon-btn danger" type="button" title="删除" onclick="removeIpCase(${index})">✕</button>
          </div>
        </div>
        <div class="editor-grid">
          ${field('案例名称', `ipCases.${index}.name`)}
          ${field('关键成绩', `ipCases.${index}.metrics`, { placeholder: '例如：播放量、涨粉量、更新数量' })}
          ${field('案例介绍', `ipCases.${index}.description`, { type: 'textarea', rows: 4, full: true })}
        </div>
        ${renderLinkEditor(index, item.links)}
        ${renderArticleEditor(index, item.articles)}
      </article>
    `).join('');

    return `
      <div class="content-editor-shell">
        ${editorHero(
          '让每个 IP 案例都有完整的成果叙事',
          localMode
            ? '你可以调整案例顺序、简介、成绩、主页入口和代表文章。当前只生成本地预览，不会覆盖线上内容。'
            : '你可以调整案例顺序、简介、成绩、主页入口和代表文章。发布后会立即成为前台展示内容。',
          'ip'
        )}
        ${section(
          'IP 案例列表',
          '建议把最能代表运营能力、内容能力和增长结果的案例放在前面。',
          `<div class="repeat-list">${cases || '<div class="empty-editor">还没有 IP 案例</div>'}</div>`,
          '<button class="btn btn-secondary btn-sm" type="button" onclick="addIpCase()">＋ 新增案例</button>'
        )}
        <div class="editor-footer-note">保存后点击“预览前台”，即可查看真实页面中的排版效果。</div>
      </div>
    `;
  }

  window.renderContentEditor = async function renderContentEditor(view) {
    currentContentView = view;
    const root = document.getElementById('contentEditorRoot');
    if (!root) return;
    root.innerHTML = '<div class="editor-section"><div class="table-loading">正在读取页面内容...</div></div>';
    await contentReady;
    root.innerHTML = view === 'ip_content' ? renderIpContent() : renderProfileResume();
    document.getElementById('syncStatus').textContent = localMode ? '本地草稿模式' : 'Supabase 已同步';
    if (loadError && typeof showToast === 'function') {
      showToast('线上内容读取失败，当前显示默认内容：' + loadError.message, 'error');
    }
  };

  window.saveContentDraft = async function saveContentDraft(silent = false) {
    try {
      if (localMode) {
        contentDraft._previewSavedAt = new Date().toISOString();
        localStorage.setItem(storageKey, JSON.stringify(contentDraft));
      } else {
        const rows = [
          {
            id: records.resume.id,
            title: records.resume.title,
            description: JSON.stringify(contentDraft.resume),
            section: 'planning',
            category: '系统内容',
            category_icon: '⚙️',
            tags: ['系统'],
            tag_colors: ['tag-teal'],
            sort_order: 999999,
            is_visible: true
          },
          {
            id: records.ipCases.id,
            title: records.ipCases.title,
            description: JSON.stringify(contentDraft.ipCases),
            section: 'planning',
            category: '系统内容',
            category_icon: '⚙️',
            tags: ['系统'],
            tag_colors: ['tag-teal'],
            sort_order: 999999,
            is_visible: true
          }
        ];
        await sbFetch(
          'portfolio_items?on_conflict=id',
          'POST',
          rows,
          'resolution=merge-duplicates,return=representation'
        );
        lastSavedAt = new Date().toISOString();
      }
      isDirty = false;
      updateDraftStatus();
      if (!silent && typeof showToast === 'function') {
        showToast(localMode ? '本地草稿已保存，线上网站未变更' : '页面内容已发布到前台', 'success');
      }
      return true;
    } catch (error) {
      if (typeof showToast === 'function') showToast('保存失败：' + error.message, 'error');
      return false;
    }
  };

  window.previewContentDraft = async function previewContentDraft(anchor) {
    const saved = await window.saveContentDraft(true);
    if (!saved) return;
    const previewQuery = localMode ? '?content-preview=1' : '';
    window.open(`../index.html${previewQuery}#${encodeURIComponent(anchor || 'resume')}`, '_blank', 'noopener');
    if (typeof showToast === 'function') {
      showToast(localMode ? '已保存草稿并打开前台预览' : '已发布并打开前台页面', 'success');
    }
  };

  window.resetContentDraft = async function resetContentDraft() {
    const message = localMode
      ? '要放弃本地草稿并恢复为当前前台内容吗？'
      : '要放弃尚未发布的修改，并重新读取线上内容吗？';
    if (!confirm(message)) return;

    if (localMode) {
      localStorage.removeItem(storageKey);
      contentDraft = clone(defaults);
    } else {
      contentReady = loadDraft();
      await contentReady;
    }
    isDirty = false;
    await window.renderContentEditor(currentContentView);
    if (typeof showToast === 'function') {
      showToast(localMode ? '已恢复当前前台内容' : '已重新读取线上内容', 'info');
    }
  };

  function updateDraftStatus() {
    const status = document.getElementById('contentDraftStatus');
    if (!status) return;
    if (isDirty) {
      status.textContent = `${localMode ? '本地草稿' : '线上内容'} · 有未保存修改`;
      return;
    }
    const sourceTime = localMode ? contentDraft._previewSavedAt : lastSavedAt;
    const savedAt = sourceTime
      ? new Date(sourceTime).toLocaleString('zh-CN', { hour12: false })
      : '尚未保存';
    status.textContent = `${localMode ? '仅本地草稿' : 'Supabase 已连接'} · ${savedAt}`;
  }

  function markDirty() {
    isDirty = true;
    updateDraftStatus();
  }

  function rerender() {
    markDirty();
    window.renderContentEditor(currentContentView);
  }

  function moveItem(list, index, direction) {
    const next = index + direction;
    if (next < 0 || next >= list.length) return false;
    [list[index], list[next]] = [list[next], list[index]];
    return true;
  }

  window.addInfoRow = function addInfoRow(type) {
    contentDraft.resume[type].push({ label: '新字段', value: '' });
    rerender();
  };
  window.removeInfoRow = function removeInfoRow(type, index) {
    contentDraft.resume[type].splice(index, 1);
    rerender();
  };

  window.addExperience = function addExperience() {
    contentDraft.resume.experiences.push({
      period: '',
      company: '新公司',
      companyNote: '',
      role: '',
      accent: contentDraft.resume.experiences.length % 2 ? 'purple' : 'green',
      groups: [{ title: '', bullets: [''] }]
    });
    rerender();
  };
  window.removeExperience = function removeExperience(index) {
    contentDraft.resume.experiences.splice(index, 1);
    rerender();
  };
  window.moveExperience = function moveExperience(index, direction) {
    if (moveItem(contentDraft.resume.experiences, index, direction)) rerender();
  };
  window.addExperienceGroup = function addExperienceGroup(experienceIndex) {
    contentDraft.resume.experiences[experienceIndex].groups.push({ title: '', bullets: [''] });
    rerender();
  };
  window.removeExperienceGroup = function removeExperienceGroup(experienceIndex, groupIndex) {
    contentDraft.resume.experiences[experienceIndex].groups.splice(groupIndex, 1);
    rerender();
  };

  window.addIpCase = function addIpCase() {
    contentDraft.ipCases.push({
      name: '新 IP 案例',
      description: '',
      metrics: '',
      links: [],
      articles: []
    });
    rerender();
  };
  window.removeIpCase = function removeIpCase(index) {
    contentDraft.ipCases.splice(index, 1);
    rerender();
  };
  window.moveIpCase = function moveIpCase(index, direction) {
    if (moveItem(contentDraft.ipCases, index, direction)) rerender();
  };
  window.addIpLink = function addIpLink(caseIndex) {
    contentDraft.ipCases[caseIndex].links.push({ label: '🔗 主页链接', url: '' });
    rerender();
  };
  window.removeIpLink = function removeIpLink(caseIndex, linkIndex) {
    contentDraft.ipCases[caseIndex].links.splice(linkIndex, 1);
    rerender();
  };
  window.addIpArticle = function addIpArticle(caseIndex) {
    contentDraft.ipCases[caseIndex].articles.push({ icon: '📄', title: '', url: '' });
    rerender();
  };
  window.removeIpArticle = function removeIpArticle(caseIndex, articleIndex) {
    contentDraft.ipCases[caseIndex].articles.splice(articleIndex, 1);
    rerender();
  };

  document.addEventListener('input', event => {
    const input = event.target.closest('[data-content-path]');
    if (!input) return;
    let value = input.value;
    if (input.dataset.contentFormat === 'lines') {
      value = value.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    } else if (input.type === 'number') {
      value = Number(value);
    }
    setByPath(contentDraft, input.dataset.contentPath, value);
    markDirty();
  });
})();
