import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, GripVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../design-system/atoms/Button';
import Modal from '../design-system/molecules/Modal';
import PageIntro from '../design-system/molecules/PageIntro';
import { API_BASE, request } from '../shared/api/client';
import { saleUnits, saleUnitLabel } from '../shared/utils/sale-units';
import './specification-icon-picker.css';

type Category = { code: string; name: string; subCategories?: Category[] };
type Option = { code?: string; label: string; colorHex?: string | null; icon?: string | null; isActive: boolean; sortOrder: number };
type Specification = { code?: string; draftKey?: number; name: string; isRequired: boolean; isActive: boolean; sortOrder: number; options: Option[] };
type ProductTemplate = { code: string; categoryCode: string; categoryName: string; name: string; defaultSaleUnit?: string | null; isActive: boolean; sortOrder: number; specifications: Specification[] };
type Draft = Omit<ProductTemplate, 'code' | 'categoryName'> & { code?: string };
type CatalogIcon = { id: string; label: string };

const iconPath = '/AgriculturalProductTemplate/Icons';
const iconImage = (id: string) => API_BASE + iconPath + '/' + encodeURIComponent(id);
const normalizeIconSearch = (value: string) => value.toLowerCase().replace(/[\s\u200c_-]/g, '').replace(/ي/g, 'ی').replace(/ك/g, 'ک');

