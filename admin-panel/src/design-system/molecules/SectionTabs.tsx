export default function SectionTabs<T extends string>({ value, onChange, tabs, label }: { value: T; onChange: (value: T) => void; tabs: { value: T; label: string; count?: number }[]; label: string }) {
  return <nav className="section-tabs" aria-label={label}>{tabs.map(tab => <button type="button" key={tab.value} aria-current={value === tab.value ? 'page' : undefined} onClick={() => onChange(tab.value)}>{tab.label}{tab.count != null && <span>{tab.count.toLocaleString('fa-IR')}</span>}</button>)}</nav>;
}
