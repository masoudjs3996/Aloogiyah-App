/** @type {import('next').NextConfig} */
const nextConfig = {
 env: {
   // WebSocket upgrades must go directly to the API host; browser-side Next rewrites
   // do not provide a reliable WebSocket proxy in production.
   NEXT_PUBLIC_CHAT_SOCKET_URL: (process.env.NEXT_PUBLIC_CHAT_SOCKET_URL || process.env.NEXT_PUBLIC_BASE_URL || process.env.API_BASE_URL || "http://localhost:5056/api").replace(/\/+$/, "").replace(/\/api$/i, ""),
 },
 images: { unoptimized: true }, reactStrictMode: true,
 async rewrites() {
   const api = (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5056/api").replace(/\/+$/, "");
   return [{ source: "/api/:path*", destination: `${api}/:path*` }];
 },
};
export default nextConfig;
