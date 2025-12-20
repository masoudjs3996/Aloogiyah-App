export const getImageUrl = (url: string) => {
  if (!url) return "/placeholder.png";
  return `http://localhost:5056${url.startsWith("/") ? url : `/${url}`}`;
};
