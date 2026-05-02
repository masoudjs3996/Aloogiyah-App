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
    <>
      {slider?.data && <BannerSlider slider={slider?.data} />}

      <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-10 lg:grid-cols-12 gap-4 p-4  my-10 ">
        {categories.map((cat) => {
          return <CategoryCard category={cat} key={cat.code} />;
        })}

        {/* {Array.from({ length: 10 }).map((_, i) => (
          <CategoryCard
            key={i}
            name={categories[i % categories.length]?.name}
            imageUrl={categories[i % categories.length]?.imageUrl}
          />
        ))} */}
      </div>
      <div className="flex items-center justify-between w-full">
        <h2 className="text-base sm:text-lg font-bold text-gray-900">
          مزرعه‌ها
        </h2>
        <span className="text-xs sm:text-sm text-gray-500">مشاهده همه</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4  my-10">
        {Array.from({ length: 4 }, (_, i) => {
          const farm = farms[i % farms?.length];
          return <FarmCard key={`${farm.code}-${i}`} farm={farm} />;
        })}
      </div>
      <div className="flex items-center justify-between w-full">
        <h2 className="text-base sm:text-lg font-bold text-gray-900">
          محصولات برتر
        </h2>
        <span className="text-xs sm:text-sm text-gray-500">مشاهده همه</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-10 w-full">
        <ProductCard />
      </div>
    </>
  );
}
