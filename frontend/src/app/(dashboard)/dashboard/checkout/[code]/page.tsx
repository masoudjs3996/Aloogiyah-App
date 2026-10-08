import CheckoutWorkspace from "@/design-system/organisms/platform/CheckoutWorkspace";
export default async function Page({ params }: { params: Promise<{ code: string }> }) { const { code } = await params; return <CheckoutWorkspace code={code} />; }
