import { mediaUrl } from '../../shared/utils/media';
import { useQuery } from '@tanstack/react-query';
import { execute } from '../../shared/api/client';
import { detailEndpoint } from '../../features/resources';
import type { Resource, Row } from '../../shared/types';
import { display, label } from '../../shared/utils/labels';
import Modal from '../molecules/Modal';
import ErrorState from '../molecules/ErrorState';

export function Values({ value }: { value: Row }) {
  return <dl className="detail-grid">{Object.entries(value).filter(([key]) => !['reportFileUrl', 'reportJson'].includes(key)).map(([key, v]) => <div key={key} className={typeof v === 'object' && v ? 'wide' : ''}><dt>{label(key)}</dt><dd>{Array.isArray(v) ? v.length ? v.map((item, index) => <div className="nested" key={index}>{item && typeof item === 'object' ? <Values value={item} /> : display(item)}</div>) : '—' : v && typeof v === 'object' ? <Values value={v} /> : typeof v === 'string' && ['url', 'imageUrl', 'fileUrl', 'reportFileUrl'].includes(key) && mediaUrl(v) ? <div><a href={mediaUrl(v)!} target="_blank" rel="noreferrer" className="text-button">مشاهده فایل</a>{/\.(png|jpe?g|webp|gif)(\?|$)/i.test(v) && <img src={mediaUrl(v)!} alt="تصویر رکورد" className="media-preview" />}</div> : <span className={key.toLowerCase().includes('code') ? 'code' : ''}>{display(v, key)}</span>}</dd></div>)}</dl>;
}
export function RecordSections({ resource, value }: { resource: Resource; value: Row }) {
  const entries = Object.entries(value).filter(([key]) => !['reportFileUrl', 'reportJson'].includes(key));
  const primaryKeys = [...new Set([...resource.columns, 'statusTitle', 'paymentStatus', 'refundStatus'])];
  const primary = entries.filter(([key, v]) => primaryKeys.includes(key) && (v == null || typeof v !== 'object'));
  const extra = entries.filter(([key, v]) => !primaryKeys.includes(key) && (v == null || typeof v !== 'object'));
  const groups = entries.filter(([, v]) => v != null && typeof v === 'object');
  return <><div className="detail-summary"><Values value={Object.fromEntries(primary)} /></div>{groups.map(([key, v]) => <details key={key} className="disclosure detail-section"><summary>{label(key)}{Array.isArray(v) ? ` (${v.length.toLocaleString('fa-IR')})` : ''}</summary><div className="disclosure-body">{Array.isArray(v) ? v.length ? v.map((item, index) => <div className="nested" key={index}>{item && typeof item === 'object' ? <Values value={item} /> : display(item)}</div>) : <p className="subtle">موردی ثبت نشده است.</p> : <Values value={v} />}</div></details>)}{extra.length > 0 && <details className="disclosure detail-section"><summary>اطلاعات بیشتر و شناسه‌ها</summary><div className="disclosure-body"><Values value={Object.fromEntries(extra)} /></div></details>}</>;
}
export default function RecordDetail({ resource, record, onClose, actions }: { resource: Resource; record: Row; onClose: () => void; actions?: (row: Row) => React.ReactNode }) {
  const e = detailEndpoint(resource);
  const q = useQuery({ queryKey: ['detail', resource.id, record.code], queryFn: () => e ? execute(e, { code: record.code, notificationCode: record.code }) : Promise.resolve(record) });
  const data = q.data || record;
  return <Modal title={'جزئیات ' + resource.title} onClose={onClose}>{q.isLoading ? <p>در حال دریافت…</p> : q.error ? <ErrorState error={q.error} retry={() => void q.refetch()} /> : <><RecordSections resource={resource} value={data} />{actions && <div className="modal-actions">{actions(data)}</div>}</>}</Modal>;
}
