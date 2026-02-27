import { getFeaturedCategories } from "@/lib/actions/categories";
import {
  // CategoryCard,
  FarmCard,
  ProductCard,
} from "@/design-system/molecules/public";
import { BannerSlider } from "@/design-system/organisms/Home";
import { GetFarmsByFilter } from "@/lib/actions/farm";
import SectionWrapper from "@/design-system/molecules/Home/SectionWrapper";
import Link from "next/link";
import { categories } from "@/data/siteData";
import CategoryCard from "@/design-system/molecules/public/CategoryCard";
// import { getProducts } from "@/lib/actions/product";

export default async function Home() {
  const categoRes = await getFeaturedCategories();
  // const categories = categoRes?.data;
  const farmRes = await GetFarmsByFilter();
  const farms = farmRes?.data;
  // const proRes = await getProducts();
  // const products = proRes?.items;
  // console.log("this is profucts ");
  // console.log(products);

  if (
    !categories ||
    categories.length === 0 ||
    !farms ||
    farms?.length === 0
    // !products ||
    // products.length === 0
  ) {
    return <p>مشکل در بارگیری دیتا </p>;
  }

  return (
    <>
      <BannerSlider />
      <SectionWrapper
        title="دسته بندی های کشاورزی"
        subtitle="طیف متنوع محصولات کشاورزی و دسته بندی های کشاورزی ما را جستجو کنید"
        className="mt-10 md:mt-24"
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {categories.map((cat) => (
            <CategoryCard key={cat.slug} category={cat} />
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/categories"
            className="inline-flex items-center text-sm font-semibold text-prymary_green transition-colors hover:text-prymary_green/80"
          >
            مشاهده همه دسته بندی ها ←
          </Link>
        </div>
      </SectionWrapper>
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
