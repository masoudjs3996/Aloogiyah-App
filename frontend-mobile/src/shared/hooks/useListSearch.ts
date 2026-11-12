import { useEffect, useState } from "react";

export function useListSearch() {
  const [search, setSearch] = useState("");
  const [list, setList] = useState({ name: "", page: 1 });

  useEffect(() => {
    const name = search.trim();
    if (name === list.name) return;
    const timer = setTimeout(() => setList({ name, page: 1 }), 350);
    return () => clearTimeout(timer);
  }, [search, list.name]);

  return {
    ...list,
    search,
    setSearch,
    setPage: (page: number) => setList((current) => ({ ...current, page })),
  };
}