function OptionIconPicker({ value, onChange }: { value?: string | null; onChange: (value: string | null) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const icons = useQuery<CatalogIcon[]>({ queryKey: ['specification-icons'], queryFn: () => request(iconPath), enabled: open, staleTime: Infinity });
  const searchKey = normalizeIconSearch(search);
  const results = icons.data?.filter(icon => normalizeIconSearch(icon.label).includes(searchKey) || normalizeIconSearch(icon.id).includes(searchKey)) ?? [];
  const selected = icons.data?.find(icon => icon.id === value);

  return <div className="wide specification-icon-picker">
    <div className="toolbar">
      <button type="button" className="specification-icon-choice" aria-expanded={open} onClick={() => { setOpen(!open); setSearch(''); }}>
        {value && <img src={iconImage(value)} alt="" width={20} height={20} />}
        {value ? `تغییر آیکون · ${selected?.label ?? value}` : 'انتخاب آیکون'}
      </button>
      {value && <Button type="button" variant="ghost" onClick={() => { onChange(null); setOpen(false); }}>حذف آیکون</Button>}
    </div>
    {open && <div className="specification-icon-results">
      <label>جست‌وجوی آیکون<input type="search" autoFocus placeholder="مثلاً برگ، ستاره یا Leaf" value={search} onChange={event => setSearch(event.target.value)} /></label>
      {icons.isPending && <p role="status">در حال دریافت آیکون‌ها…</p>}
      {icons.isError && <Button type="button" variant="secondary" onClick={() => void icons.refetch()}>دریافت دوبارهٔ آیکون‌ها</Button>}
      {icons.isSuccess && !results.length && <p role="status">آیکونی پیدا نشد.</p>}
      <div className="specification-icon-grid">
        {results.map(icon => <button key={icon.id} type="button" className="specification-icon-choice" aria-pressed={value === icon.id} title={icon.id} onClick={() => { onChange(icon.id); setOpen(false); }}>
          <img src={iconImage(icon.id)} alt="" width={20} height={20} loading="lazy" />
          {icon.label}
        </button>)}
      </div>
    </div>}
  </div>;
}

const newOption = (sortOrder = 0): Option => ({ label: '', isActive: true, sortOrder });
const newDraft = (): Draft => ({ categoryCode: '', name: '', isActive: true, sortOrder: 0, specifications: [] });
function flattenCategories(categories: Category[], level = 0): Array<Category & { label: string }> {
  return categories.flatMap(category => [
    { ...category, label: `${'— '.repeat(level)}${category.name}` },
    ...flattenCategories(category.subCategories || [], level + 1),
  ]);
}

export default function ProductTemplatesPage() {
  const client = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);
  const categories = useQuery<Category[]>({ queryKey: ['categories-for-product-templates'], queryFn: () => request('/Category/CategoryTree') });
  const templates = useQuery<ProductTemplate[]>({ queryKey: ['product-templates-admin'], queryFn: () => request('/AgriculturalProductTemplate/Manage') });
  const categoryOptions = useMemo(() => flattenCategories(categories.data || []), [categories.data]);
  const save = useMutation({
    mutationFn: (value: Draft) => request('/AgriculturalProductTemplate' + (value.code ? '/' + value.code : ''), value.code ? 'PUT' : 'POST', {
      categoryCode: value.categoryCode,
      name: value.name.trim(),
      defaultSaleUnit: value.defaultSaleUnit || null,
      isActive: value.isActive,
      sortOrder: Number(value.sortOrder) || 0,
      specifications: value.specifications.map((specification) => ({
        code: specification.code,
        name: specification.name.trim(),
        isRequired: specification.isRequired,
        isActive: specification.isActive,
        sortOrder: specification.sortOrder,
        options: specification.options.map((option, optionIndex) => ({ ...option, label: option.label.trim(), colorHex: option.colorHex ?? '', icon: option.icon ?? '', sortOrder: optionIndex })),
      })),
    }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['product-templates-admin'] });
      setDraft(null);
      toast.success('نوع محصول و مشخصات آن ذخیره شد.');
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const remove = useMutation({
    mutationFn: (code: string) => request('/AgriculturalProductTemplate/' + code, 'DELETE'),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['product-templates-admin'] });
      toast.success('نوع محصول از فهرست فعال خارج شد.');
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const edit = (item: ProductTemplate) => setDraft({ ...item, specifications: item.specifications.map(specification => ({ ...specification, options: specification.options.map(option => ({ ...option })) })) });

  return <div className="page-stack">
    <PageIntro
      eyebrow="کاتالوگ آگهی"
      title="نوع محصول و مشخصات آگهی"
      description="برای هر نوع محصول مثل رز، واحد فروش پیش‌فرض و مشخصات انتخابی مثل رنگ و ارتفاع را تعیین کنید."
      actions={<Button disabled={!categoryOptions.length} onClick={() => setDraft(newDraft())}><Plus size={17} />افزودن نوع محصول</Button>}
    />
    {categories.isError && <p role="alert" className="notice error-notice">دسته‌بندی‌ها دریافت نشدند. <Button variant="secondary" onClick={() => void categories.refetch()}>تلاش دوباره</Button></p>}
    {categories.isSuccess && !categoryOptions.length && <p className="notice">برای ساخت نوع محصول، ابتدا از بخش «دسته‌بندی‌ها» یک دسته بسازید.</p>}
    <div className="guide-box"><Check size={20} /><div><strong>دسته‌بندی با نوع محصول فرق دارد.</strong><p>دسته‌بندی صرفاً محل نمایش و جست‌وجو است؛ مشخصات به خود نوع محصول وصل هستند. نوع محصول را به یک دسته وصل کنید تا در فرم ثبت آگهی همان بخش نمایش داده شود.</p></div></div>
    {templates.isPending && <p role="status">در حال دریافت نوع‌های محصول…</p>}
    {templates.isError && <p role="alert" className="notice error-notice">{templates.error.message} <Button variant="secondary" onClick={() => void templates.refetch()}>تلاش دوباره</Button></p>}
    {templates.data?.length === 0 && <section className="empty"><h2>هنوز نوع محصولی تعریف نشده است</h2><p>از «افزودن نوع محصول» شروع کنید؛ برای نمونه ابتدا «رز» را تعریف و گزینه‌های رنگ و ارتفاع را وارد کنید.</p></section>}
    <div className="card-grid">{templates.data?.map(item => <article className="record-card" key={item.code}>
      <div className="card-heading"><div><h3>{item.name}</h3><p>{item.categoryName}</p></div><span className={'badge ' + (item.isActive ? 'green' : 'red')}>{item.isActive ? 'فعال' : 'غیرفعال'}</span></div>
      <dl className="info-list"><div><dt>واحد فروش پیش‌فرض</dt><dd>{item.defaultSaleUnit ? saleUnitLabel(item.defaultSaleUnit) : "انتخاب کشاورز"}</dd></div><div><dt>مشخصات فرم</dt><dd>{item.specifications.length ? item.specifications.map(specification => specification.name).join('، ') : 'بدون مشخصهٔ اضافی'}</dd></div><div><dt>گزینه‌ها</dt><dd>{item.specifications.reduce((total, specification) => total + specification.options.length, 0).toLocaleString('fa-IR')} گزینه</dd></div></dl>
      <div className="card-footer"><span className="code-chip">{item.code}</span><Button variant="secondary" onClick={() => edit(item)}><Pencil size={14} />ویرایش</Button><Button variant="ghost" aria-label={'حذف ' + item.name} disabled={remove.isPending} onClick={() => { if (window.confirm(`نوع محصول «${item.name}» از فهرست فعال خارج شود؟`)) remove.mutate(item.code); }}><Trash2 size={15} />حذف</Button></div>
    </article>)}</div>
    {draft && <ProductTemplateModal draft={draft} categories={categoryOptions} busy={save.isPending} onClose={() => setDraft(null)} onSave={value => save.mutate(value)} />}
  </div>;
}

function ProductTemplateModal({ draft: initialDraft, categories, busy, onClose, onSave }: { draft: Draft; categories: Array<Category & { label: string }>; busy: boolean; onClose: () => void; onSave: (value: Draft) => void }) {
  const [draft, setDraft] = useState(initialDraft);
  const nextDraftKey = useRef(0);
  const addSpecification = () => {
    const draftKey = nextDraftKey.current++;
    setDraft(previous => {
      const sortOrder = previous.specifications.reduce((max, field) => Math.max(max, field.sortOrder), -1) + 1;
      const specification: Specification = { draftKey, name: '', isRequired: true, isActive: true, sortOrder, options: [newOption()] };
      return { ...previous, specifications: [specification, ...previous.specifications] };
    });
  };
  const changeSpecification = (index: number, value: Partial<Specification>) => setDraft(previous => ({ ...previous, specifications: previous.specifications.map((item, itemIndex) => itemIndex === index ? { ...item, ...value } : item) }));
  const changeOption = (specificationIndex: number, optionIndex: number, value: Partial<Option>) => setDraft(previous => ({ ...previous, specifications: previous.specifications.map((specification, index) => index !== specificationIndex ? specification : { ...specification, options: specification.options.map((option, currentIndex) => currentIndex === optionIndex ? { ...option, ...value } : option) }) }));
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.categoryCode || !draft.name.trim()) return toast.error('دسته و نام نوع محصول را تکمیل کنید.');
    if (draft.specifications.some(specification => !specification.name.trim() || !specification.options.length || specification.options.some(option => !option.label.trim())))
      return toast.error('نام همه مشخصات و گزینه‌هایشان را تکمیل کنید.');
    const blockedField = draft.specifications.find(field => field.isActive && field.isRequired && !field.options.some(option => option.isActive));
    if (draft.isActive && blockedField) return toast.error(`برای «${blockedField.name}» حداقل یک گزینه فعال بگذارید.`);
    onSave(draft);
  };
  return <Modal title={draft.code ? 'ویرایش نوع محصول' : 'افزودن نوع محصول'} busy={busy} onClose={onClose}><form className="product-template-form" onSubmit={submit}>
    <div className="form-grid">
      <label>دسته‌بندی محل نمایش
        <select required value={draft.categoryCode} onChange={event => setDraft({ ...draft, categoryCode: event.target.value })}>
          <option value="">انتخاب دسته‌بندی</option>
          {categories.map(category => <option key={category.code} value={category.code}>{category.label}</option>)}
        </select>
      </label>
      <label>نام نوع محصول
        <input required maxLength={120} value={draft.name} placeholder="مثلاً رز" onChange={event => setDraft({ ...draft, name: event.target.value })} />
      </label>
      <label>واحد فروش پیش‌فرض
        <select value={draft.defaultSaleUnit ?? ''} onChange={event => setDraft({ ...draft, defaultSaleUnit: event.target.value || null })}>
          <option value="">کشاورز انتخاب کند</option>
          {saleUnits.map(unit => <option key={unit.value} value={unit.value}>{unit.label}</option>)}
        </select>
        <small>در فرم آگهی از قبل انتخاب می‌شود و کشاورز می‌تواند آن را تغییر دهد.</small>
      </label>
      <label>ترتیب نمایش
        <input type="number" min="0" value={draft.sortOrder} onChange={event => setDraft({ ...draft, sortOrder: Number(event.target.value) })} />
      </label>
      <label className="check-line"><input type="checkbox" checked={draft.isActive} onChange={event => setDraft({ ...draft, isActive: event.target.checked })} />برای ثبت آگهی فعال باشد</label>
    </div>
    <div className="section-head detail-section">
      <div><h2>مشخصات این نوع محصول</h2><p>عدد کوچک‌تر، مشخصه را زودتر در فرم کشاورز نمایش می‌دهد.</p></div>
      <Button type="button" variant="secondary" onClick={addSpecification}><Plus size={15} />افزودن مشخصه</Button>
    </div>
    <div className="page-stack">{draft.specifications.map((specification, specificationIndex) => <section className="panel panel-pad" key={specification.code ?? specification.draftKey}>
      <div className="form-grid"><label>نام مشخصه<input required maxLength={100} placeholder="مثلاً رنگ" autoFocus={specificationIndex === 0 && specification.draftKey != null} value={specification.name} onChange={event => changeSpecification(specificationIndex, { name: event.target.value })} /></label><label>ترتیب نمایش<input type="number" min="0" value={specification.sortOrder} onChange={event => changeSpecification(specificationIndex, { sortOrder: Number(event.target.value) })} /></label><label className="check-line"><input type="checkbox" checked={specification.isRequired} onChange={event => changeSpecification(specificationIndex, { isRequired: event.target.checked })} />اجباری</label><label className="check-line"><input type="checkbox" checked={specification.isActive} onChange={event => changeSpecification(specificationIndex, { isActive: event.target.checked })} />فعال</label></div>
      <div className="section-head" style={{ marginTop: 18 }}><strong className="inline-icon"><GripVertical size={16} />گزینه‌های «{specification.name || 'مشخصه'}»</strong><Button type="button" variant="ghost" onClick={() => setDraft(previous => ({ ...previous, specifications: previous.specifications.filter((_, index) => index !== specificationIndex) }))}><Trash2 size={15} />حذف مشخصه</Button></div>
      <div className="page-stack">{specification.options.map((option, optionIndex) => <div className="form-grid" key={option.code || optionIndex}><label className="wide">گزینه {optionIndex + 1}<input required maxLength={100} placeholder="مثلاً قرمز" value={option.label} onChange={event => changeOption(specificationIndex, optionIndex, { label: event.target.value })} /></label><label className="check-line"><input type="checkbox" checked={!!option.colorHex} onChange={event => changeOption(specificationIndex, optionIndex, { colorHex: event.target.checked ? "#E11D48" : null })} />نمایش نمونهٔ رنگ</label>{option.colorHex && <label>رنگ گزینه<input type="color" value={option.colorHex} onChange={event => changeOption(specificationIndex, optionIndex, { colorHex: event.target.value })} /></label>}<OptionIconPicker value={option.icon} onChange={icon => changeOption(specificationIndex, optionIndex, { icon })} /><label className="check-line"><input type="checkbox" checked={option.isActive} onChange={event => changeOption(specificationIndex, optionIndex, { isActive: event.target.checked })} />فعال</label><Button type="button" variant="ghost" onClick={() => changeSpecification(specificationIndex, { options: specification.options.filter((_, index) => index !== optionIndex) })}><Trash2 size={15} />حذف گزینه</Button></div>)}</div>
      <Button type="button" variant="secondary" className="detail-section" onClick={() => changeSpecification(specificationIndex, { options: [...specification.options, newOption(specification.options.length)] })}><Plus size={15} />افزودن گزینه</Button>
    </section>)}</div>
    <div className="form-actions"><Button disabled={busy}>{busy ? 'در حال ذخیره…' : 'ذخیره نوع محصول'}</Button><Button type="button" variant="secondary" disabled={busy} onClick={onClose}>انصراف</Button></div>
  </form></Modal>;
}
