import { categories } from "@/data/siteData";
import BreadcrumbNav from "@/design-system/atoms/BreadcrumbNav";
import SectionWrapper from "@/design-system/molecules/Home/SectionWrapper";
import CategoryCard from "@/design-system/molecules/public/CategoryCard";

export default function CategoryPage() {
  return (
    <SectionWrapper>
      <BreadcrumbNav items={[{ label: "دسته بندی" }]} />
      <h1 className="font-heading text-xl font-semibold text-foreground md:text-2xl ">
        دسته بندی های کشاورزی
      </h1>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {categories.map((cat) => (
          <CategoryCard key={cat.slug} category={cat} />
        ))}
      </div>
    </SectionWrapper>
  );
}
