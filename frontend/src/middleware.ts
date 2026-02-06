import { NextRequest, NextResponse } from "next/server";
import { middlewareAuth } from "./shared/utils/middlewareAuth";


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { url } = request;

  const token = request.cookies.get("token");

  if (pathname.startsWith("/profile")) {
    const user = await middlewareAuth(request);
    if (user?.data?.roleCode !== "4D987D8C32") {
      NextResponse.redirect(new URL(`/login`, request.nextUrl));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/profile/:path*"],
};
