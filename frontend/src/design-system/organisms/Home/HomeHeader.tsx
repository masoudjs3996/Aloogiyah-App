"use client";
import { FC, useEffect } from "react";
import { HeaderTop } from "../../molecules/Home";
import { useSelector } from "react-redux";

const HomeHeader: FC = () => {
  const user = useSelector((state: any) => state.user.data);;

  return (
    <>
      {" "}
      <HeaderTop />
      
    </>
  );
};

export default HomeHeader;
