/*
 * 网站内容由 data/portfolio.json 驱动；该文件由 GitHub Actions 从 Notion 生成。
 * 只有 Notion 中勾选“已发布”的资料才会覆盖默认页面内容。
 */
(async () => {
  try {
    const response = await fetch('data/portfolio.json', { cache: 'no-store' });
    if (!response.ok) return;
    const data = await response.json();

    for (const item of data.profile || []) {
      const target = document.querySelector(`[data-key="${CSS.escape(item.key)}"]`);
      if (target && item.titleZh) target.textContent = item.titleZh;
    }

    if ((data.experiences || []).length) renderExperiences(data.experiences);
    if ((data.projects || []).length) renderProjects(data.projects);

    if (typeof initializeFilters === 'function') initializeFilters();
  } catch (error) {
    console.info('Notion 内容尚未同步，显示网站默认内容。');
  }

  function renderExperiences(items) {
    const list = document.getElementById('expList');
    if (!list) return;
    list.innerHTML = items.map((item) => `
      <div class="exp__item">
        <div class="exp__meta">
          <div class="exp__period">${escape(formatPeriod(item.startDate, item.endDate))}</div>
          <div class="exp__tag">${escape(item.category || '经历')}</div>
        </div>
        <div class="exp__content">
          <h3 class="exp__company">${escape(item.organization || item.key)}</h3>
          <p class="exp__role">${escape(item.role)}</p>
          <p class="exp__desc">${escape(item.descriptionZh)}</p>
        </div>
      </div>`).join('');
  }

  function renderProjects(items) {
    const grid = document.getElementById('workGrid');
    if (!grid) return;
    grid.innerHTML = items.map((item) => {
      const category = categoryId(item.category);
      const image = item.cover || 'images/work-1.png';
      const url = item.url || '#';
      return `
        <article class="work__card" data-category="${category}">
          <div class="card__img">
            <img src="${escapeAttr(image)}" alt="${escapeAttr(item.titleZh || item.key)}" />
            <div class="card__overlay"><a href="${escapeAttr(url)}" class="card__link" ${url === '#' ? '' : 'target="_blank" rel="noopener"'}>查看作品 →</a></div>
          </div>
          <div class="card__info">
            <span class="card__tag">${escape(item.category || '作品')}</span>
            <h3 class="card__title">${escape(item.titleZh || item.key)}</h3>
            <p class="card__desc">${escape(item.descriptionZh)}</p>
          </div>
        </article>`;
    }).join('');
  }

  function formatPeriod(start, end) {
    const format = (value) => value ? value.slice(0, 7).replace('-', '.') : '';
    return [format(start), format(end)].filter(Boolean).join(' — ');
  }
  function categoryId(name) {
    return ({ '平面设计': 'graphic', '品牌设计': 'graphic', '插画': 'graphic', 'UI设计': 'ui', '绘画': 'painting' })[name] || 'other';
  }
  function escape(value = '') {
    const node = document.createElement('span');
    node.textContent = value;
    return node.innerHTML;
  }
  function escapeAttr(value = '') { return escape(value).replace(/`/g, '&#96;'); }
})();
