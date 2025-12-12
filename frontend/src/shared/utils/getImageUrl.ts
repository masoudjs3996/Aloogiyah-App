export const getImageUrl = (url: string) => {
  if (!url) return "/placeholder.png";
  return `http://aloogiyah.ir${url.startsWith("/") ? url : `/${url}`}`;
};
