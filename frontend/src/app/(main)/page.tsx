import { getFeaturedCategories } from "@/lib/actions/categories";
import {
  CategoryCard,
  FarmCard,
  ProductCard,
} from "@/design-system/molecules/public";
import { BannerSlider } from "@/design-system/organisms/Home";
import { GetFarmsByFilter } from "@/lib/actions/farm";

export default async function Home() {
  const categoRes = await getFeaturedCategories();
  const categories = categoRes?.data;
  const farmRes = await GetFarmsByFilter();
  const farms = farmRes?.data;

  if (!categories || categories.length === 0 || !farms || farms?.length === 0) {
    return <p>مشکل در بارگیری دیتا </p>;
  }

  return (
    <>
      <BannerSlider />
      <div className="mx-2">
        <h2 className="headlines-main">دسته‌بندی‌های‌ اصلی</h2>
        <div className="flex justify-between flex-wrap p-4  my-10">
          {Array.from({ length: 10 }).map((_, i) => (
            <CategoryCard
              key={i}
              name={categories[i % categories.length]?.name}
              imageUrl={categories[i % categories.length]?.imageUrl}
            />
          ))}
        </div>
        <div className="flex items-center justify-between w-full">
          <h2 className="headlines-main">مزرعه‌ها</h2>

          {/* این معلوم نیس چیه ؟؟ */}
          {/* <span className="text-xs sm:text-sm text-gray-500">مشاهده همه</span> */}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4  my-10">
          {Array.from({ length: 4 }, (_, i) => {
            const farm = farms[i % farms?.length];
            return <FarmCard key={`${farm.code}-${i}`} farm={farm} />;
          })}
        </div>
        <div className="flex items-center justify-between w-full">
          <h2 className="headlines-main">محصولات برتر</h2>
          <span className="text-xs sm:text-sm text-gray-500">مشاهده همه</span>
        </div>
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 my-10 w-full">
          <ProductCard />
        </div>
      </div>
    </>
  );
}
