import type { DeliveryBooking, DeliveryLine } from '../types/delivery';
export const money = (amount: number | null | undefined) => amount == null ? 'هنوز مشخص نشده' : amount.toLocaleString('fa-IR') + ' تومان';
export const activeBatch = (status: string) => ['Ready', 'OutForDelivery', 'Disputed'].includes(status);
export const shipped = (line: DeliveryLine) => line.isPaid !== false && (!line.orderStatus || line.orderStatus === '42A1657DE4');
export const completed = (b: DeliveryBooking) => b.items.length > 0 && b.items.every(i => i.deliveredQuantity >= i.quantity);
export const feePending = (b: DeliveryBooking) => b.deferredFeeLimit != null && b.deferredFeePaid == null;
export const readyForBatch = (b: DeliveryBooking) => !!b.checkoutCode && b.items.length > 0 && !b.requestedMethod && !feePending(b) && !b.batches.some(x => activeBatch(x.status)) &&
  b.items.some(i => i.deliveredQuantity < i.quantity) && b.items.every(i => shipped(i) && i.receivedAtHubQuantity >= i.quantity);
export const lineState = (i: DeliveryLine) => i.isPaid === false ? 'در انتظار تأیید مزرعه و پرداخت' : i.orderStatus && i.orderStatus !== '42A1657DE4' && i.orderStatus !== '70972F464D' ? 'در انتظار ثبت ارسال کشاورز' : i.deliveredQuantity >= i.quantity ? 'تحویل‌شده به خریدار' : i.receivedAtHubQuantity >= i.quantity ? 'رسیده به میدان دریافت' : 'در مسیر آماده‌سازی و دریافت';
export function nextStep(b: DeliveryBooking): { title: string; description: string; tab: 'arrival' | 'handover' | 'fees' | 'info'; progress: number } {
  if (!b.checkoutCode) return { title: 'منتظر ثبت خرید خریدار', description: 'این مورد استعلام هزینه است. اگر بخش بدون قیمت دارد، هزینه آن را تعیین کنید؛ ورود و تحویل پس از ثبت سفارش انجام می‌شود.', tab: 'fees', progress: 0 };
  if (completed(b)) return { title: 'تحویل این خرید تکمیل شده است', description: 'همه اقلام ثبت‌شده به خریدار تحویل شده‌اند. جزئیات و سابقه عملیات در دسترس است.', tab: 'info', progress: 3 };
  if (b.batches.some(x => x.status === 'Disputed')) return { title: 'مشکل تحویل را بررسی کنید', description: 'خریدار مشکل گزارش کرده است. نتیجه بررسی و توضیح لازم را در بخش تحویل ثبت کنید.', tab: 'handover', progress: 2 };
  if (b.batches.some(x => ['Ready', 'OutForDelivery'].includes(x.status))) return { title: 'تحویل نهایی به خریدار', description: 'فقط پس از دریافت و بررسی کامل اقلام توسط خریدار، کد شش‌رقمی او را ثبت کنید.', tab: 'handover', progress: 2 };
  if (b.requestedMethod) return { title: 'درخواست تغییر روش دریافت', description: 'هزینه اضافه را تعیین کنید و منتظر تأیید خریدار بمانید؛ سپس نوبت تحویل را ثبت کنید.', tab: 'fees', progress: 0 };
  if (!b.items.length || b.items.some(i => !shipped(i) && i.deliveredQuantity < i.quantity)) return { title: 'منتظر تأیید و ارسال مزرعه', description: 'ابتدا کشاورز باید سفارش خود را تأیید و ارسال کند. رسیدن واقعی بار را پس از آن ثبت کنید.', tab: 'arrival', progress: 0 };
  if (b.items.some(i => i.interHub && (i.receivedAtOriginQuantity ?? 0) < i.quantity)) return { title: 'ورود بار به میدان مبدأ را ثبت کنید', description: 'برای هر محصول، فقط تعداد واقعاً رسیده به مبدأ را وارد کنید. پس از ورود کامل، اعزام مسیر ثبت می‌شود.', tab: 'arrival', progress: 0 };
  if (feePending(b)) return { title: 'هزینه نامشخص حمل را نهایی کنید', description: 'تا سقف تأییدشده از رزرو تسویه می‌شود. هزینه بیشتر به تأیید خریدار نیاز دارد؛ تا آن زمان اعزام انجام نمی‌شود.', tab: 'fees', progress: 0 };
  if (b.legs?.some(l => l.kind === 'InterHub' && l.status === 'Waiting')) return { title: 'اعزام از میدان مبدأ را ثبت کنید', description: 'بعد از خروج واقعی بار، «ثبت اعزام» را بزنید. پس از رسیدن به مقصد، تعداد دریافتی را ثبت کنید.', tab: 'arrival', progress: 0 };
  if (b.items.some(i => i.receivedAtHubQuantity < i.quantity)) return { title: 'رسیدن به میدان دریافت را ثبت کنید', description: 'برای ورود به میدان کد خریدار لازم نیست. کد فقط هنگام تحویل نهایی بار به خریدار استفاده می‌شود.', tab: 'arrival', progress: 0 };
  return { title: 'نوبت تحویل خریدار را ثبت کنید', description: 'بعد از رسیدن همه اقلام، نماینده و زمان هماهنگ‌شده را انتخاب کنید تا خریدار مطلع شود.', tab: 'handover', progress: 1 };
}
export function bookingState(b: DeliveryBooking) {
  if (!b.checkoutCode) return { label: 'استعلام هزینه', tone: 'blue' };
  if (completed(b)) return { label: 'تحویل تکمیل شد', tone: 'green' };
  if (b.batches.some(x => x.status === 'Disputed')) return { label: 'نیازمند بررسی', tone: 'red' };
  if (b.requestedMethod || feePending(b) || b.fee == null) return { label: 'رسیدگی به هزینه', tone: 'amber' };
  if (b.batches.some(x => ['Ready', 'OutForDelivery'].includes(x.status))) return { label: 'نوبت تحویل ثبت شده', tone: 'green' };
  return { label: 'در حال آماده‌سازی', tone: '' };
}
