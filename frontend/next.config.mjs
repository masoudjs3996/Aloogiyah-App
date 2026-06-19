const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "aloogiyah.ir",
        pathname: "/api/**",
      },
    ],
  },
  reactStrictMode: false,
  // output: "export",
  ///////////////////// this is for corse error /////////////////////////////////////////////
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_BASE_URL}/:path*`,
      },
    ];
  },
  // ////////////////////////////////////////////////////////////////////////////////////////
};

export default nextConfig;

// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   images: {
//     remotePatterns: [
//       {
//         protocol: "http",
//         hostname: "localhost",
//         port: "5000",
//         pathname: "/uploads/**",
//       },
//     ],
//   },
//   // experimental: {
//   //   ppr: "incremental",
//   // },
//   logging: {
//     fetches: {
//       fullUrl: true,
//     },
//   },
//   ///////////////////// this is for corse error /////////////////////////////////////////////
//   async rewrites() {
//     return [
//       {
//         source: "/api/:path*",
//         destination: `${process.env.NEXT_PUBLIC_BASE_URL}/:path*`,
//       },
//     ];
//   },
//   // ////////////////////////////////////////////////////////////////////////////////////////
// };

// export default nextConfig;
