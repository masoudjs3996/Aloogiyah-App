import ActionButton from "@/design-system/atoms/platform/ActionButton";
import { faNumber } from "@/shared/utils/platform";
export default function Pagination({
  page,
  total,
  size = 12,
  onChange,
  busy,
}: {
  page: number;
  total: number;
  size?: number;
  onChange: (page: number) => void;
  busy?: boolean;
}) {
  const pages = Math.max(1, Math.ceil(total / size));
  if (pages <= 1) return null;
  return (
    <nav
      aria-label="صفحه‌بندی"
      className="mt-6 flex items-center justify-center gap-4"
    >
      <ActionButton
        variant="secondary"
        disabled={page <= 1 || busy}
        onClick={() => onChange(page - 1)}
      >
        قبلی
      </ActionButton>
      <span className="text-sm text-slate-500">
        {faNumber(page)} از {faNumber(pages)}
      </span>
      <ActionButton
        variant="secondary"
        disabled={page >= pages || busy}
        onClick={() => onChange(page + 1)}
      >
        بعدی
      </ActionButton>
    </nav>
  );
}
