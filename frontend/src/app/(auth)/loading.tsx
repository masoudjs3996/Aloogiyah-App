import QueryState from "@/design-system/molecules/platform/QueryState";

export default function Loading() {
  return (
    <div className="mx-auto flex min-h-[70dvh] w-full max-w-md items-center px-4 py-8">
      <QueryState loading skeleton="form" />
    </div>
  );
}
