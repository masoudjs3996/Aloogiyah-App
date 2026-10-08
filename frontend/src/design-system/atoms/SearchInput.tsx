"use client";
import { setSearch } from "@/lib/store/slices/productFilterSlice";
import { usePathname, useRouter } from "next/navigation";
import { FC, useEffect, useRef, useState } from "react";
import { FiSearch } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
const SearchInput: FC = () => {
  const { search } = useSelector((state: any) => state.productFilter);
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const [localValue, setLocalValue] = useState(search ?? "");
  const [hasEdited, setHasEdited] = useState(false);
  useEffect(() => {
    if (!hasEdited) return;

    const timer = setTimeout(() => {
      dispatch(setSearch(localValue.trim()));
      if (pathnameRef.current !== "/product") router.push("/product");
    }, 500);

    return () => clearTimeout(timer);
  }, [localValue, hasEdited, dispatch, router]);
  return (
    <div className="relative">
      <input
        value={localValue}
        onChange={(e) => {
          setLocalValue(e.target.value);
          setHasEdited(true);
        }}
        type="text"
        placeholder="جستجو در محصولات ..."
        className="w-full p-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary-700"
      />
      <FiSearch className="w-5 h-5 text-gray-500 dark:text-gray-400 absolute left-3 top-3.5" />
    </div>
  );
};

export default SearchInput;
