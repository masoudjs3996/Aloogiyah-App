import { ProductCard } from "@/design-system/molecules/public";

const Product = async () => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-10 w-full">
      <ProductCard />
    </div>
  );
};

export default Product;
