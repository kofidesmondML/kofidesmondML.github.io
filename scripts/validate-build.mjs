import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const destination = path.join(root, 'dist');
const failures = [];

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

function fail(file, message) {
  failures.push(`${path.relative(root, file)}: ${message}`);
}

function localTarget(reference) {
  const pathname = reference.split(/[?#]/)[0];
  if (!pathname || pathname === '/') return path.join(destination, 'index.html');
  const clean = pathname.replace(/^\//, '');
  if (path.extname(clean)) return path.join(destination, clean);
  return path.join(destination, clean, 'index.html');
}

const htmlFiles = walk(destination).filter((file) => file.endsWith('.html'));

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  if (/{{|{%/.test(html)) fail(file, 'contains unrendered Liquid syntax');
  if (!/<html\s+lang="en-US">/.test(html)) fail(file, 'missing document language');
  if (!/<title>[^<]+<\/title>/.test(html)) fail(file, 'missing title');
  if (!/<meta name="description" content="[^"]+">/.test(html)) fail(file, 'missing meta description');
  if (!/<link rel="canonical" href="https:\/\/kofidesmondml\.github\.io\/[^"]*">/.test(html)) fail(file, 'missing canonical URL');
  if (!/<meta property="og:image" content="https:\/\/kofidesmondml\.github\.io\/assets\/images\/og-card\.png">/.test(html)) fail(file, 'missing social preview metadata');

  const h1Count = (html.match(/<h1(?:\s|>)/g) || []).length;
  if (h1Count !== 1) fail(file, `expected one h1, found ${h1Count}`);

  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length) fail(file, `duplicate IDs: ${[...new Set(duplicateIds)].join(', ')}`);

  for (const image of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\salt="[^"]*"/.test(image[0])) fail(file, `image lacks alt text: ${image[0]}`);
  }

  for (const link of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const reference = link[1];
    if (/^(?:https?:|mailto:|data:|#)/.test(reference)) continue;
    const target = localTarget(reference);
    if (!fs.existsSync(target)) fail(file, `broken internal reference ${reference}`);
  }

  const jsonLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!jsonLd) {
    fail(file, 'missing JSON-LD');
  } else {
    try {
      JSON.parse(jsonLd[1]);
    } catch (error) {
      fail(file, `invalid JSON-LD: ${error.message}`);
    }
  }
}

for (const required of [
  'assets/files/desmond_boateng_CV.pdf',
  'assets/images/desmond-kofi-boateng.jpg',
  'assets/images/og-card.png',
  'robots.txt',
  'sitemap.xml'
]) {
  if (!fs.existsSync(path.join(destination, required))) fail(destination, `missing required artifact ${required}`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Validated ${htmlFiles.length} HTML pages and all internal references.`);
