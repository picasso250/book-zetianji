import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import * as sass from 'sass';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const siteDir = path.join(root, '_site');
const buildRevision = process.env.GITHUB_SHA?.slice(0, 12) || 'npm-build';

const site = {
  title: '泽天记',
  description: '作者 Raywood',
  lang: 'zh-CN',
  github: {
    is_project_page: true,
    repository_url: 'https://github.com/picasso250/book-zetianji',
    repository_name: 'book-zetianji',
    owner_name: 'picasso250',
    owner_url: 'https://github.com/picasso250',
    build_revision: buildRevision
  },
  show_downloads: false,
  google_analytics: ''
};

const md = new MarkdownIt({
  html: true,
  linkify: false,
  typographer: false
});

const skipDirs = new Set(['.git', '.github', '.script', '_layouts', '_site', 'node_modules', 'scripts']);
const skipFiles = new Set(['AGENTS.md', 'worklog.md']);

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!skipDirs.has(entry.name)) {
        files.push(...await walk(fullPath));
      }
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function readConfig() {
  const configPath = path.join(root, '_config.yml');
  if (!fs.existsSync(configPath)) return;

  const text = fs.readFileSync(configPath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    const value = rawValue.trim().replace(/^['"]|['"]$/g, '');
    if (key === 'title' || key === 'description') {
      site[key] = value;
    }
  }
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function stripLiquidIf(template, key, enabled) {
  const pattern = new RegExp(`\\{%\\s*if\\s+${key.replaceAll('.', '\\.')}\\s*%\\}([\\s\\S]*?)\\{%\\s*endif\\s*%\\}`, 'g');
  return template.replace(pattern, enabled ? '$1' : '');
}

function replaceVariables(template, page, contentHtml) {
  let html = template;
  const title = page.title || site.title;
  const fullTitle = title === site.title ? site.title : `${title} - ${site.title}`;

  html = html.replaceAll('{% seo %}', [
    `<title>${escapeHtml(fullTitle)}</title>`,
    `<meta name="description" content="${escapeHtml(site.description)}">`
  ].join('\n'));

  html = stripLiquidIf(html, 'site.show_downloads', site.show_downloads);
  html = stripLiquidIf(html, 'site.google_analytics', Boolean(site.google_analytics));
  html = stripLiquidIf(html, 'site.github.is_project_page', site.github.is_project_page);

  html = html.replaceAll('{{ content }}', contentHtml);
  html = html.replace(/\{\{\s*page\.title\s*\}\}/g, escapeHtml(page.title || ''));
  html = html.replace(/\{\{\s*site\.title\s*(?:\|\s*default:\s*[^}]+)?\}\}/g, escapeHtml(site.title));
  html = html.replace(/\{\{\s*site\.description\s*(?:\|\s*default:\s*[^}]+)?\}\}/g, escapeHtml(site.description));
  html = html.replace(/\{\{\s*site\.lang\s*\|\s*default:\s*"[^"]+"\s*\}\}/g, escapeHtml(site.lang));
  html = html.replace(/\{\{\s*site\.google_analytics\s*\}\}/g, escapeHtml(site.google_analytics));

  for (const [key, value] of Object.entries(site.github)) {
    html = html.replaceAll(`{{ site.github.${key} }}`, escapeHtml(value));
  }

  html = html.replace(
    /\{\{\s*'([^']+)'\s*\|\s*append:\s*site\.github\.build_revision\s*\|\s*relative_url\s*\}\}/g,
    (_, assetPath) => `${assetPath}${site.github.build_revision}`
  );
  html = html.replace(
    /\{\{\s*'([^']+)'\s*\|\s*append:\s*([^|}]+?)\s*\|\s*relative_url\s*\}\}/g,
    (_, assetPath, suffix) => `${assetPath}${String(suffix).trim()}`
  );
  html = html.replace(/\{\{\s*'([^']+)'\s*\|\s*relative_url\s*\}\}/g, '$1');

  return normalizeHtmlLinks(html);
}

function normalizeLocalMarkdownLinks(markdown) {
  return markdown.replace(/\[([^\]\n]+)\]\((\/[^)\n]*)\)/g, (_, text, href) => {
    return `[${text}](<${href}>)`;
  });
}

function normalizeHtmlLinks(html) {
  return html.replace(/\bhref=(["'])(\/[^"']*)\1/g, (_, quote, href) => {
    return `href=${quote}${encodeHref(dropHtmlExtension(href))}${quote}`;
  });
}

function dropHtmlExtension(href) {
  const [pathPart, suffix = ''] = href.split(/([?#].*)/, 2);
  if (pathPart !== '/' && pathPart.endsWith('.html')) {
    return `${pathPart.slice(0, -5)}${suffix}`;
  }
  return href;
}

function encodeHref(href) {
  try {
    return encodeURI(decodeURI(href));
  } catch {
    return encodeURI(href);
  }
}

async function loadLayout(name) {
  const layoutPath = path.join(root, '_layouts', `${name}.html`);
  if (!await fs.pathExists(layoutPath)) {
    return '{{ content }}';
  }
  return fs.readFile(layoutPath, 'utf8');
}

async function writeHtml(relPath, html) {
  const parsed = path.parse(relPath);
  const htmlPath = path.join(siteDir, parsed.dir, `${parsed.name}.html`);

  await fs.ensureDir(path.dirname(htmlPath));
  await fs.writeFile(htmlPath, html, 'utf8');
}

async function buildMarkdown(file) {
  const relPath = path.relative(root, file);
  const source = await fs.readFile(file, 'utf8');
  const parsed = matter(source);
  const page = parsed.data || {};
  const contentHtml = md.render(normalizeLocalMarkdownLinks(parsed.content));
  const layout = await loadLayout(page.layout || 'default');
  const html = replaceVariables(layout, page, contentHtml);

  await writeHtml(relPath, html);
  console.log(`  [OK] ${relPath}`);
}

async function buildCss() {
  const cssDir = path.join(root, 'assets', 'css');
  const outCssDir = path.join(siteDir, 'assets', 'css');
  await fs.ensureDir(outCssDir);

  for (const name of ['style.scss', 'chapter.scss']) {
    const input = path.join(cssDir, name);
    if (!await fs.pathExists(input)) continue;
    const result = sass.compile(input, {
      loadPaths: [cssDir],
      style: 'expanded'
    });
    await fs.writeFile(path.join(outCssDir, name.replace(/\.scss$/, '.css')), result.css, 'utf8');
    console.log(`  [OK] assets/css/${name}`);
  }

  for (const file of await fs.readdir(cssDir)) {
    if (file.endsWith('.css')) {
      await fs.copy(path.join(cssDir, file), path.join(outCssDir, file));
    }
  }
}

async function copyStaticFiles() {
  const imagesPath = path.join(root, 'assets', 'images');
  if (await fs.pathExists(imagesPath)) {
    await fs.copy(imagesPath, path.join(siteDir, 'assets', 'images'));
    console.log('  [OK] assets/images');
  }

  const rolesPath = path.join(root, 'roles.json');
  if (await fs.pathExists(rolesPath)) {
    await fs.copy(rolesPath, path.join(siteDir, 'roles.json'));
    console.log('  [OK] roles.json');
  }

  await fs.writeFile(path.join(siteDir, '.nojekyll'), '');
}

async function build404() {
  const layout = await loadLayout('default');
  const html = replaceVariables(layout, { title: '404' }, '<h2>Page not found</h2><p><a href="/">返回目录</a></p>');
  await fs.writeFile(path.join(siteDir, '404.html'), html, 'utf8');
  console.log('  [OK] 404.html');
}

async function main() {
  readConfig();
  await fs.remove(siteDir);
  await fs.ensureDir(siteDir);

  console.log('Building book-zetianji...\n');

  const files = await walk(root);
  const markdownFiles = files
    .filter((file) => file.endsWith('.md') && !skipFiles.has(path.relative(root, file).replaceAll('\\', '/')))
    .sort((a, b) => a.localeCompare(b));

  for (const file of markdownFiles) {
    await buildMarkdown(file);
  }

  await buildCss();
  await copyStaticFiles();
  await build404();

  console.log(`\nDone! Output in ${siteDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
