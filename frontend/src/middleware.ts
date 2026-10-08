import { NextRequest, NextResponse } from "next/server";
// احراز هویت و مالکیت واقعی در API انجام می‌شود؛ Middleware فقط ورود به پنل را محافظت می‌کند.
// بررسی شبکه‌ای GetRole در هر navigation باعث خروج اشتباه در قطعی سرور و جلوگیری از refresh می‌شد.
export function middleware(request: NextRequest) {
  if (
    !request.cookies.get("token")?.value &&
    !request.cookies.get("refreshToken")?.value
  ) {
    const login = new URL("/Login", request.url);
    login.searchParams.set(
      "next",
      request.nextUrl.pathname + request.nextUrl.search,
    );
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}
export const config = { matcher: ["/dashboard/:path*"] };
