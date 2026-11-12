import Link from "next/link";
import { BookOpenIcon } from "@heroicons/react/24/outline";
import type { ArticleSummary } from "@/shared/types/platform";
import { dateLabel } from "@/shared/utils/platform";
import SafeArticleContent from "@/design-system/molecules/platform/SafeArticleContent";

export default function ArticleCard({ article, publicView = false }: { article: ArticleSummary; publicView?: boolean }) {
  return (
    <Link
      href={`${publicView ? "/articles" : "/dashboard/articles"}/${encodeURIComponent(article.code)}`}
      aria-label={`مشاهده جزئیات ${article.title}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md"
    >
      <div className="flex h-36 shrink-0 items-center justify-center bg-gradient-to-br from-emerald-50 to-lime-50">
        <BookOpenIcon className="h-16 w-16 text-emerald-700/40" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="mb-3 text-xs text-slate-400">{dateLabel(article.createdAt)}</p>
        <h2 className="mb-3 line-clamp-2 text-lg font-bold leading-8 text-slate-800">{article.title}</h2>
        <SafeArticleContent
          content={article.summary?.trim() || "برای خواندن متن کامل، جزئیات مقاله را مشاهده کنید."}
          className="line-clamp-1 min-h-6 break-words text-sm leading-6 text-slate-500"
        />
        <div className="mt-auto pt-4">
          <span className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 py-2.5 text-xs font-bold text-white transition group-hover:bg-emerald-800">
            مشاهده جزئیات
            <span aria-hidden="true">←</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
