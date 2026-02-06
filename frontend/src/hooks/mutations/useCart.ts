import { AddCart } from "@/lib/actions/cart";
import { useMutation } from "@tanstack/react-query";

const useCart = () => {
  const addCart = useMutation({
    mutationFn: (params: {
      cartId: number | string;
      productCode: string;
      quantity: number;
    }) => AddCart(params),
  });
  return { addCart };
};

export default useCart;
