export type BrandAudience = "farmer" | "buyer" | "general";

export function getBrandAudience(roles: string[]): BrandAudience {
  const farmer = roles.includes("Farmer");
  const buyer = roles.includes("Buyer");
  // A person with both roles chooses the purpose of this visit.
  return farmer === buyer ? "general" : farmer ? "farmer" : "buyer";
}

export const brandMessages = {
  general: {
    title: ["کشاورز و خریدار،", "نزدیک‌تر و رو‌راست‌تر."],
    description: "برای تولیدکننده، حساب‌وکتاب روشن؛ برای خریدار، راهی برای پیدا کردن تولیدکننده و خرید از خودش. مسیرت را انتخاب کن.",
    action: "دیدن محصولات", href: "/product",
    secondary: "آشنایی با تولیدکنندگان", secondaryHref: "/farm",
    eyebrow: "دو سوی معامله، یک میدان",
    panelTitle: "برای چه کاری اینجایی؟",
  },
  farmer: {
    title: ["محصول از تو،", "رو‌راستی از ما."],
    description: "زحمت محصولت را تو کشیده‌ای؛ حق داری بدانی با چه شرایطی معامله می‌کنی. محصولت را معرفی کن، با خریدار حرف بزن و حساب‌وکتاب را روشن دنبال کن.",
    action: "مدیریت مزارع و محصولاتم", href: "/dashboard/farm/myFarms",
    secondary: "شرایط همکاری و تسویه", secondaryHref: "/terms",
    eyebrow: "میدان بار رو‌راست، برای حاصل زحمت تو",
    panelTitle: "حساب‌وکتاب روشن، قدم‌به‌قدم",
  },
  buyer: {
    title: ["تولیدکننده را پیدا کن،", "از خودش بخر."],
    description: "برای رسیدن به محصول، از خود مزرعه و گلخانه شروع کن. تولیدکننده را بشناس، دربارهٔ محصول و قیمت گفت‌وگو کن و شرایط ارسال را پیش از خرید روشن کن.",
    action: "پیداکردن تولیدکننده", href: "/farm",
    secondary: "دیدن محصولات", secondaryHref: "/product",
    eyebrow: "مسیر کوتاه‌تر از تولیدکننده تا خرید",
    panelTitle: "خرید مستقیم، با شناخت بیشتر",
  },
};
