import { NextRequest, NextResponse } from "next/server";
import { middlewareAuth } from "./shared/utils/middlewareAuth";

export async function middleware(request: NextRequest) {
  const roleResponse = await middlewareAuth(request);

  // توکن وجود ندارد، منقضی شده یا پاسخ API نامعتبر است
  if (!roleResponse) {
    const loginUrl = new URL("/Login", request.url);

    const response = NextResponse.redirect(loginUrl);

    response.cookies.delete("token");
    response.cookies.delete("guestToken");

    return response;
  }

  if (roleResponse.data?.roleCode === "47C2D51E0F") {
    return NextResponse.redirect(new URL("/Login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};

// import { NextRequest, NextResponse } from "next/server";
// import { middlewareAuth } from "./shared/utils/middlewareAuth";

// export async function middleware(request: NextRequest) {
//   const { pathname } = request.nextUrl;

//   if (pathname.startsWith("/dashboard")) {
//     const RoulCode = await middlewareAuth(request);

//     if (RoulCode?.data?.roleCode === "47C2D51E0F") {
//       return NextResponse.redirect(new URL("/Login", request?.nextUrl));
//     }
//     return NextResponse.next();
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ["/dashboard/:path*"],
// };
