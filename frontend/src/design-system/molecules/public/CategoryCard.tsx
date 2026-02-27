import type { Category } from "@/data/siteData";
import Link from "next/link";

interface CategoryCardProps {
  category: Category;
}

const CategoryCard = ({ category }: CategoryCardProps) => {
  const Icon = category.icon;

  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-prymary_green/30 hover:shadow-md"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent transition-colors duration-300 group-hover:bg-prymary_green group-hover:text-green_foreground">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="font-heading text-base font-medium text-card_foreground">
        {category.title}
      </h3>
      {category.productCount !== undefined && (
        <span className="text-xs text-muted_foreground">
          {category.productCount} محصول
        </span>
      )}
    </Link>
  );
};

export default CategoryCard;
