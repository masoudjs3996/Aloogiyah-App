import { request } from './platform';
import type { DeliveryBooking, DeliveryCode, DeliveryPage, DeliveryPoint } from '../shared/types/delivery';
const path = (code: string) => `/Delivery/Bookings/${encodeURIComponent(code)}`;
export const deliveryApi = {
  destinations: (cartId: string) => request<DeliveryPoint[]>("/Delivery/Destinations", { params: { cartId } }),
  purchaseCode: (code: string) => request<{code: string}>(`${path(code)}/PurchaseCode`),
  preview: (cartId: string, method: string) => request<{ pointCode: string; name: string; address: string; hours: string; fee: number | null; farmNames: string[] }[]>("/Delivery/Preview", { params: { cartId, method } }),
  points: () => request<DeliveryPoint[]>('/Delivery/Points'),
  quote: (data: { cartId: string; addressCode: string; pointCode?: string; method: string; window: string }) => request<DeliveryBooking>('/Delivery/Quotes', { method: 'POST', data }),
  get: (code: string) => request<DeliveryBooking>(path(code)),
  list: (checkout?: string) => request<DeliveryPage>('/Delivery/Bookings', { params: { checkout } }),
  code: (code: string, batch: string) => request<DeliveryCode>(`${path(code)}/Batches/${encodeURIComponent(batch)}/Code`, { method: 'POST' }),
  dispute: (code: string, batch: string, note: string) => request(`${path(code)}/Batches/${encodeURIComponent(batch)}/Actions/Dispute`, { method: 'POST', data: { note } }),
  change: (code: string, method: string, reason: string) => request(`${path(code)}/Change`, { method: 'POST', data: { method, reason } }),
  acceptDeferredFee: (code: string, fee: number) => request(`${path(code)}/DeferredFee/Accept`, { method: "POST", data: { fee } }),
  acceptChange: (code: string, fee: number) => request(`${path(code)}/Change/Accept`, { method: 'POST', data: { fee } }),
  cancelChange: (code: string) => request(`${path(code)}/Change/Cancel`, { method: 'POST' }),
};
