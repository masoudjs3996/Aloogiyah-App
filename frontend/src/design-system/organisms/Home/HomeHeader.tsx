"use client";
import { FC } from "react";
import SearchInput from "../../atoms/SearchInput";
import { HeaderTop } from "../../molecules/Home";

const HomeHeader: FC = () => {
  return (
    <header className="w-full bg-white shadow-sm space-y-4">
      <HeaderTop />
      <div className="px-4 pb-3">
        <SearchInput />
      </div>
    </header>
  );
};

export default HomeHeader;
