// Atomic Design Structure
// Atoms: ProductImage, PriceText, EditButton, CategoryChip
// Molecules: ProductCard, CategoryTabs
// Organisms: ProductListPage

// ===== Local Components (Since you don't have shadcn/ui) =====
// Simple Card container
const Card = ({ children, className = "" }: any) => (
  <div className={`border rounded-xl bg-white ${className}`}>{children}</div>
);

// Simple CardContent wrapper
const CardContent = ({ children, className = "" }: any) => (
  <div className={className}>{children}</div>
);

// Simple Button
const Button = ({ children, className = "", onClick }: any) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg font-medium transition-all ${className}`}
  >
    {children}
  </button>
);

// React import fixed above
import React from "react";
// removed external imports — using local components above
// removed external imports — using local Button above

// =============== Atoms ===============
// Atom: Product Image
const ProductImage = ({ src }: { src: string }) => (
  <img src={src} alt="product" className="w-20 h-20 rounded-lg object-cover" />
);

// Atom: Price text block
const PriceText = ({ children }: { children: React.ReactNode }) => (
  <p className="text-gray-700 text-sm leading-6">{children}</p>
);

// Atom: Edit button
const EditButton = () => (
  <Button className="bg-green-200 text-green-700 mt-2 text-xs px-3 py-1 rounded-full shadow-none hover:bg-green-300">
    ویرایش محصول
  </Button>
);

// Atom: Category Chip
const CategoryChip = ({
  label,
  active,
}: {
  label: string;
  active?: boolean;
}) => (
  <button
    className={`px-4 py-1 rounded-full text-sm border transition-all ${
      active
        ? "bg-gray-800 text-white border-gray-800"
        : "bg-white text-gray-700 border-gray-300"
    }`}
  >
    {label}
  </button>
);

// =============== Molecules ===============
// Molecule: Category Tabs
const CategoryTabs = () => (
  <div className="flex gap-2 overflow-x-auto pb-3">
    <CategoryChip label="همه" active />
    <CategoryChip label="گل و گیاه آپارتمانی" />
    <CategoryChip label="دسته گل و ..." />
    <CategoryChip label="گیفت و سبد هدیه" />
  </div>
);

// Molecule: Product Card
const ProductCard = ({
  name,
  img,
  price,
  secondPrice,
}: {
  name: string;
  img: string;
  price: string;
  secondPrice?: string;
}) => (
  <Card className="w-full shadow-sm border rounded-2xl p-3">
    <CardContent className="flex items-start gap-3 p-0">
      <ProductImage src={img} />
      <div className="flex flex-col justify-between flex-1">
        <h3 className="font-semibold text-gray-800">{name}</h3>
        <PriceText>
          {price}
          {secondPrice && (
            <>
              <br />
              تا
              <br />
              {secondPrice}
            </>
          )}
        </PriceText>
        <EditButton />
      </div>
    </CardContent>
  </Card>
);

// =============== Organism ===============
// Organism: Product List Page
const ProductListPage = () => {
  return (
    <div className="w-full h-full p-5 pb-24">
      <CategoryTabs />

      <div className="flex flex-col gap-4 mt-4">
        <ProductCard
          name="شاخه گل لاله"
          img="/tulip.png"
          price="۷۰۰ گرم • ۵۶۰ تومان"
        />

        <ProductCard
          name="شاخه گل رز"
          img="/rose.png"
          price="۵۰۰ گرم • ۴۵۰ تومان"
          secondPrice="۱ کیلو • ۹۰۰ تومان"
        />

        <ProductCard
          name="شاخه گل لاله"
          img="/tulip.png"
          price="۷۰۰ گرم • ۵۶۰ تومان"
        />
      </div>

      <Button className="w-full bg-green-400 text-white py-3 rounded-xl text-base fixed bottom-4 left-0 right-0 mx-5">
        + ثبت محصول جدید
      </Button>
    </div>
  );
};

export default ProductListPage;
