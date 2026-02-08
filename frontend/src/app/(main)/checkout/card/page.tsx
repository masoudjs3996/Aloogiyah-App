"use client";

import { useCart } from "@/hooks/queries/useCart";
import Image from "next/image";
import { useEffect, useState } from "react";
import { BiTrash } from "react-icons/bi";

type Product = {
  id: number;
  name: string;
  price: number;
  quantity: number;
};

type Store = {
  id: number;
  name: string;
  products: Product[];
};

const CartPage = () => {
  const { data } = useCart();
  const [stores, setStores] = useState<Store[]>([
    {
      id: 1,
      name: "فروشگاه شماره یک",
      products: [
        {
          id: 1,
          name: "اسم محصول اول با تمام جزئیات",
          price: 13000,
          quantity: 1,
        },
        {
          id: 2,
          name: "اسم محصول اول با تمام جزئیات",
          price: 19000,
          quantity: 2,
        },
        {
          id: 3,
          name: "اسم محصول اول با تمام جزئیات",
          price: 7000,
          quantity: 1,
        },
      ],
    },
    {
      id: 2,
      name: "فروشگاه شماره دو",
      products: [
        {
          id: 4,
          name: "اسم محصول اول با تمام جزئیات",
          price: 13000,
          quantity: 1,
        },
        {
          id: 5,
          name: "اسم محصول اول با تمام جزئیات",
          price: 19000,
          quantity: 2,
        },
      ],
    },
  ]);
  console.log(data);

  const handleQuantityChange = (
    storeId: number,
    productId: number,
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

  const handleRemoveProduct = (storeId: number, productId: number) => {
    setStores((prev) =>
      prev.map((store) =>
        store.id === storeId
          ? {
              ...store,
              products: store.products.filter((p) => p.id !== productId),
            }
          : store,
      ),
    );
  };

  const handleRemoveStore = (storeId: number) => {
    setStores((prev) => prev.filter((s) => s.id !== storeId));
  };

  const totalItems = (store: Store) =>
    store.products.reduce((acc, p) => acc + p.quantity, 0);

  const totalPrice = (store: Store) =>
    store.products.reduce((acc, p) => acc + p.price * p.quantity, 0);

  return (
    <div className="max-w-md mx-auto min-h-screen p-4 space-y-4 bg-gray-50">
      <h1 className="text-lg font-semibold mb-2">سبد خرید</h1>

      {stores.map((store) => (
        <div
          key={store.id}
          className="bg-white p-4 rounded-lg shadow space-y-3 border"
        >
          {/* header فروشگاه */}
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

          {/* لیست محصولات */}
          <div className="space-y-3">
            {store.products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between"
              >
                <div className="flex-1">
                  <p className="text-sm">{product.name}</p>
                  <p className="text-xs text-gray-500">
                    قیمت {product.price.toLocaleString()} تومان
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
                  <input type="checkbox" className="w-5 h-5" />
                  <button
                    onClick={() => handleRemoveProduct(store.id, product.id)}
                  >
                    <BiTrash className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* footer فروشگاه */}
          <div className="flex flex-col gap-2 mt-3">
            <button className="bg-emerald-500 text-white py-1 text-sm rounded font-semibold">
              تکمیل خرید
            </button>
            <button className="bg-gray-200 text-gray-700 py-1 text-sm rounded font-semibold">
              مشاهده فروشگاه
            </button>
          </div>
        </div>
      ))}

      {stores.length === 0 && (
        <p className="text-center text-gray-400">سبد خرید شما خالی است</p>
      )}
    </div>
  );
};

export default CartPage;
