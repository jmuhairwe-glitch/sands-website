import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Render the actual client component on the server, with its server-page inputs.
// No browser, database credentials or customer submissions are required.
function loadTs(filename) {
  const file = path.resolve(filename);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const nativeRequire = createRequire(file);
  const localRequire = name => {
    if (name.endsWith('.css')) return {};
    if (name.startsWith('.')) {
      const target = path.resolve(path.dirname(file), name);
      for (const suffix of ['.ts', '.tsx']) if (fs.existsSync(target + suffix)) return loadTs(target + suffix);
    }
    return nativeRequire(name);
  };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(localRequire, module, module.exports);
  return module.exports;
}

const { default: Enquiry, trainingCost } = loadTs('app/enquire/Enquiry.tsx');
const { default: EnquiryPage } = loadTs('app/enquire/page.tsx');
const { enquiryTopics } = loadTs('lib/enquiry-topics.ts');
const { servicePages } = loadTs('lib/service-pages.ts');
const { default: sitemap } = loadTs('app/sitemap.ts');

for (const topic of enquiryTopics) {
  const element = await EnquiryPage({ searchParams: Promise.resolve({ topic, species: 'Tilapia' }) });
  assert.equal(element.props.initialTopic, topic);
  const markup = renderToStaticMarkup(React.createElement(Enquiry, element.props));
  assert.ok(markup.includes(`<h2>${topic.replaceAll('&', '&amp;')}</h2>`), `Initial HTML topic: ${topic}`);
  if (topic === 'Fingerlings') {
    assert.ok(!markup.includes('<h2>Training</h2>'));
    assert.match(markup, /<option selected="">Tilapia<\/option>/);
    assert.match(markup, /UGX 500 each/);
  }
  if (topic === 'Fish feeds') {
    assert.match(markup, /both floating and sinking feeds/);
    assert.match(markup, /<option>Floating<\/option>/);
    assert.match(markup, /<option>Sinking<\/option>/);
    assert.match(markup, /final price/);
  }
}
for (const topic of ['unknown', ['Fingerlings', 'Training'], undefined]) {
  const element = await EnquiryPage({ searchParams: Promise.resolve({ topic }) });
  assert.equal(element.props.initialTopic, 'Training');
}
assert.equal(trainingCost('One-day practical', 4), 350000);
assert.equal(trainingCost('Two-week residential', 4), 4900000);
assert.equal(trainingCost('One-day practical', 3), 300000);
assert.equal(trainingCost('One-day practical', 11), null);
assert.equal(trainingCost('Two-month hatchery', 1), null);

const urls = sitemap().map(item => item.url);
assert.equal(urls.length, 9);
assert.equal(new Set(servicePages.map(page => page.slug)).size, 6);
assert.equal(new Set(servicePages.map(page => page.title)).size, 6);
for (const page of servicePages) {
  assert.ok(urls.includes(`https://sands.co.ug/${page.slug}`));
  const query = Object.fromEntries(new URL(page.enquiry, 'https://sands.co.ug').searchParams);
  const element = await EnquiryPage({ searchParams: Promise.resolve(query) });
  assert.equal(element.props.initialTopic, query.topic);
  if (query.species) assert.equal(element.props.initialSpecies, query.species);
}
assert.ok(urls.every(url => !/\/(feeding|costs|api)(\/|$)/.test(url)));
console.log('Passed: server-rendered enquiry topics/species, custom floating/sinking options, existing training totals, six linked service pages and public-only sitemap.');
