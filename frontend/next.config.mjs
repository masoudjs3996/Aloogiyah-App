/** @type {import('next').NextConfig} */
if (process.env.NODE_ENV === "production") {
 for (const name of ["API_BASE_URL", "NEXT_PUBLIC_BASE_URL", "NEXT_PUBLIC_MEDIA_BASE_URL", "NEXT_PUBLIC_CHAT_SOCKET_URL"]) {
   const value = process.env[name];
   if (!value) throw new Error(`${name} must be configured for production.`);
   if (name !== "API_BASE_URL" && !/^(https|wss):\/\//i.test(value))
     throw new Error(`${name} must use HTTPS or WSS for production.`);
 }
}
const nextConfig = {
 output: "standalone",
 experimental: { proxyClientMaxBodySize: "52mb" },
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
