import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const destination = path.join(root, 'dist');

function scalar(value) {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  return trimmed;
}

function parseConfig(source) {
  const output = {};
  const lines = source.split(/\r?\n/);
  let section = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim() || line.trimStart().startsWith('#')) continue;

    const match = line.match(/^(\s*)([^:]+):\s*(.*)$/);
    if (!match) continue;
    const indent = match[1].length;
    const key = match[2].trim();
    let value = match[3];

    if (value === '>-') {
      const pieces = [];
      while (index + 1 < lines.length && lines[index + 1].match(/^\s+/)?.[0].length > indent) {
        pieces.push(lines[index + 1].trim());
        index += 1;
      }
      value = pieces.join(' ');
    }

    if (indent === 0) {
      if (value === '') {
        section = key;
        output[key] = {};
      } else {
        section = null;
        output[key] = scalar(value);
      }
    } else if (indent === 2 && section && value !== '') {
      output[section][key] = scalar(value);
    }
  }

  return output;
}

function parseList(source) {
  const items = [];
  const lines = source.split(/\r?\n/);
  let item = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const itemMatch = line.match(/^-\s+([^:]+):\s*(.*)$/);
    const propertyMatch = line.match(/^\s{2}([^:]+):\s*(.*)$/);
    const match = itemMatch || propertyMatch;
    if (!match) continue;

    if (itemMatch) {
      item = {};
      items.push(item);
    }

    const key = match[1].trim();
    let value = match[2];
    const indent = itemMatch ? 0 : 2;
    if (value === '>-') {
      const pieces = [];
      while (index + 1 < lines.length && lines[index + 1].match(/^\s+/)?.[0].length > indent) {
        pieces.push(lines[index + 1].trim());
        index += 1;
      }
      value = pieces.join(' ');
    }
    item[key] = scalar(value);
  }

  return items;
}

function parseFrontMatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { attributes: {}, content: source };
  const attributes = {};
  for (const line of match[1].split(/\r?\n/)) {
    const entry = line.match(/^([^:]+):\s*(.*)$/);
    if (entry) attributes[entry[1].trim()] = scalar(entry[2]);
  }
  return { attributes, content: match[2] };
}

const site = parseConfig(fs.readFileSync(path.join(root, '_config.yml'), 'utf8'));
site.data = {};
for (const name of ['navigation', 'projects', 'outputs']) {
  site.data[name] = parseList(fs.readFileSync(path.join(root, '_data', `${name}.yml`), 'utf8'));
}

