import { OrderDetail } from "@/design-system/organisms/platform/OrdersWorkspace";
export default async function Page({ params }: { params: Promise<{ code: string }> }) { const { code } = await params; return <OrderDetail code={code} />; }
