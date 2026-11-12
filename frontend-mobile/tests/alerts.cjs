const assert = require('node:assert/strict');
const esbuild = require('../../admin-panel/node_modules/esbuild');
const path = require('node:path');
async function main() {
  const result = await esbuild.build({ entryPoints: [path.join(__dirname, '../src/shared/alerts.ts')], bundle: true, platform: 'node', format: 'cjs', write: false });
  const module = { exports: {} }; new Function('module', 'exports', result.outputFiles[0].text)(module, module.exports);
  const { appAlert, alertStore, toastStore, alertLayers } = module.exports;
  let calls = 0;
  appAlert.alert('انجام شد', 'سفارش تأیید شد', undefined, { tone: 'success' });
  assert.equal(alertStore.snapshot(), null); assert.equal(toastStore.snapshot().tone, 'success');
  const first = toastStore.snapshot().id;
  appAlert.alert('حذف محصول', 'حذف شود؟', [{ text: 'انصراف', style: 'cancel' }, { text: 'حذف', style: 'destructive', onPress: () => calls++ }]);
  assert.equal(alertStore.snapshot().tone, 'confirm'); assert.equal(calls, 0);
  assert.equal(toastStore.snapshot().id, first);
  const id = alertStore.snapshot().id, button = alertStore.snapshot().buttons[1];
  if (alertStore.dismiss(id)) button.onPress(); if (alertStore.dismiss(id)) button.onPress();
  assert.equal(calls, 1);
  assert.equal(toastStore.dismiss(first), true); assert.equal(toastStore.dismiss(first), false);
  appAlert.alert('خطا', 'موجودی کافی نیست', undefined, { tone: 'error' });
  assert.equal(alertStore.snapshot(), null); assert.equal(toastStore.snapshot().tone, 'error');
  toastStore.dismiss(toastStore.snapshot().id);
  appAlert.alert('اطلاعات', 'ادامه', [{ text: 'بازکردن صفحه', onPress: () => calls++ }]);
  assert.ok(alertStore.snapshot()); assert.equal(toastStore.snapshot(), null); assert.equal(calls, 1);
  alertStore.dismiss(alertStore.snapshot().id);
  appAlert.alert('تأیید', '', undefined, { tone: 'confirm' }); assert.ok(alertStore.snapshot()); alertStore.dismiss(alertStore.snapshot().id);
  const form = Symbol('form'), nested = Symbol('nested'); const closeForm = alertLayers.register(form), closeNested = alertLayers.register(nested);
  assert.equal(alertLayers.snapshot(), nested); closeNested(); assert.equal(alertLayers.snapshot(), form); closeForm(); assert.equal(alertLayers.snapshot(), undefined);
  for (let i = 0; i < 10; i++) appAlert.alert('پیام', String(i));
  let count = 0; while (toastStore.snapshot()) { count++; toastStore.dismiss(toastStore.snapshot().id); }
  assert.equal(count, 4);
  console.log('PASS: nonblocking success/error messages, preserved confirmations and callbacks, one-time destructive actions, bounded queue and nested modal routing.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
