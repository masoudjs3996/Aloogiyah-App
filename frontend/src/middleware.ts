import { NextRequest, NextResponse } from "next/server";
import { middlewareAuth } from "./shared/utils/middlewareAuth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard")) {
    const RoulCode = await middlewareAuth(request);
    console.log(
      "--------------------------------------------user is here----------------------------------------------------------------",
    );

    if (RoulCode.data.roleCode === "47C2D51E0F") {
      return NextResponse.redirect(new URL("/Login", request.nextUrl));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
