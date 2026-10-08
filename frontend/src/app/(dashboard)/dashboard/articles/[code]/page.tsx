import { ArticleDetail } from "@/design-system/organisms/platform/ArticlesWorkspace";
export default async function Page({ params }: { params: Promise<{ code: string }> }) { const { code } = await params; return <ArticleDetail code={code} />; }
