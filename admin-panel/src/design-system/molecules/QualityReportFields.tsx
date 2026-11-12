import FormField from './FormField';
import { reportChoices } from '../../shared/utils/quality-report';
import type { Row } from '../../shared/types';

export default function QualityReportFields({ value, onChange }: { value?: Row; onChange: (value: Row) => void }) {
  const current = value || {};
  return <div className="nested"><div className="form-grid">
    {reportChoices.map(field => <FormField key={field.key} field={{ name: field.key, type: 'enum', required: true, options: [...field.options] }} value={current[field.key]} onChange={next => onChange({ ...current, [field.key]: next })} />)}
    <FormField field={{ name: 'damagePercent', type: 'number', required: true, min: 0, max: 100 }} value={current.damagePercent} onChange={next => onChange({ ...current, damagePercent: next })} />
    <FormField field={{ name: 'inspectedQuantity', type: 'number', required: true, min: 0.001, max: 100000000 }} value={current.inspectedQuantity} onChange={next => onChange({ ...current, inspectedQuantity: next })} />
  </div></div>;
}
