import Button from '../atoms/Button';
function messages(value: unknown): string[] { if (typeof value === 'string') return [value]; if (Array.isArray(value)) return value.flatMap(messages); if (value && typeof value === 'object') return Object.values(value).flatMap(messages); return []; }
export default function ErrorState({ error, retry }: { error: Error; retry?: () => void }) {
  const details = [...new Set(messages((error as Error & { details?: unknown }).details))].filter(message => message !== error.message);
  return <div className="error" role="alert"><strong>{error.message}</strong>{details.length > 0 && <ul>{details.map(message => <li key={message}>{message}</li>)}</ul>}{retry && <Button variant="secondary" onClick={retry}>تلاش دوباره</Button>}</div>;
}
