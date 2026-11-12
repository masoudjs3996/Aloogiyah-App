import MarketplaceTermsDocument from "@/design-system/organisms/platform/MarketplaceTermsDocument";

export default async function TermsPage({ searchParams }: { searchParams: Promise<{ version?: string }> }) {
  const { version } = await searchParams;
  return <MarketplaceTermsDocument version={version} />;
}
