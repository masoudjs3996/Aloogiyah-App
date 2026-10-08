"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BookOpenIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useArticles } from "@/hooks/queries/usePlatform";
import { useUser } from "@/hooks/queries/useUser";
import { usePlatformMutation } from "@/hooks/mutations/usePlatformMutation";
import { platformApi } from "@/lib/actions/platform";
import type { Article, ArticleInput } from "@/shared/types/platform";
import { dateLabel, hasManagerRole } from "@/shared/utils/platform";
import useDebounce from "@/shared/hooks/useDebounce";
import ActionButton from "@/design-system/atoms/platform/ActionButton";
import PageHeading from "@/design-system/molecules/platform/PageHeading";
import FormPanel from "@/design-system/molecules/platform/FormPanel";
import QueryState from "@/design-system/molecules/platform/QueryState";
import Pagination from "@/design-system/molecules/platform/Pagination";
import SafeArticleContent from "@/design-system/molecules/platform/SafeArticleContent";
import {
  TextField,
  TextAreaField,
  Field,
} from "@/design-system/molecules/platform/FormField";
function ArticleEditor({ item, done }: { item?: Article; done: () => void }) {
  const [form, setForm] = useState<ArticleInput>({
    title: item?.title || "",
    content: item?.content || "",
    slug: item?.slug || "",
    metaTitle: item?.metaTitle || "",
    metaDescription: item?.metaDescription || "",
    metaKeywords: item?.metaKeywords || "",
    categoryCodes: item?.categoryCodes || [],
  });
  const categories = useQuery({
    queryKey: ["platform", "categories"],
    queryFn: platformApi.categories,
  });
  const mutation = usePlatformMutation(
    async (data: ArticleInput) =>
      item
        ? platformApi.updateArticle({ ...data, articleCode: item.code })
        : platformApi.createArticle(data),
    ["articles", "article"],
  );
  const change = (key: keyof ArticleInput, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));
  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      await mutation.mutateAsync({
        ...form,
        title: form.title.trim(),
        content: form.content.trim(),
        slug: form.slug.trim(),
        metaTitle: form.metaTitle || form.title,
      });
      done();
    } catch {}
  }
  return (
    <form onSubmit={submit} className="space-y-5">
      <TextField
        label="عنوان مقاله"
        required
        maxLength={255}
        value={form.title}
        onChange={(e) => change("title", e.target.value)}
      />
      <TextAreaField
        label="متن مقاله"
        required
        rows={12}
        value={form.content}
        onChange={(e) => change("content", e.target.value)}
        hint="متن و پاراگراف‌ها را وارد کنید؛ نمایش مقاله از متن امن استفاده می‌کند."
      />
      <QueryState error={categories.error} retry={() => categories.refetch()}>
        <Field label="دسته‌های مقاله">
          <div className="flex flex-wrap gap-3">
            {categories.data?.items.map((category) => (
              <label
                key={category.code}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs"
              >
                <input
                  type="checkbox"
                  checked={form.categoryCodes.includes(category.code)}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      categoryCodes: e.target.checked
                        ? [...prev.categoryCodes, category.code]
                        : prev.categoryCodes.filter(
                            (code) => code !== category.code,
                          ),
                    }))
                  }
                />
                {category.name || category.title}
              </label>
            ))}
            {!categories.data?.items.length && (
              <span className="text-xs text-slate-500">
                دسته‌بندی ثبت نشده است
              </span>
            )}
          </div>
        </Field>
      </QueryState>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="نامک"
          required
          maxLength={255}
          value={form.slug}
          onChange={(e) => change("slug", e.target.value)}
          dir="ltr"
          placeholder="plant-care-guide"
        />
        <TextField
          label="عنوان برای موتور جست‌وجو"
          maxLength={255}
          value={form.metaTitle}
          onChange={(e) => change("metaTitle", e.target.value)}
        />
      </div>
      <TextAreaField
        label="توضیح کوتاه"
        maxLength={500}
        value={form.metaDescription}
        onChange={(e) => change("metaDescription", e.target.value)}
      />
      <TextField
        label="کلیدواژه‌ها"
        maxLength={255}
        value={form.metaKeywords}
        onChange={(e) => change("metaKeywords", e.target.value)}
      />
      <ActionButton type="submit" busy={mutation.isPending}>
        ذخیره مقاله
      </ActionButton>
    </form>
  );
}
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
  const { roulData } = useUser();
  const manager = hasManagerRole(roulData?.data?.roleNames, roulData?.data?.roleName);
  const [editing, setEditing] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const remove = usePlatformMutation(
    platformApi.deleteArticle,
    ["articles", "article"],
    "مقاله حذف شد",
  );
  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={publicView ? "/articles" : "/dashboard/articles"}
        className="mb-6 inline-block text-sm text-emerald-700"
      >
        بازگشت به مقالات
      </Link>
      {remove.isSuccess ? (
        <QueryState empty emptyText="این مقاله حذف شد" />
      ) : (
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
                {manager && (
                  <div className="flex gap-2">
                    <ActionButton
                      variant="secondary"
                      onClick={() => setEditing(true)}
                    >
                      ویرایش
                    </ActionButton>
                    <ActionButton
                      variant="danger"
                      onClick={() => setRemoveOpen(true)}
                    >
                      حذف
                    </ActionButton>
                  </div>
                )}
              </div>
              <h1 className="mb-8 text-2xl font-bold leading-relaxed text-slate-900 sm:text-3xl">
                {query.data.title}
              </h1>
              <SafeArticleContent content={query.data.content} />
            </article>
          )}
        </QueryState>
      )}
      <FormPanel
        open={editing}
        onClose={() => setEditing(false)}
        title="ویرایش مقاله"
      >
        {query.data && editing && (
          <ArticleEditor item={query.data} done={() => setEditing(false)} />
        )}
      </FormPanel>
      <FormPanel
        open={removeOpen}
        onClose={() => setRemoveOpen(false)}
        title="حذف مقاله"
      >
        <p className="mb-5 text-sm text-slate-600">
          مقاله «{query.data?.title}» حذف شود؟
        </p>
        <div className="flex gap-3">
          <ActionButton
            variant="danger"
            busy={remove.isPending}
            onClick={async () => {
              try {
                await remove.mutateAsync(code);
                setRemoveOpen(false);
              } catch {}
            }}
          >
            حذف مقاله
          </ActionButton>
          <ActionButton
            variant="secondary"
            onClick={() => setRemoveOpen(false)}
          >
            انصراف
          </ActionButton>
        </div>
      </FormPanel>
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
  const [open, setOpen] = useState(false);
  const term = useDebounce(search, 350);
  const query = useArticles({
    PageNumber: page,
    PageSize: 12,
    SearchTerm: term || undefined,
  });
  const { roulData } = useUser();
  const manager = hasManagerRole(roulData?.data?.roleNames, roulData?.data?.roleName);
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeading
        title="مجله الو گیاه"
        description="دانش کاربردی برای نگهداری گیاهان، کشاورزی و انتخاب محصول بهتر."
        action={
          manager && (
            <ActionButton onClick={() => setOpen(true)}>
              <PlusIcon className="h-5 w-5" />
              مقاله جدید
            </ActionButton>
          )
        }
      />
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
            <Link
              href={`${publicView ? "/articles" : "/dashboard/articles"}/${encodeURIComponent(item.code)}`}
              key={item.code}
              className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex h-36 items-center justify-center bg-gradient-to-br from-emerald-50 to-lime-50">
                <BookOpenIcon className="h-16 w-16 text-emerald-700/40" />
              </div>
              <div className="p-5">
                <p className="mb-3 text-xs text-slate-400">
                  {dateLabel(item.createdAt)}
                </p>
                <h2 className="mb-4 text-lg font-bold leading-8 text-slate-800">
                  {item.title}
                </h2>
                <span className="text-xs font-bold text-emerald-700">
                  مطالعه مقاله ←
                </span>
              </div>
            </Link>
          ))}
        </div>
      </QueryState>
      <Pagination
        page={page}
        total={query.data?.totalCount || 0}
        onChange={setPage}
        busy={query.isFetching}
      />
      <FormPanel open={open} onClose={() => setOpen(false)} title="نوشتن مقاله">
        {open && <ArticleEditor done={() => setOpen(false)} />}
      </FormPanel>
    </div>
  );
}
