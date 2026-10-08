export const getImageUrl = (url?: string | null) => {
 if (!url) return "/placeholder.svg";
 if (/^(https?:\/\/|data:image\/|blob:)/i.test(url)) return url;
 if (url.startsWith("/images/") || url.startsWith("/placeholder")) return url;
 const configured = process.env.NEXT_PUBLIC_MEDIA_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5056/api";
 try { return new URL(url.replace(/^\/+/, ""), `${new URL(configured).origin}/`).toString(); } catch { return "/placeholder.svg"; }
};
