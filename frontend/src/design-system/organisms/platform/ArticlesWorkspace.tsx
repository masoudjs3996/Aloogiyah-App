"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useArticles } from "@/hooks/queries/usePlatform";
import { platformApi } from "@/lib/actions/platform";
import { dateLabel } from "@/shared/utils/platform";
import useDebounce from "@/shared/hooks/useDebounce";
import PageHeading from "@/design-system/molecules/platform/PageHeading";
import QueryState from "@/design-system/molecules/platform/QueryState";
import Pagination from "@/design-system/molecules/platform/Pagination";
import ArticleCard from "@/design-system/molecules/public/ArticleCard";
import SafeArticleContent from "@/design-system/molecules/platform/SafeArticleContent";
import { TextField } from "@/design-system/molecules/platform/FormField";

export function ArticleDetail({
  code,
  publicView = false,
}: {
  code: string;
  publicView?: boolean;
}) {
  const query = useQuery({
    queryKey: ["platform", "article", code],
    queryFn: () => platformApi.article(code),
    enabled: !!code,
  });



  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={publicView ? "/articles" : "/dashboard/articles"}
        className="mb-6 inline-block text-sm text-emerald-700"
      >
        {publicView ? "بازگشت به وبلاگ" : "بازگشت به مقالات"}
      </Link>
      {(
        <QueryState
          loading={query.isLoading}
          error={query.error}
          retry={() => query.refetch()}
          skeleton="detail"
        >
          {query.data && (
            <article className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-10">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-400">
                  {dateLabel(query.data.createdAt)}
                </span>

              </div>
              <h1 className="mb-8 text-2xl font-bold leading-relaxed text-slate-900 sm:text-3xl">
                {query.data.title}
              </h1>
              <SafeArticleContent content={query.data.content} />
            </article>
          )}
        </QueryState>
      )}


    </div>
  );
}
export default function ArticlesWorkspace({
  publicView = false,
}: {
  publicView?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const term = useDebounce(search, 350);
  const query = useArticles({
    PageNumber: page,
    PageSize: 12,
    SearchTerm: term || undefined,
  });


  return (
    <div className="mx-auto max-w-6xl">
      <PageHeading
        title={publicView ? "وبلاگ" : "مجله الو گیاه"}
        description="دانش کاربردی برای نگهداری گیاهان، کشاورزی و انتخاب محصول بهتر."/>
      <div className="mb-6 max-w-md">
        <TextField
          label="جست‌وجوی مقاله"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="دنبال چه موضوعی هستید؟"
        />
      </div>
      <QueryState
        loading={query.isLoading}
        error={query.error}
        empty={!query.data?.items.length}
        retry={() => query.refetch()}
        emptyText="مقاله‌ای برای این جست‌وجو پیدا نشد"
        skeleton="cards"
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {query.data?.items.map((item) => (
            <ArticleCard key={item.code} article={item} publicView={publicView} />
          ))}
        </div>
      </QueryState>
      <Pagination
        page={page}
        total={query.data?.totalCount || 0}
        onChange={setPage}
        busy={query.isFetching}
      />

    </div>
  );
}
