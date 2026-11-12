const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const local = createRequire(path.resolve(__dirname, '../package.json'));
const ts = local('typescript');
function load(file, aliases = {}) {
  const exports = {}, module = { exports };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  new Function('exports', 'require', 'module', code)(exports, name => aliases[name] ?? local(name), module);
  return module.exports;
}
const root = path.resolve(__dirname, '../..');
const web = load(path.join(root, 'frontend/src/shared/constants/order-statuses.ts'));
const mobile = load(path.join(root, 'frontend-mobile/src/shared/order-statuses.ts'));
const shipped = { statusCode: '42A1657DE4', statusTitle: 'ارسال‌شده', history: [{ action: 'Ship' }] };
const items = [{ quantity: 5, receivedAtHubQuantity: 5 }, { quantity: 3, receivedAtHubQuantity: 3 }];
for (const engine of [web, mobile]) {
  assert.equal(engine.orderTrackingState({ ...shipped, orderItems: items }).current, 4);
  assert.equal(engine.orderTrackingState({ ...shipped, orderItems: items }).delivered, false);
  assert.equal(engine.orderTrackingState({ ...shipped, orderItems: [items[0], { quantity: 3, receivedAtHubQuantity: 2 }] }).current, 3);
  assert.equal(engine.orderTrackingState({ ...shipped, orderItems: [{ quantity: 5, receivedAtOriginQuantity: 5 }] }).current, 3);
  assert.equal(engine.orderTrackingState({ ...shipped, orderItems: [] }).current, 3);
  assert.equal(engine.orderTrackingState(shipped).current, 3);
  assert.equal(engine.orderTrackingState({ ...shipped, statusCode: '70972F464D', orderItems: items }).delivered, true);
  assert.equal(engine.orderTrackingState({ ...shipped, statusCode: '92494C9290', orderItems: items }).reached, 3);
}
const Timeline = load(path.join(root, 'frontend/src/design-system/molecules/platform/OrderTimeline.tsx'), { '@/shared/constants/order-statuses': web }).default;
const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
const render = order => renderToStaticMarkup(React.createElement(Timeline, { order })).match(/<li\b[\s\S]*?<\/li>/g);
const arrived = render({ ...shipped, orderItems: items });
assert(arrived[3].includes('bg-emerald-600') && arrived[3].includes('انجام‌شده'));
assert(arrived[4].includes('مرحله فعلی') && !arrived[4].includes('bg-emerald-600'));
assert(render({ ...shipped, statusCode: '70972F464D', orderItems: items }).every(step => step.includes('bg-emerald-600') && step.includes('انجام‌شده')));
console.log('PASS: web/mobile tracking uses full destination receipt, excludes partial/origin receipts, keeps delivery pending until verified, preserves stopped orders, and renders all-green only after delivery.');
