import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Button from '../design-system/atoms/Button';
import PageIntro from '../design-system/molecules/PageIntro';
import { downloadPrivate, request } from '../shared/api/client';

type Report = {
  id: number;
  productCode?: string;
  productName?: string;
  productRemoved?: boolean;
  messageCode?: string;
  messageText?: string;
  messageRemoved?: boolean;
  senderCode?: string;
  attachmentName?: string;
  reason: string;
  createdAt: string;
  reviewedAt?: string;
};

export default function ProductReportsPage() {
  const client = useQueryClient();
  const [kind, setKind] = useState<'listing' | 'chat'>('listing');
  const [downloading, setDownloading] = useState(false);
  const chat = kind === 'chat';
  const endpoint = chat ? '/ChatReport' : '/ProductReport';
  const [reviewed, setReviewed] = useState(false);
  const [page, setPage] = useState(1);
  const reports = useQuery<{ items: Report[]; totalCount: number; pageSize: number }>({
    queryKey: ['content-reports', kind, reviewed, page],
    queryFn: ({ signal }) => request(endpoint, 'GET', undefined, { reviewed, page }, signal),
  });
  const review = useMutation({
    mutationFn: ({ id, remove }: { id: number; remove: boolean }) =>
      request(`${endpoint}/${id}/Review`, 'PATCH', undefined, chat ? { removeMessage: remove } : { removeListing: remove }),
    onSuccess: async () => {
      setPage(1);
      await client.invalidateQueries({ queryKey: ['content-reports'] });
      toast.success('رسیدگی به گزارش ثبت شد.');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function downloadAttachment(item: Report) {
    setDownloading(true);
    try {
      const blob = await downloadPrivate(`/ChatReport/${item.id}/Attachment`);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = item.attachmentName || 'attachment';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <PageIntro eyebrow="رسیدگی" title="گزارش آگهی‌ها و پیام‌ها" description="گزارش را بررسی کنید و در صورت تخلف، آگهی یا پیام گزارش‌شده را حذف کنید." />
      <section className="panel">
        <label>
          نوع گزارش
          <select value={kind} onChange={(event) => { setKind(event.target.value === 'chat' ? 'chat' : 'listing'); setPage(1); }}>
            <option value="listing">آگهی‌ها</option>
            <option value="chat">پیام‌های گفت‌وگو</option>
          </select>
        </label>
        <label>
          وضعیت گزارش
          <select value={String(reviewed)} onChange={(event) => {
            setReviewed(event.target.value === 'true');
            setPage(1);
          }}>
            <option value="false">در انتظار بررسی</option>
            <option value="true">بررسی‌شده</option>
          </select>
        </label>
        {reports.isPending && <p role="status">در حال دریافت گزارش‌ها…</p>}
        {reports.isError && <p role="alert">{reports.error.message} <Button variant="secondary" onClick={() => void reports.refetch()}>تلاش دوباره</Button></p>}
        {reports.data?.items.length === 0 && <p>گزارشی در این بخش وجود ندارد.</p>}
      </section>
      {reports.data?.items.map((item) => (
        <article className="panel" key={item.id} style={{ marginTop: 12 }}>
          <h2>{chat ? 'پیام گزارش‌شده' : item.productName}</h2>
          {chat ? <>
            <p>کد پیام <bdi>{item.messageCode}</bdi> · کد فرستنده <bdi>{item.senderCode}</bdi></p>
            <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{item.messageText || 'متن پیام در دسترس نیست.'}</p>
            {item.attachmentName && <Button variant="secondary" disabled={downloading} onClick={() => void downloadAttachment(item)}>دریافت پیوست گزارش‌شده</Button>}
          </> : <>
            <p>کد آگهی <bdi>{item.productCode}</bdi></p>
            {!!item.productCode && !item.productRemoved && <a href={`https://aloogiyah.ir/product/${encodeURIComponent(item.productCode)}`} target="_blank" rel="noreferrer">مشاهدهٔ آگهی</a>}
          </>}
          <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{item.reason}</p>
          <p>زمان ثبت {new Date(item.createdAt).toLocaleString('fa-IR-u-ca-persian')}</p>
          {(item.messageRemoved || item.productRemoved) && <p>محتوای گزارش‌شده حذف شده است.</p>}
          {item.reviewedAt ? (
            <p>زمان بررسی {new Date(item.reviewedAt).toLocaleString('fa-IR-u-ca-persian')}</p>
          ) : (
            <div className="toolbar">
              <Button variant="secondary" disabled={review.isPending} onClick={() => review.mutate({ id: item.id, remove: false })}>ثبت بررسی</Button>
              {!(item.messageRemoved || item.productRemoved) && <Button variant="secondary" disabled={review.isPending} onClick={() => {
                if (window.confirm(chat ? 'پیام گزارش‌شده از گفت‌وگو حذف شود؟' : 'آگهی گزارش‌شده از سایت و اپ حذف شود؟'))
                  review.mutate({ id: item.id, remove: true });
              }}>{chat ? 'حذف پیام و ثبت بررسی' : 'حذف آگهی و ثبت بررسی'}</Button>}
            </div>
          )}
        </article>
      ))}
      {reports.data && (page > 1 || reports.data.totalCount > reports.data.pageSize) && (
        <nav aria-label="صفحه‌بندی گزارش‌ها" style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>صفحه قبل</Button>
          <Button variant="secondary" disabled={page * reports.data.pageSize >= reports.data.totalCount} onClick={() => setPage(page + 1)}>صفحه بعد</Button>
        </nav>
      )}
    </>
  );
}
