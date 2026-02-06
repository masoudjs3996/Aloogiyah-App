import { NextRequest } from "next/server";
import { GetUserResponse } from "../types/user";

export const middlewareAuth = async (request: NextRequest) => {
  const token = request.cookies.get("token");
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}User/GetMyProfile`,
    {
      method: "GET",
      headers: {
        Authorization: `${token?.value ? token?.value : ""}`,
        Accept: "*/*",
      },
    },
  );
  

  const text = await res.text();

  console.log("This is masoud ");

  console.log(text);
  const data: GetUserResponse = JSON.parse(text);

  return data || null;
};
