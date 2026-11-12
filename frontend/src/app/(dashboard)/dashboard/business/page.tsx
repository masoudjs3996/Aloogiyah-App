import BusinessWorkspace from "@/design-system/organisms/platform/BusinessWorkspace";
export default async function Page({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
 const {type}=await searchParams;
 return <BusinessWorkspace key={type === "Shop" ? "Shop" : "Farmer"} initialType={type === "Shop" ? "Shop" : "Farmer"} />;
}
