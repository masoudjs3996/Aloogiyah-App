import FarmEditWorkspace from "@/design-system/organisms/platform/FarmEditWorkspace";

export default async function Page({ params }: { params: Promise<{ fermCode: string }> }) {
  const { fermCode } = await params;
  return <FarmEditWorkspace code={fermCode} />;
}
