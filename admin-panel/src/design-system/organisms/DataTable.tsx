import { label, display } from '../../shared/utils/labels';
import type { Row } from '../../shared/types';
import Badge from '../atoms/Badge';
import EmptyState from '../atoms/EmptyState';
export default function DataTable({ rows, columns, actions, statuses = [] }: { rows: Row[]; columns: string[]; actions?: (row: Row) => React.ReactNode; statuses?: Row[] }) {
  if (!rows.length) return <EmptyState />;
  return <div className="table-wrap"><table className="data-table"><thead><tr>{columns.map(column => <th key={column}>{label(column)}</th>)}{actions && <th className="action-column">عملیات</th>}</tr></thead><tbody>{rows.map((row, index) => <tr key={row.code || index}>{columns.map(column => <td key={column} data-label={label(column)}><div className={column === 'content' || column === 'description' ? 'truncate-cell' : ''}>{column === 'statusCode' ? <Badge>{statuses.find(s => s.code === row[column])?.name || display(row[column], column)}</Badge> : column === 'qualityGrade' || column === 'paymentStatus' ? <Badge tone={['PENDING', 'Pending', 'Held'].includes(row[column]) ? 'amber' : 'green'}>{display(row[column], column)}</Badge> : display(row[column], column)}</div></td>)}{actions && <td className="row-actions-cell"><div className="row-actions">{actions(row)}</div></td>}</tr>)}</tbody></table></div>;
}
