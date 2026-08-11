import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const token = process.env.NOTION_API_KEY;
const sourceId = process.env.NOTION_DATA_SOURCE_ID;

if (!token || !sourceId) {
  throw new Error('NOTION_API_KEY 或 NOTION_DATA_SOURCE_ID 未配置。');
}

const headers = {
  Authorization: `Bearer ${token}`,
  'Notion-Version': '2026-03-11',
  'Content-Type': 'application/json',
};

async function queryAll() {
  const rows = [];
  let cursor;
  do {
    const response = await fetch(`https://api.notion.com/v1/data_sources/${sourceId}/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        page_size: 100,
        start_cursor: cursor,
        filter: { property: '已发布', checkbox: { equals: true } },
        sorts: [{ property: '排序', direction: 'ascending' }],
      }),
    });
    if (!response.ok) throw new Error(`Notion 请求失败：${response.status} ${await response.text()}`);
    const body = await response.json();
    rows.push(...body.results);
    cursor = body.has_more ? body.next_cursor : null;
  } while (cursor);
  return rows;
}

const text = (property) => property?.rich_text?.map((item) => item.plain_text).join('')
  ?? property?.title?.map((item) => item.plain_text).join('')
  ?? '';
const select = (property) => property?.select?.name ?? '';
const date = (property) => property?.date?.start ?? '';
async function filesFor(page, property) {
  if (property?.files?.length) return property.files;
  if (!property?.id) return [];
  const response = await fetch(
    `https://api.notion.com/v1/pages/${page.id}/properties/${encodeURIComponent(property.id)}`,
    { headers },
  );
  if (!response.ok) return [];
  const body = await response.json();
  return body.results?.flatMap((item) => item.files ?? []) ?? body.files ?? [];
}

function extensionFor(contentType, sourceUrl) {
  const match = /image\/(jpeg|png|webp|gif|svg\+xml)/.exec(contentType || '');
  if (match) return ({ jpeg: '.jpg', png: '.png', webp: '.webp', gif: '.gif', 'svg+xml': '.svg' })[match[1]];
  return /\.(jpg|jpeg|png|webp|gif|svg)(?:$|[?#])/i.exec(sourceUrl)?.[0].replace(/[?#].*/, '') || '.jpg';
}

async function saveCover(page, property) {
  const file = (await filesFor(page, property))[0];
  const sourceUrl = file?.file?.url ?? file?.external?.url;
  if (!sourceUrl) return '';
  const response = await fetch(sourceUrl);
  if (!response.ok) throw new Error(`无法下载作品封面：${page.id}`);
  const extension = extensionFor(response.headers.get('content-type'), sourceUrl);
  const relativePath = `images/notion/${page.id}${extension}`;
  await mkdir('images/notion', { recursive: true });
  await writeFile(relativePath, Buffer.from(await response.arrayBuffer()));
  return relativePath;
}

async function toRecord(page) {
  const p = page.properties;
  return {
    id: page.id,
    key: text(p.Name),
    type: select(p['内容类型']),
    titleZh: text(p['中文标题']),
    titleEn: text(p['英文标题']),
    descriptionZh: text(p['中文简介']),
    descriptionEn: text(p['英文简介']),
    organization: text(p['机构／客户']),
    role: text(p['职位／角色']),
    startDate: date(p['开始日期']),
    endDate: date(p['结束日期']),
    category: select(p['作品分类']),
    cover: await saveCover(page, p['封面图片']),
    url: p['项目链接']?.url ?? '',
    order: p['排序']?.number ?? 999,
  };
}

const rows = await Promise.all((await queryAll()).map(toRecord));
const payload = {
  generatedAt: new Date().toISOString(),
  profile: rows.filter((row) => row.type === '个人资料'),
  experiences: rows.filter((row) => row.type === '履历'),
  projects: rows.filter((row) => row.type === '作品'),
};

if (rows.length === 0) {
  console.log('Notion 中还没有勾选“已发布”的内容；网站保持现状。');
  process.exit(0);
}

await mkdir('data', { recursive: true });
await writeFile(join('data', 'portfolio.json'), `${JSON.stringify(payload, null, 2)}\n`);
console.log(`已同步 ${payload.profile.length} 条个人资料、${payload.experiences.length} 条履历、${payload.projects.length} 个作品。`);
