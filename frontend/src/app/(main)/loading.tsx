import QueryState from "@/design-system/molecules/platform/QueryState";

export default function Loading() {
  return <div className="mx-auto max-w-7xl px-4 py-8"><QueryState loading skeleton="page" /></div>;
}
