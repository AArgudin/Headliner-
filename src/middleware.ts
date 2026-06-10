export { default } from "next-auth/middleware"

export const config = {
  matcher: ["/dashboard/:path*", "/bookings/:path*", "/content/:path*", "/revenue/:path*", "/pr/:path*", "/settings/:path*"],
}
