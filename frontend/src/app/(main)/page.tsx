import { getFeaturedCategories } from "@/lib/actions/categories";
import {
  CategoryCard,
  FarmCard,
  ProductCard,
} from "@/design-system/molecules/public";
import { BannerSlider } from "@/design-system/organisms/Home";
import { GetFarmsByFilter } from "@/lib/actions/farm";
import { getSlider } from "@/lib/actions/slider";

export default async function Home() {
  const categoRes = await getFeaturedCategories();
  const categories = categoRes?.data;
  const farmRes = await GetFarmsByFilter();
  const farms = farmRes?.data;
  const slider = await getSlider();

  if (!categories || categories.length === 0 || !farms || farms?.length === 0) {
    return <p>مشکل در بارگیری دیتا </p>;
  }

  return (
    <div className="mt-[-15px]">
      {slider?.data && <BannerSlider slider={slider?.data} />}
      <div className="mx-2">
        <h2 className="headlines-main">دسته‌بندی‌های‌ اصلی</h2>
        <div className="flex justify-around flex-wrap p-4  my-10">
          {categories.map((cat) => {
            return <CategoryCard key={cat.code} category={cat} />;
          })}
        </div>
        <div className="flex items-center justify-between w-full">
          <h2 className="headlines-main">مزرعه‌ها</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4  my-10">
          {farms.slice(0, 3).map((farm: any) => {
            return <FarmCard key={farm.description} farm={farm} />;
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
    </div>
  );
}
