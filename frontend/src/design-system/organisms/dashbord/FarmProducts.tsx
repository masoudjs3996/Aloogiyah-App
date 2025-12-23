"use client";
import Button from "@/design-system/atoms/Button";
import ProductCard from "@/design-system/molecules/dashbord/FarmProductCard";
import { useProducts } from "@/hooks/queries/useProduct";
import { getImageUrl } from "@/shared/utils/getImageUrl";
import Link from "next/link";
const FarmProducts = ({ fermCode }: { fermCode: string }) => {
  const { products, isLoading } = useProducts(fermCode);
  
  
  return (
    <div className="flex flex-col justify-between h-full ">
      <div className="flex flex-col gap-4 mt-4">
        {products.map((product) => (
          <Link
            href={`/dashboard/farm/myFarms/${fermCode}/farmProducts/${product?.code}`}
            key={product.code}
          >
            <ProductCard
              key={product.code}
              name={product?.name}
              img={getImageUrl(product?.primaryImageUrl)}
              price={product?.retailPrice}
            />
          </Link>
        ))}
      </div>

      <Link
        href={`/dashboard/farm/myFarms/${fermCode}/farmProducts/addFarmProducts`}
      >
        <Button variant="success">+ ثبت محصول جدید</Button>
      </Link>
    </div>
  );
};

export default FarmProducts;
