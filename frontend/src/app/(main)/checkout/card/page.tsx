"use client";

import { useCart } from "@/hooks/queries/useCart";
import { useEffect, useState } from "react";
import { BiTrash } from "react-icons/bi";

type CartItemApi = {
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  availableStock: number;
};

type CartFarmApi = {
  farmCode: string;
  farmName: string;
  items: CartItemApi[];
};

type CartApiResponse = {
  farms: CartFarmApi[];
  totalPrice: number;
  itemCount: number;
  isSuccess: boolean;
};

type Product = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  availableStock: number;
};

type Store = {
  id: string;
  name: string;
  products: Product[];
};

const mapCartToStores = (data: CartApiResponse): Store[] => {
  return data?.farms?.map((farm) => ({
    id: farm.farmCode,
    name: farm.farmName,
    products: farm.items.map((item) => ({
      id: item.productCode,
      name: item.productName,
      price: item.unitPrice,
      quantity: item.quantity,
      availableStock: item.availableStock,
    })),
  }));
};

const CartPage = () => {
  const { data } = useCart();
  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    if (data?.isSuccess) {
      setStores(mapCartToStores(data.data));
    }
  }, [data]);



  const handleQuantityChange = (
    storeId: string,
    productId: string,
    delta: number,
  ) => {
    setStores((prev) =>
      prev.map((store) =>
        store.id === storeId
          ? {
              ...store,
              products: store.products.map((p) =>
                p.id === productId
                  ? { ...p, quantity: Math.max(1, p.quantity + delta) }
                  : p,
              ),
            }
          : store,
      ),
    );
  };

  const handleRemoveProduct = (storeId: string, productId: string) => {
    setStores((prev) =>
      prev
        .map((store) =>
          store.id === storeId
            ? {
                ...store,
                products: store.products.filter((p) => p.id !== productId),
              }
            : store,
        )
        .filter((store) => store.products.length > 0),
    );
  };

  const handleRemoveStore = (storeId: string) => {
    setStores((prev) => prev.filter((s) => s.id !== storeId));
  };

  const totalItems = (store: Store) =>
    store.products.reduce((acc, p) => acc + p.quantity, 0);

  const totalPrice = (store: Store) =>
    store.products.reduce((acc, p) => acc + p.price * p.quantity, 0);

  return (
    <div className="max-w-md mx-auto min-h-screen p-4 space-y-4 bg-gray-50">
      <h1 className="text-lg font-semibold mb-2">سبد خرید</h1>

      {stores?.map((store) => (
        <div
          key={store.id}
          className="bg-white p-4 rounded-lg shadow space-y-3 border"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{store.name}</h3>
              <p className="text-xs text-gray-400">
                {totalItems(store)} کالا • {totalPrice(store).toLocaleString()}{" "}
                تومان
              </p>
            </div>
            <button onClick={() => handleRemoveStore(store.id)}>
              <BiTrash className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="space-y-3">
            {store?.products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between"
              >
                <div className="flex-1">
                  <p className="text-sm">{product.name}</p>
                  <p className="text-xs text-gray-500">
                    قیمت {product.price.toLocaleString()} تومان
                  </p>
                    <p className="text-xs text-gray-500">
                    موجود در انبار  {product?.availableStock}  
                  </p>
                </div>
           
                <div className="flex items-center gap-2">
                  <button
                    className="w-6 h-6 bg-gray-100 rounded"
                    onClick={() =>
                      handleQuantityChange(store.id, product.id, -1)
                    }
                  >
                    -
                  </button>

                  <span>{product.quantity}</span>

                  <button
                    className="w-6 h-6 bg-gray-100 rounded"
                    onClick={() =>
                      handleQuantityChange(store.id, product.id, 1)
                    }
                  >
                    +
                  </button>

                  <button
                    onClick={() => handleRemoveProduct(store.id, product.id)}
                  >
                    <BiTrash className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 mt-3">
            <button className="bg-emerald-500 text-white py-1 text-sm rounded font-semibold">
              تکمیل خرید
            </button>
            <button className="bg-gray-200 text-gray-700 py-1 text-sm rounded font-semibold">
              مشاهده مزرعه
            </button>
          </div>
        </div>
      ))}

      {stores?.length === 0 && (
        <p className="text-center text-gray-400">سبد خرید شما خالی است</p>
      )}
    </div>
  );
};

export default CartPage;
