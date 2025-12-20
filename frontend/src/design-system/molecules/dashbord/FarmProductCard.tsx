import Button from "@/design-system/atoms/Button";
import Image from "next/image";

const ProductCard = ({
  name,
  img,
  price,
}: {
  name: string;
  img: string;
  price: string | number;
  secondPrice?: string;
}) => (
  <div className="w-full flex">
    <div className="flex flex-col justify-between h-full w-[70%]">
      <h3 className="font-semibold text-secondary-600">{name}</h3>
      <div className="flex flex-col">
        <p>{price}</p>
      </div>
    </div>
    <div className="flex flex-col w-[30%]">
      <Image src={img} width={200} height={200} alt="product" />
      <Button variant="success">ویرایش محصول</Button>
    </div>
  </div>
);

export default ProductCard;
