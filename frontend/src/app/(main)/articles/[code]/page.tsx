import { ArticleDetail } from "@/design-system/organisms/platform/ArticlesWorkspace";
export default async function Page({ params }: { params: Promise<{ code: string }> }) { const { code } = await params; return <div className="px-4 py-8"><ArticleDetail code={code} publicView /></div>; }
