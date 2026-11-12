import { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import DOMPurify from 'dompurify';
import 'quill/dist/quill.snow.css';
import './ArticleEditor.css';
import { request } from '../../shared/api/client';
import { mediaUrl } from '../../shared/utils/media';
import { useLookups } from '../../hooks/useLookups';

export default function ArticleEditor({ value, onChange, required, recordCode }: {
  value: string; onChange: (value: string) => void; required: boolean; recordCode?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const editor = useRef<Quill>();
  const fileInput = useRef<HTMLInputElement>(null);
  const callback = useRef(onChange); callback.current = onChange;
  const lookup = useLookups();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fileType, setFileType] = useState('');
  const position = useRef(0);
  const lastHtml = useRef('');
  useEffect(() => {
    if (!host.current) return;
    const container = document.createElement('div'); host.current.append(container);
    const quill = new Quill(container, {
      theme: 'snow', placeholder: 'متن مقاله را اینجا بنویسید…',
      formats: ['header', 'bold', 'italic', 'underline', 'strike', 'color', 'background', 'blockquote', 'list', 'align', 'direction', 'link', 'image'],
      modules: { toolbar: [[{ header: [2, 3, false] }], ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }], ['blockquote', 'link', 'image'],
        [{ align: [] }, { direction: 'rtl' }], ['clean']], history: { userOnly: true } },
    });
    editor.current = quill;
    quill.root.id = 'content'; quill.root.setAttribute('aria-label', 'متن مقاله');
    const toolbar = quill.getModule('toolbar') as { addHandler: (name: string, handler: () => void) => void };
    toolbar.addHandler('image', () => {
      position.current = quill.getSelection(true)?.index ?? quill.getLength() - 1;
      fileInput.current?.click();
    });
    const titles: Record<string, string> = { bold: 'پررنگ', italic: 'مورب', underline: 'زیرخط', strike: 'خط‌خورده', blockquote: 'نقل‌قول', link: 'لینک', image: 'درج عکس از دستگاه', clean: 'پاک‌کردن قالب', list: 'فهرست', direction: 'جهت متن' };
    host.current.querySelectorAll('button').forEach(button => {
      button.type = 'button';
      const key = Object.keys(titles).find(name => button.classList.contains('ql-' + name));
      if (key) { button.title = titles[key]; button.setAttribute('aria-label', titles[key]); }
    });
    for (const [name, title] of [['color', 'رنگ نوشته'], ['background', 'رنگ پس‌زمینهٔ متن']]) {
      const picker = host.current.querySelector(`.ql-${name} .ql-picker-label`);
      picker?.setAttribute('aria-label', title);
      picker?.setAttribute('title', title);
    }
    const changed = () => {
      const html = quill.getText().trim() || quill.root.querySelector('img') ? quill.getSemanticHTML() : '';
      lastHtml.current = html; callback.current(html);
    };
    quill.on('text-change', changed);
    return () => { quill.off('text-change', changed); editor.current = undefined; host.current?.replaceChildren(); lastHtml.current = ''; };
  }, []);
  useEffect(() => {
    const quill = editor.current;
    if (!quill || value === lastHtml.current) return;
    if (/<[a-z][\s\S]*>/i.test(value)) quill.clipboard.dangerouslyPasteHTML(DOMPurify.sanitize(value), 'silent');
    else quill.setText(value || '', 'silent');
    lastHtml.current = value;
  }, [value]);
  async function upload(file?: File) {
    if (!file || !editor.current) return;
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type) || file.size > 15 * 1024 * 1024) {
      setError('تصویر JPG، PNG، WEBP یا GIF تا ۱۵ مگابایت انتخاب کنید.'); return;
    }
    const type = fileType || lookup.data?.fileTypes?.[0]?.code;
    if (!type) { setError('ابتدا نوع فایل تصویر را انتخاب کنید.'); return; }
    setBusy(true); setError('');
    const quill = editor.current; quill.enable(false);
    try {
      const body = new FormData();
      body.append('File', file); body.append('FileTypeCode', type); body.append('EntityFile', '4');
      if (recordCode) body.append('EntityCode', recordCode);
      const result = await request('/File/UploadFile', 'POST', body);
      const url = mediaUrl(result.url);
      if (!url) throw new Error('نشانی تصویر دریافتی معتبر نیست.');
      if (editor.current !== quill) return;
      quill.enable();
      const index = Math.min(position.current, quill.getLength() - 1);
      quill.insertEmbed(index, 'image', url, 'user'); quill.insertText(index + 1, '\n', 'user'); quill.setSelection(index + 2, 0);
    } catch (err) { setError(err instanceof Error ? err.message : 'بارگذاری عکس انجام نشد.'); }
    finally { quill.enable(); setBusy(false); }
  }
  return <div className="article-editor" aria-busy={busy}>
    <p>برای درج عکس، مکان دلخواه متن را انتخاب کنید و دکمهٔ تصویر را بزنید.</p>
    <label>نوع فایل تصویر <select value={fileType} onChange={e => setFileType(e.target.value)}>
      <option value="">{lookup.isLoading ? 'در حال دریافت…' : 'پیش‌فرض'}</option>
      {lookup.data?.fileTypes?.map(type => <option key={type.code} value={type.code}>{type.name}</option>)}
    </select></label>
    <div ref={host} />
    <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={e => { void upload(e.target.files?.[0]); e.target.value = ''; }} />
    <textarea className="article-validation" tabIndex={-1} aria-label="اعتبارسنجی متن مقاله" required={required || busy} value={busy ? '' : value} onChange={() => {}} onInvalid={() => { if (busy) setError('تا پایان بارگذاری تصویر صبر کنید.'); else editor.current?.focus(); }} />
    {busy && <p role="status">در حال بارگذاری تصویر…</p>}
    {error && <p role="alert">{error}</p>}
  </div>;
}
