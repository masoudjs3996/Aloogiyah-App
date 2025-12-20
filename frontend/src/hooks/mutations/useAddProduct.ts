import { AddProduct } from "@/lib/actions/product";
import { useMutation } from "@tanstack/react-query";


export const useCreateProduct = () => {
  const createProduct = useMutation({
    mutationFn: AddProduct,
  });

  return { createProduct };
};

// // ===== بروزرسانی محصول =====
// export const useUpdateProduct = () => {
//   const updateProductMutation = useMutation({
//     mutationFn: updateProduct, // فرض بر اینه که فانکشنی مشابه createProductWithImages داری
//   });

//   return { updateProductMutation };
// };

// // ===== حذف محصول =====
// export const useDeleteProduct = () => {
//   const deleteProductMutation = useMutation({
//     mutationFn: deleteProduct, // فانکشنی که id محصول رو میگیره و حذف میکنه
//   });

//   return { deleteProductMutation };
// };
