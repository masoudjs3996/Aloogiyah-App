// Exercise the built admin app with isolated API data; no production request is sent.
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '..'), output = path.resolve(root, '../.tmp/admin-ui');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

function installFixtures() {
  sessionStorage.setItem('ag-admin-token', 'local-ui-fixture');
  const now = new Date().toISOString(); window.__requests = [];
  const points = [{ code: 'POINTA0001', name: 'میدان بار تهران', address: 'تهران، نشانی میدان مبدأ', hours: '۸ تا ۱۶', collectionTerms: 'دریافت با هماهنگی', isActive: true, countyId: 1, countyName: 'تهران', directFee: 20 }, { code: 'POINTB0002', name: 'میدان بار مشهد', address: 'مشهد، نشانی میدان دریافت', hours: '۸ تا ۱۶', collectionTerms: 'نگهداری تا زمان هماهنگ‌شده', isActive: true, countyId: 2, countyName: 'مشهد', directFee: 30 }];
  const booking = { code: 'BOOKTEST01', checkoutCode: 'BUYTEST001', method: 'Direct', window: 'با هماهنگی خریدار', point: 'میدان بار مشهد', address: JSON.stringify({ Recipient: 'خریدار آزمایشی', County: 'مشهد', Street: 'خیابان آزمایشی' }), destinationCode: 'POINTB0002', fee: 150, knownFee: 150, hasUnpricedLegs: false, deferredFeeLimit: null, heldDeliveryFee: 0, deferredFeePaid: null, quoteExpiresAt: now, requestedMethod: null, changeFee: null, changeReason: null, items: [{ itemCode: 'ITEMTEST01', orderCode: 'ORDER00001', name: 'گندم درجه دو', farmName: 'مزرعه گندم', quantity: 7, receivedAtOriginQuantity: 0, receivedAtHubQuantity: 0, deliveredQuantity: 0, allocatedQuantity: 0, originPoint: 'میدان بار تهران', originCode: 'POINTA0001', interHub: true, isPaid: true, orderStatus: '42A1657DE4' }], legs: [{ code: 'LEGTEST001', originCode: 'POINTA0001', kind: 'InterHub', route: 'میدان بار تهران ← میدان بار مشهد', fee: 120, transitDays: 2, status: 'Waiting' }, { code: 'LEGTEST002', originCode: 'POINTB0002', kind: 'Local', route: 'میدان بار مشهد ← نشانی خریدار', fee: 30, transitDays: 0, status: 'Waiting' }], batches: [], events: [] };
  window.__booking = booking;
  const tariffs = [{ code: 'TARIFF0001', categoryCode: 'CATGRADE01', name: 'گل شاخه‌ای / رز / درجه یک', saleUnit: 'Kilogram', blockSize: 50, pricePerBlock: 100000, needsReview: false }];

  const orders = [{ code: 'ORDER00001', checkoutCode: 'BUYTEST001', farmName: 'مزرعه گندم', statusTitle: 'ارسال‌شده', totalPrice: 1200000, paymentStatus: 'Paid', isPaid: true, refundStatus: 'None', allowedActions: [], orderItems: [{ code: 'ITEMTEST01', productName: 'گندم درجه دو', quantity: 7 }], history: [], address: { county: 'مشهد', street: 'خیابان آزمایشی' } }, { code: 'ORDER00002', checkoutCode: 'BUYTEST002', farmName: 'مزرعه دوم', statusTitle: 'ردشده', totalPrice: 200000, paymentStatus: 'Paid', refundStatus: 'Pending', allowedActions: ['CompleteRefund'], orderItems: [], history: [] }];
  const business = { code: 'BIZTEST001', businessType: 'Farmer', businessName: 'مزرعه نمونه', applicantName: 'کشاورز آزمایشی', phoneNumber: '09120000000', status: 'Pending', createdAt: now, version: 'v1', description: 'تولید محصولات کشاورزی', licenseNumber: '', address: { province: 'تهران', county: 'تهران', city: 'تهران', street: 'نشانی محل فعالیت', postalCode: '1234567890' }, termsAcceptance: { termsVersion: '1', acceptedAt: now, termsHash: 'fixture-terms' }, documents: [], history: [], reviewNote: null };
  const generic = { code: 'ROWTEST001', name: 'رکورد آزمایشی', title: 'مطلب آموزشی', content: 'متن نمونه برای بررسی نمایش جزئیات', description: 'توضیح کوتاه رکورد', fName: 'کاربر', lName: 'آزمایشی', farmName: 'گلخانه نمونه', userFullName: 'کشاورز نمونه', roleName: 'Farmer', phoneNumber: '09120000000', retailPrice: 100000, wholesalePrice: 80000, stock: 15, totalPrice: 100000, createdAt: now, statusCode: 'TESTSTATUS', isActive: true, isRead: false, qualityGrade: 'PENDING', history: [] };
  window.fetch = async (input, options = {}) => {
    const url = new URL(input instanceof URL ? input.href : typeof input === 'string' ? input : input.url, location.origin), p = url.pathname.replace(/^\/api/, ''), method = options.method ?? 'GET', body = options.body ? JSON.parse(options.body) : null;
    window.__requests.push({ path: p, method, body });
    let data;
    if (p === '/User/GetRole') data = { roleNames: ['Manager'] };
    else if (p === '/User/GetMyProfile') data = { user: { fName: 'مدیر', userName: 'manager' } };
    else if (p === '/Admin/Lookups') data = { statuses: [{ code: 'TESTSTATUS', name: 'فعال', entityStatus: 'FarmStatus' }], roles: [{ code: 'ROLE000001', name: 'Manager', description: 'مدیر ارشد' }], fileTypes: [] };
    else if (p === '/Admin/Dashboard') data = { pendingComments: 3, unassignedServices: 2, pendingQuality: 1, orders: 14, users: 25, farms: 8, products: 32, updatedAt: now };
    else if (p === '/Delivery/Points' && method === 'GET') data = points;
    else if (p === '/Delivery/Points') data = true;
    else if (p === '/Delivery/Counties') data = [{ id: 1, name: 'تهران' }, { id: 2, name: 'مشهد' }];
    else if (p === '/Delivery/Agents') data = [{ id: 42, name: 'نماینده تحویل' }];
    else if (p === '/Delivery/Routes' && method === 'GET') data = [{ code: 'ROUTETEST1', originCode: points[0].code, destinationCode: points[1].code, originName: points[0].name, destinationName: points[1].name, fee: null, pricingMode: 'CategoryUnits', tariffCount: tariffs.length, transitDays: 2, maxQuantity: null, isActive: true }];
    else if (p.endsWith('/TariffCategories')) data = [{ code:'CATGRADE01', name:'گل شاخه‌ای / رز / درجه یک' },{ code:'CATGRADE02', name:'گل شاخه‌ای / رز / درجه دو' }];
    else if (p.endsWith('/Tariffs') && method === 'GET') data = tariffs;
    else if (p.endsWith('/Tariffs') && method === 'PUT') { const current=tariffs.find(t=>t.categoryCode===body.categoryCode && t.saleUnit===body.saleUnit); if(current)Object.assign(current,body);else tariffs.push({code:'TARIFF0002',name:'گل شاخه‌ای / رز / درجه یک',needsReview:false,...body}); data=true; }
    else if (p === '/Delivery/Tariffs/Increase/Preview') data = { token:'tariff-preview', count:tariffs.length+1, categoryCount:tariffs.length,flatCount:1,items:[{code:'TARIFF0001',kind:'Category',category:tariffs[0].name,route:'تهران ← مشهد',oldPrice:100000,newPrice:110000}] };
    else if (p === '/Delivery/Tariffs/Increase/Apply') { assertFixture(body.percent===10 && body.expectedToken==='tariff-preview','Bulk tariff increase bypassed preview'); data={applied:true}; }
    else if (p === '/Delivery/Routes' || p.startsWith('/Delivery/Routes/')) data = true;
    else if (p === '/Delivery/Bookings') data = { items: [booking], totalCount: 1, pageNumber: 1, pageSize: 20 };
    else if (p === '/Delivery/Bookings/BOOKTEST01') data = booking;
    else if (p.endsWith('/Receive')) { if (body.stage === 'Origin') booking.items[0].receivedAtOriginQuantity += body.quantity; else { if (booking.legs[0].status !== 'InTransit') throw new Error('Destination receipt before dispatch'); booking.items[0].receivedAtHubQuantity += body.quantity; booking.legs[0].status = 'Arrived'; } data = true; }
    else if (p.endsWith('/Dispatch')) { assertFixture(booking.items[0].receivedAtOriginQuantity === 7, 'Dispatch before full receipt'); booking.legs[0].status = 'InTransit'; data = true; }
    else if (p.endsWith('/Batches') && method === 'POST') { assertFixture(body.items.length === 1 && body.items[0].quantity === 7, 'Incorrect whole purchase items'); booking.batches.push({ code: 'BATCHTEST1', agentId: body.agentId, expectedAt: body.expectedAt, status: 'Ready', note: null, completedAt: null, items: [{ itemCode: 'ITEMTEST01', orderCode: 'ORDER00001', farmName: 'مزرعه گندم', name: 'گندم درجه دو', quantity: 7 }] }); booking.items[0].allocatedQuantity = 7; data = true; }
    else if (p.endsWith('/Verify')) { assertFixture(body.code === '123456', 'Incorrect buyer code'); booking.items[0].deliveredQuantity = 7; booking.items[0].allocatedQuantity = 0; booking.batches[0].status = 'Completed'; data = true; }
    else if (p === '/AgriculturalOrder/GetByFilter') data = { items: orders, totalCount: 2, pageNumber: 1 };
    else if (p === '/AgriculturalOrder/GetByCode') data = orders.find(o => o.code === url.searchParams.get('code')) ?? orders[0];
    else if (p === '/AgriculturalOrder/ORDER00002/Refund/Complete') { assertFixture(body.reference === 'TEST-TRANSFER-001', 'Refund reference changed'); orders[1].refundStatus = 'Completed'; orders[1].allowedActions = []; data = orders[1]; }
    else if (p === '/Auth/RequestPhoneCode') data = { challengeCode: 'LOCAL-CHALLENGE' };
    else if (p === '/Checkout/BUYTEST001') data = { code: 'BUYTEST001', payableAmount: 1200000, deferredDeliveryFeeLimit: 0, isSubmitted: true, isPaid: true, paymentStatus: 'Paid', orders: [orders[0]] };
    else if (p === '/BusinessApplication/Admin') data = { items: [business], totalCount: 1 };
    else if (p === '/BusinessApplication/BIZTEST001') data = business;
    else if (p === '/Settlement/Manage') data = { items: [{ code: 'SETTLE0001', amount: 500000, status: 'Pending', accountHolder: 'کشاورز آزمایشی', iban: 'IR000000000000000000000000', createdAt: now, scheduledDate: '2026-11-07', paidAt: null, history: [], transferAttempts: [] }], totalCount: 1, pageNumber: 1 };
    else if (p === '/Settlement/Rates') data = { commissionRate: 5, taxRate: 0, reason: '' };
    else if (p === '/Settlement/Calendar') data = [];
    else if (p === '/Wallet/Capabilities') data = { onlinePaymentAvailable: false, automaticPayoutAvailable: false };
    else if (method === 'GET' && /ByCode|GetUserByCode/.test(p)) data = generic;
    else if (method === 'GET') data = { items: [generic], totalCount: 1, pageNumber: 1 };
    else throw new Error('Unplanned mutation: ' + method + ' ' + p);
    return new Response(JSON.stringify({ isSuccess: true, data: structuredClone(data) }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  function assertFixture(value, message) { if (!value) throw new Error(message); }
}

async function main() {
  await fs.mkdir(output, { recursive: true });
  const server = http.createServer(async (req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname), file = path.resolve(root, 'dist', '.' + (urlPath === '/' ? '/index.html' : urlPath));
    if (!file.startsWith(path.resolve(root, 'dist') + path.sep)) { res.writeHead(403).end(); return; }
    try { const content = await fs.readFile(file); res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.woff2') ? 'font/woff2' : 'text/html; charset=utf-8'); res.end(content); } catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', '--disable-background-networking', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', '--user-data-dir=' + path.join(output, 'profile-' + Date.now()), 'about:blank'], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
  let socket, inspect, browserErrors = [];
  try {
    const debug = await new Promise((resolve, reject) => { let output = ''; const timer = setTimeout(() => reject(new Error('Chrome start timeout')), 20000); browser.stderr.on('data', data => { output += data; const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/); if (match) { clearTimeout(timer); resolve(match[1]); } }); browser.on('error', reject); });
    const page = (await (await fetch('http://127.0.0.1:' + new URL(debug).port + '/json')).json()).find(p => p.type === 'page');
    socket = new WebSocket(page.webSocketDebuggerUrl); await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
    let sequence = 0; const pending = new Map(), errors = []; browserErrors = errors;
    socket.addEventListener('message', event => { const message = JSON.parse(event.data); if (message.id) { const entry = pending.get(message.id); pending.delete(message.id); message.error ? entry.reject(message.error) : entry.resolve(message.result); } else if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text); });
    const call = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
    const evaluate = async expression => { const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text); return result.result.value; };
    inspect = evaluate;
    async function waitFor(expression) { for (let n = 0; n < 100; n++) { if (await evaluate('Boolean(' + expression + ')')) return; await pause(100); } throw new Error('Timeout: ' + expression); }
    async function click(text, selector = 'main button') { await evaluate(`(()=>{const button=Array.from(document.querySelectorAll(${JSON.stringify(selector)})).find(b=>b.textContent.includes(${JSON.stringify(text)}));if(!button)throw new Error('Button missing: '+${JSON.stringify(text)});if(button.disabled)throw new Error('Button disabled: '+${JSON.stringify(text)});button.click();})()`); await pause(150); }
    async function set(selector, value, tag = 'HTMLInputElement') { await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw new Error('Input missing: '+${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(${tag}.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event(${tag === 'HTMLSelectElement' ? "'change'" : "'input'"},{bubbles:true}));})()`); await pause(100); }
    async function route(path) { await evaluate('location.hash=' + JSON.stringify('#' + path)); await waitFor('document.querySelector("main h1") && !document.querySelector(".loading")'); await pause(180); }
    async function screenshot(name, width) { await call('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 500 }); await pause(100); assert(await evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Page overflow: ' + name); const shot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }); await fs.writeFile(path.join(output, name + '.png'), Buffer.from(shot.data, 'base64')); }
    await call('Runtime.enable'); await call('Page.enable');
    await call('Page.addScriptToEvaluateOnNewDocument', { source: '(' + installFixtures.toString() + ')()' });
    await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    await call('Page.navigate', { url: 'http://127.0.0.1:' + server.address().port + '/#/' });
    await waitFor('document.querySelectorAll(".workflow-link").length===3'); await screenshot('dashboard-desktop', 1440); await screenshot('dashboard-mobile', 390);
    await route('/deliveries'); await waitFor('document.querySelector(".delivery-row")');
    assert(await evaluate('Array.from(document.querySelectorAll(".form-grid")).every(e=>!!e.closest("details:not([open])"))'), 'Setup forms clutter the delivery queue');
    await screenshot('delivery-queue-mobile', 390); await screenshot('delivery-queue-desktop', 1440);
    await click('رسیدگی', '.delivery-row button'); await waitFor('document.querySelectorAll(".delivery-item").length===1');
    assert(await evaluate('!Array.from(document.querySelectorAll("main input")).some(i=>i.getAttribute("aria-label")==="کد شش‌رقمی خریدار")'), 'Buyer code is mixed into arrival stage');
    assert(await evaluate('Array.from(document.querySelectorAll("main button")).find(b=>b.textContent.includes("ثبت اعزام")).disabled'), 'Dispatch enabled before origin receipt');
    await screenshot('delivery-arrival-desktop', 1440); await screenshot('delivery-arrival-mobile', 390);
    await set('input[aria-label="ورود به مبدأ گندم درجه دو"]', '7'); await click('ثبت ورود به مبدأ');
    await waitFor('window.__booking.items[0].receivedAtOriginQuantity===7'); await click('ثبت اعزام');
    await waitFor('window.__booking.legs[0].status==="InTransit"'); await set('input[aria-label="ورود به مقصد گندم درجه دو"]', '7'); await click('ثبت ورود به میدان دریافت');
    await waitFor('document.querySelector(".calendar-trigger")');
    await set('main select', '42', 'HTMLSelectElement'); await click('انتخاب روز از تقویم');
    await evaluate('document.querySelector(".calendar-grid button:not([disabled])").click()'); await pause(100); await set('input[type=time]', '23:59');
    await screenshot('delivery-schedule-mobile', 390); await click('ثبت نوبت و اطلاع');
    await waitFor('document.querySelector(".verify-box input")');
    await set('input[aria-label="کد شش‌رقمی خریدار"]', '۱۲۳۴۵۶'); await screenshot('delivery-verify-mobile', 390); await screenshot('delivery-verify-desktop', 1440);
    await click('تأیید تحویل واقعی'); await waitFor('window.__booking.items[0].deliveredQuantity===7 && document.body.innerText.includes("تحویل این خرید تکمیل شده")');
    assert(await evaluate('window.__requests.filter(r=>r.path.endsWith("/Verify")).length===1'), 'Verification submitted more than once');
    await route('/deliveries'); await click('میدان‌ها'); await waitFor('document.querySelectorAll(".record-card").length===2'); await click('افزودن میدان'); await waitFor('document.querySelector("dialog[open]")'); assert(await evaluate('document.querySelector("dialog").getAttribute("aria-labelledby")'), 'Dialog not labelled');
    await set('dialog .money-input input','۱۲۳۴۵۶۷');
    assert(await evaluate('document.querySelector("dialog .money-input input").value==="1,234,567"'),'Money grouping failed');
    await set('dialog .money-input input','0');assert(await evaluate('document.querySelector("dialog .money-input input").value==="0"'),'Zero fee lost');
    await set('dialog .money-input input','');assert(await evaluate('document.querySelector("dialog .money-input input").value===""'),'Blank fee became zero');
    await screenshot('delivery-field-modal', 1440);
    await set('dialog input[maxlength="150"]','میدان آزمایشی');await set('dialog select','1','HTMLSelectElement');await set('dialog textarea','نشانی میدان','HTMLTextAreaElement');await set('dialog input[maxlength="200"]','۸ تا ۱۶');await set('dialog .form-grid label:nth-child(6) textarea','دریافت با هماهنگی','HTMLTextAreaElement');await set('dialog .money-input input','۱٬۲۳۴٬۵۶۷');await click('ذخیره میدان','dialog button');await waitFor('!document.querySelector("dialog")');
    assert(await evaluate('window.__requests.findLast(r=>r.path==="/Delivery/Points" && r.method==="POST").body.directFee===1234567'),'Formatted amount corrupted API payload'); await click('مسیرها و تعرفه‌ها'); await waitFor('document.querySelector(".route-line")'); await screenshot('delivery-routes-desktop', 1440);
    await click('تعرفه دسته‌بندی‌ها'); await waitFor('document.querySelector("dialog select") && document.querySelector("dialog .record-card")');
    await set('dialog select','CATGRADE01','HTMLSelectElement'); await set('dialog select:nth-of-type(1)','CATGRADE01','HTMLSelectElement');
    await evaluate(`(()=>{const e=document.querySelectorAll('dialog select')[1];Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(e,'Package');e.dispatchEvent(new Event('change',{bubbles:true}));})()`); await pause(100);
    assert(await evaluate('document.querySelector("dialog input[type=number]").value==="20"'),'Package tariff did not suggest 20 units');
    await set('dialog .money-input input','۱۰۰۰۰۰');await click('ذخیره تعرفه دسته‌بندی','dialog button');
    await waitFor('window.__requests.some(r=>r.path.endsWith("/Tariffs") && r.method==="PUT")');
    assert(await evaluate('window.__requests.findLast(r=>r.path.endsWith("/Tariffs") && r.method==="PUT").body.categoryCode==="CATGRADE01" && window.__requests.findLast(r=>r.path.endsWith("/Tariffs") && r.method==="PUT").body.blockSize===20 && window.__requests.findLast(r=>r.path.endsWith("/Tariffs") && r.method==="PUT").body.pricePerBlock===100000'),'Category tariff payload was corrupted');
    await screenshot('category-tariffs-mobile',390);await evaluate('document.querySelector("dialog button[aria-label=بستن]").click()');
    await click('افزایش درصدی تعرفه‌ها');await click('پیش‌نمایش افزایش','dialog button');await waitFor('Array.from(document.querySelectorAll("dialog button")).some(b=>b.textContent.includes("تأیید افزایش"))');
    assert(await evaluate('!window.__requests.some(r=>r.path.endsWith("/Increase/Apply"))'),'Bulk increase applied before confirmation');
    await set('dialog input[type=number]','15');assert(await evaluate('!Array.from(document.querySelectorAll("dialog button")).some(b=>b.textContent.includes("تأیید افزایش"))'),'Percent change retained stale preview');
    await set('dialog input[type=number]','10');await click('پیش‌نمایش افزایش','dialog button');await waitFor('Array.from(document.querySelectorAll("dialog button")).some(b=>b.textContent.includes("تأیید افزایش"))');
    await screenshot('tariff-increase-mobile',390);await click('تأیید افزایش','dialog button');await waitFor('!document.querySelector("dialog")');
    await route('/manage/AgriculturalOrder'); await waitFor('document.querySelectorAll("tbody tr").length===2');
    assert(await evaluate('!document.querySelectorAll("tbody tr")[0].textContent.includes("تکمیل بازپرداخت")'), 'Refund offered on a non-refund order');
    assert(await evaluate('document.querySelectorAll("tbody tr")[1].textContent.includes("تکمیل بازپرداخت")'), 'Valid pending refund action was hidden');
    await screenshot('orders-desktop', 1440); await screenshot('orders-mobile', 390);
    assert(await evaluate('Array.from(document.querySelectorAll(".row-actions>.text-button")).every(e=>e.getBoundingClientRect().right<=innerWidth)'), 'Mobile record actions are outside the viewport');
    await evaluate('document.querySelectorAll("tbody tr")[1].querySelector(".row-menu").open=true');
    await click('تکمیل بازپرداخت', 'tbody tr:nth-child(2) button'); await waitFor('document.querySelector("dialog form")');
    assert(await evaluate('document.querySelectorAll("dialog input:not([type=checkbox])").length===1'), 'Bound record code remains editable');
    await set('dialog input:not([type=checkbox])', 'TEST-TRANSFER-001');
    await evaluate('document.querySelector("dialog form").dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}))'); await pause(150);
    assert(await evaluate('!window.__requests.some(r=>r.path.endsWith("/Refund/Complete"))'), 'Financial form submitted without confirmation');
    await evaluate('document.querySelector("dialog input[type=checkbox]").click()'); await pause(100);
    await click('تکمیل بازپرداخت', 'dialog button[type=submit]'); await waitFor('!document.querySelector("dialog")');
    assert(await evaluate('window.__requests.filter(r=>r.path==="/AgriculturalOrder/ORDER00002/Refund/Complete").length===1'), 'Refund form lost bound record identity');
    const resourceIds = ['Comment', 'ServiceRequest', 'QualityAssessment', 'User', 'Farm', 'AgriculturalProduct', 'Product', 'Category', 'Auction', 'AuctionBid', 'Discount', 'Warehouse', 'WarehouseInventory', 'Order', 'Article', 'Slider', 'ChatMessage', 'File', 'Notification', 'StatusChangeLog', 'Location'];
    for (const id of resourceIds) { await route('/manage/' + id); assert(await evaluate('!!document.querySelector("main h1") && !document.querySelector("main .error")'), 'Resource page failed: ' + id); assert(await evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Resource overflow: ' + id); }
    await route('/manage/Farm'); await click('مشاهده', '.row-actions button'); await waitFor('document.querySelector("dialog .detail-summary")'); assert(await evaluate('!!document.querySelector("dialog details")'), 'Record detail not grouped'); await evaluate('document.querySelector("dialog button[aria-label=بستن]").click()');
    await route('/settlements'); await waitFor('document.body.innerText.includes("تطبیق حساب و تأیید درخواست")'); assert(await evaluate('!document.querySelector("main input[type=number]")'), 'Rate form displayed in settlement queue'); await screenshot('settlements-mobile', 390); await click('کارمزد و مالیات'); await waitFor('document.body.innerText.includes("ذخیره نرخ‌ها")'); await click('تقویم و موعد پرداخت'); await waitFor('document.querySelectorAll("input[type=date]").length===2');
    await route('/business-applications'); await waitFor('document.querySelector(".business-list-item")'); await click('مزرعه نمونه', '.business-list-item'); await waitFor('document.querySelector(".business-review")'); await screenshot('business-mobile', 390); await screenshot('business-desktop', 1440);
    await route('/checkout?code=BUYTEST001'); await waitFor('document.querySelector(".checkout-order")'); await screenshot('checkout-desktop', 1440);
    await route('/settings'); await waitFor('document.body.innerText.includes("اطلاعات پایه دریافت شده")'); assert(await evaluate('document.querySelectorAll("main details[open]").length===0'), 'Technical settings expand by default');
    await screenshot('settings-mobile', 390); await evaluate('document.querySelector(".mobile-menu")?.click()');
    await set('.sidebar-search input', 'محصولات'); await waitFor('Array.from(document.querySelectorAll(".sidebar nav a")).some(a=>a.textContent.includes("محصولات کشاورزی"))');
    await evaluate('document.querySelector(".user-menu button").click()'); await waitFor('document.querySelector("#password")');
    await set('#password', 'local-password'); await click('', 'button[aria-label="نمایش رمز عبور"]');
    assert(await evaluate('document.querySelector("#password").type==="text" && document.querySelector("#password").value==="local-password"'), 'Password visibility lost the input');
    await screenshot('login-mobile', 390); await screenshot('login-desktop', 1440);
    await click('کد یک‌بارمصرف', 'button'); await set('#phone', '09120000000'); await click('دریافت کد ورود', 'button'); await waitFor('document.querySelector("#otp")');
    await set('#otp', '۱۲۳۴۵۶'); assert(await evaluate('document.querySelector("#otp").value==="123456"'), 'Persian sign-in code was not normalized');
    assert(errors.length === 0, 'Browser errors: ' + errors.join('\n'));
    console.log('PASS: built admin app, all 22 resource pages, dashboard, delivery setup, origin/dispatch/destination/schedule/buyer-code flow, financial action visibility, settlement tabs, collaboration, checkout, settings, menu search and desktop/mobile overflow.');
  } catch (error) { console.error('Page diagnostics:', inspect ? await inspect('({text:document.body?.innerText?.slice(0,2000),requests:window.__requests?.slice(-5)})') : null, browserErrors); throw error;
  } finally { socket?.close(); browser.kill(); await new Promise(resolve => server.close(resolve)); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
