import { AddProduct } from "@/lib/actions/product";
import { useMutation } from "@tanstack/react-query";


export const useCreateProduct = () => {
  const createProduct = useMutation({
    mutationFn: AddProduct,
  });

  return { createProduct };
};
