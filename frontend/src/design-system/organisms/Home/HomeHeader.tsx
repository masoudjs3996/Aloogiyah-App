"use client";
import { FC, useEffect } from "react";
import SearchInput from "../../atoms/SearchInput";
import { HeaderTop } from "../../molecules/Home";
import { useSelector } from "react-redux";

const HomeHeader: FC = () => {
  const user = useSelector((state: any) => state.user.data);

  useEffect(() => {
    console.log("مقدار یوزر:", user);
  }, [user]);

  return (
    <HeaderTop />
    // <div className="px-4 pb-3">
    //   <SearchInput />
    // </div>
  );
};

export default HomeHeader;
