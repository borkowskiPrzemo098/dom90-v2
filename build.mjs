// Składa strony z src/pages + src/partials do katalogu głównego (GitHub Pages serwuje root).
// Użycie: node build.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const partial = (n) => readFileSync(`src/partials/${n}.html`, 'utf8');
const head = partial('head');
const header = partial('header');
const footer = partial('footer');

for (const file of readdirSync('src/pages').filter((f) => f.endsWith('.html'))) {
  const src = readFileSync(`src/pages/${file}`, 'utf8');
  // Pierwsza linia strony: <!-- meta: {"title": "...", "description": "...", "nav": "cennik"} -->
  const meta = JSON.parse(src.match(/^<!-- meta: (.*?) -->/)[1]);
  const body = src.replace(/^<!-- meta: .*? -->\r?\n/, '');
  const slug = file.replace('.html', '');
  const url = `https://dom90.com/${slug === 'index' ? '' : slug + '/'}`;

  let navHtml = header.replace(`data-nav="${meta.nav}"`, `data-nav="${meta.nav}" aria-current="page"`);

  const html = head
    .replaceAll('{{title}}', meta.title)
    .replaceAll('{{description}}', meta.description)
    .replaceAll('{{url}}', url)
    .replace('{{extraHead}}', meta.extraHead || '')
    + navHtml + body + footer;

  writeFileSync(file, html);
  console.log('zbudowano', file);
}