function resolveValue(expression, context) {
  const value = expression.trim();
  if ((value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"'))) {
    return value.slice(1, -1);
  }
  if (/^\d+$/.test(value)) return Number(value);
  return value.split('.').reduce((current, key) => current?.[key], context);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function filteredValue(expression, context) {
  const segments = expression.split('|').map((part) => part.trim());
  let value = resolveValue(segments.shift(), context);

  for (const segment of segments) {
    const [name, rawArgument] = segment.split(/:(.*)/s).map((part) => part?.trim());
    const argument = rawArgument ? resolveValue(rawArgument, context) : undefined;
    if (name === 'default' && (value === undefined || value === null || value === '')) value = argument;
    if (name === 'escape') value = escapeHtml(value);
    if (name === 'strip_html') value = String(value ?? '').replace(/<[^>]*>/g, '');
    if (name === 'strip_newlines') value = String(value ?? '').replace(/[\r\n]+/g, ' ');
    if (name === 'relative_url') {
      const text = String(value ?? '');
      value = text.startsWith('http') ? text : `${site.baseurl || ''}${text.startsWith('/') ? text : `/${text}`}`;
    }
    if (name === 'absolute_url') {
      const text = String(value ?? '');
      value = text.startsWith('http') ? text : `${site.url}${site.baseurl || ''}${text.startsWith('/') ? text : `/${text}`}`;
    }
    if (name === 'date') value = new Date().getUTCFullYear().toString();
  }

  return value ?? '';
}

function evaluateCondition(expression, context) {
  const equality = expression.match(/^(.+?)\s*==\s*(.+)$/);
  if (equality) return resolveValue(equality[1], context) === resolveValue(equality[2], context);
  return Boolean(resolveValue(expression, context));
}

function includeFiles(template) {
  return template.replace(/{%\s*include\s+([^\s%]+)\s*%}/g, (_, filename) => {
    const included = fs.readFileSync(path.join(root, '_includes', filename), 'utf8');
    return includeFiles(included);
  });
}

function render(template, context) {
  const local = { ...context };
  let result = template;

  result = result.replace(/{%\s*assign\s+(\w+)\s*=\s*([\s\S]*?)\s*%}/g, (_, name, expression) => {
    local[name] = filteredValue(expression, local);
    return '';
  });

  const loopPattern = /{%\s*for\s+(\w+)\s+in\s+([^\s%]+)(?:\s+limit:\s*(\d+))?\s*%}([\s\S]*?){%\s*endfor\s*%}/g;
  result = result.replace(loopPattern, (_, variable, expression, limit, block) => {
    const values = resolveValue(expression, local) || [];
    const selected = limit ? values.slice(0, Number(limit)) : values;
    return selected.map((entry, index) => render(block, {
      ...local,
      [variable]: entry,
      forloop: { index: index + 1, first: index === 0, last: index === selected.length - 1 }
    })).join('');
  });

  const ifPattern = /{%\s*if\s+([\s\S]*?)\s*%}([\s\S]*?){%\s*endif\s*%}/g;
  result = result.replace(ifPattern, (_, expression, block) => evaluateCondition(expression, local) ? render(block, local) : '');

  result = result.replace(/{{\s*([\s\S]*?)\s*}}/g, (_, expression) => String(filteredValue(expression, local)));
  return result;
}

function outputPath(permalink) {
  if (permalink === '/') return path.join(destination, 'index.html');
  if (path.extname(permalink)) return path.join(destination, permalink.slice(1));
  return path.join(destination, permalink.replace(/^\//, ''), 'index.html');
}

function buildPage(sourcePath, defaultPermalink) {
  const source = fs.readFileSync(sourcePath, 'utf8');
  const { attributes, content } = parseFrontMatter(source);
  const permalink = attributes.permalink || defaultPermalink;
  const page = { ...attributes, url: permalink };
  const layout = attributes.layout === null || attributes.layout === 'null'
    ? content
    : fs.readFileSync(path.join(root, '_layouts', `${attributes.layout || 'default'}.html`), 'utf8').replace('{{ content }}', content);
  const rendered = render(includeFiles(layout), { site, page });
  const target = outputPath(permalink);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, rendered);
  return permalink;
}

fs.rmSync(destination, { recursive: true, force: true });
fs.mkdirSync(destination, { recursive: true });
fs.cpSync(path.join(root, 'assets'), path.join(destination, 'assets'), { recursive: true });
fs.copyFileSync(path.join(root, 'manifest.webmanifest'), path.join(destination, 'manifest.webmanifest'));

const urls = [];
urls.push(buildPage(path.join(root, 'index.html'), '/'));
for (const filename of fs.readdirSync(path.join(root, '_pages')).filter((name) => name.endsWith('.html')).sort()) {
  urls.push(buildPage(path.join(root, '_pages', filename), `/${path.basename(filename, '.html')}/`));
}
buildPage(path.join(root, 'robots.txt'), '/robots.txt');

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.filter((url) => url !== '/404.html').map((url) => `  <url><loc>${site.url}${url}</loc></url>`),
  '</urlset>',
  ''
].join('\n');
fs.writeFileSync(path.join(destination, 'sitemap.xml'), sitemap);

console.log(`Built ${urls.length} pages in ${path.relative(root, destination)}/`);
