"use client";

import Button from "@/design-system/atoms/Button";
import { useCart } from "@/hooks/queries/useCart";
import { getImageUrl } from "@/shared/utils/getImageUrl";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BiTrash } from "react-icons/bi";
import { BsEmojiFrownFill } from "react-icons/bs";
import { FaChevronLeft, FaLeaf } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";
import { PiTruckDuotone } from "react-icons/pi";

type CartItemApi = {
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  availableStock: number;
  primaryImageUrl: null | string;
};

type CartFarmApi = {
  farmCode: string;
  farmName: string;
  imageUrl: string | null;
  province: string | null;
  county: string | null;
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
  imageUrl: string;
  products: Product[];
};

const mapCartToStores = (data: CartApiResponse): Store[] => {
  return data?.farms?.map((farm) => ({
    id: farm.farmCode,
    name: farm.farmName,
    imageUrl: farm.imageUrl,
    province: farm.province,
    county: farm.county,
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
    <div className="md:mx-20">
      {stores?.length !== 0 && (
        <div className="my-12 flex flex-col lg:flex-row justify-between lg:gap-x-6  ">
          <div className=" w-full lg:w-[75%] p-1 sm:p-2 lg:p-8  rounded-lg h-fit mb-5 lg:mb-0 ">
            <div className="flex flex-col gap-y-7 ">
              <div className="w-full flex flex-col gap-y-5 lg:flex lg:flex-row lg:justify-between lg:items-center ">
                <div className="flex flex-col gap-y-2 w-full">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green">
                      <FaLeaf className="h-6 w-6 text-green_foreground " />
                    </div>
                    <span className="font-heading text-sm md:text-xl lg:text-sm xl:text-lg font-bold text-foreground">
                      سبد خرید
                    </span>
                  </div>
                  <p className="flex gap-x-2 items-center font-bold text-sm md:text-xl lg:text-sm xl:text-lg">
                    خانه <FaChevronLeft /> سبد خرید
                  </p>
                </div>
                <AlertBux text=" ارسال هر مزرعه به صورت جداگانه انجام میشود" />
              </div>
              {stores?.map((store) => (
                <div
                  key={store.id}
                  className="bg-white p-4 rounded-lg border-gray-300 space-y-3 border mb-4"
                >
                  <div className="flex items-center justify-between mb-8 ">
                    <div className="flex items-center justify-end gap-x-2 w-full">
                      <div className="flex items-center justify-start gap-x-2 w-full ">
                        {/* <button onClick={() => handleRemoveStore(store.id)}>
                          <BiTrash className="w-5 h-5 text-gray-400" />
                        </button> */}
                        <img
                          src={getImageUrl(store?.imageUrl)}
                          className="w-10 h-10 rounded-full "
                          alt=""
                        />

                        <div>
                          <h3 className="font-medium mb-2">{store.name}</h3>
                          <p className="text-xs font-bold flex items-center">
                            <FaLocationDot /> {store?.province} ,
                            {store?.county}{" "}
                          </p>
                        </div>
                      </div>
                      <div className="w-full  hidden sm:block">
                        <AlertBux text="ارسال از این مزرعه" />
                      </div>
                    </div>
                    <div className="w-full flex flex-col justify-end items-end">
                      <div className="flex flex-col items-center justify-center gap-y-2">
                        <p className="text-sm font-bold">جمع این مزرعه</p>
                        <p className="text-lg font-bold text-secondary-700 mr-1">
                          {/* {totalItems(store)} کالا •{" "} */}
                          {totalPrice(store).toLocaleString()}{" "}
                          <span className="text-xs">تومان</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {store?.products.map((product) => (
                      <div
                        key={product.id}
                        className="flex flex-col xs:flex-row text-center xs:text-right items-center justify-between border-t border-slate-200 p-2"
                      >
                        <div className="flex items-center justify-start gap-x-2 w-full">
                          <img
                            src={getImageUrl(product?.primaryImageUrl)}
                            className="w-20 h-10 rounded-md "
                            alt=""
                          />

                          <div className="flex flex-col items-start justify-center gap-y-1">
                            <p className="text-xs">{product.name}</p>

                            <p className="text-xs text-gray-500">
                              موجود در انبار {product?.availableStock}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 w-full">
                          <div className="flex   items-center justify-between gap-2">
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
                          </div>
                          <p className="text-xs text-gray-500 ">
                            {product.price.toLocaleString()}
                          </p>
                          {/* <p className="text-xs text-gray-500 ">
                            قیمت {product.price.toLocaleString()} تومان
                          </p> */}
                          <button
                            onClick={() =>
                              handleRemoveProduct(store.id, product.id)
                            }
                          >
                            <BiTrash className="w-5 h-5 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* <div className="flex flex-col gap-2 mt-3">
                    <Button>تکمیل خرید</Button>
                    <button className="bg-gray-200 text-gray-700 py-1 h-12 mt-2 text-sm rounded font-semibold">
                      مشاهده مزرعه
                    </button>
                  </div> */}
                </div>
              ))}
            </div>
          </div>

          <div className="sticky bottom-12 lg:top-24 bg-white shadow w-[90%] lg:w-[25%] p-4 rounded-lg h-fit mx-auto mb-5 lg:mb-0 lg:mt-32">
            <h2 className="text-gray-800 text-xl border-b-2 border-gray-300 pb-4 mb-8">
              قیمت کالا‌ها
            </h2>
            <div className="my-8 flex justify-between items-center text-lg">
              <span>جمع کل:</span>
              <span>21000</span>
            </div>
            <Button>تایید و تکمیل سفارش</Button>
          </div>
        </div>
      )}
      {stores?.length === 0 && (
        <div className="flex flex-col justify-center items-center mt-20">
          <BsEmojiFrownFill size={"80px"} />
          <p className="text-center text-lg text-gray-400 mt-5">
            سبد خرید شما خالی است
          </p>
        </div>
      )}
    </div>
  );
};

export default CartPage;

const AlertBux = ({ text }: { text: string }) => {
  return (
    <div className="w-full flex items-center justify-center gap-x-2 bg-secondary-700 py-2 rounded-lg text-white">
      <PiTruckDuotone className="text-white text-xs" />{" "}
      <p className="text-xs">{text}</p>
    </div>
  );
};

// "use client";

// import Button from "@/design-system/atoms/Button";
// import { useCart } from "@/hooks/queries/useCart";
// import Link from "next/link";
// import { useEffect, useState } from "react";
// import { BiTrash } from "react-icons/bi";
// import { BsEmojiFrownFill } from "react-icons/bs";
// import { FaLeaf } from "react-icons/fa";

// type CartItemApi = {
//   productCode: string;
//   productName: string;
//   quantity: number;
//   unitPrice: number;
//   totalPrice: number;
//   availableStock: number;
// };

// type CartFarmApi = {
//   farmCode: string;
//   farmName: string;
//   items: CartItemApi[];
// };

// type CartApiResponse = {
//   farms: CartFarmApi[];
//   totalPrice: number;
//   itemCount: number;
//   isSuccess: boolean;
// };

// type Product = {
//   id: string;
//   name: string;
//   price: number;
//   quantity: number;
//   availableStock: number;
// };

// type Store = {
//   id: string;
//   name: string;
//   products: Product[];
// };

// const mapCartToStores = (data: CartApiResponse): Store[] => {
//   return data?.farms?.map((farm) => ({
//     id: farm.farmCode,
//     name: farm.farmName,
//     products: farm.items.map((item) => ({
//       id: item.productCode,
//       name: item.productName,
//       price: item.unitPrice,
//       quantity: item.quantity,
//       availableStock: item.availableStock,
//     })),
//   }));
// };

// const CartPage = () => {
//   const { data } = useCart();
//   const [stores, setStores] = useState<Store[]>([]);

//   useEffect(() => {
//     if (data?.isSuccess) {
//       setStores(mapCartToStores(data.data));
//     }
//   }, [data]);

//   const handleQuantityChange = (
//     storeId: string,
//     productId: string,
//     delta: number
//   ) => {
//     setStores((prev) =>
//       prev.map((store) =>
//         store.id === storeId
//           ? {
//               ...store,
//               products: store.products.map((p) =>
//                 p.id === productId
//                   ? { ...p, quantity: Math.max(1, p.quantity + delta) }
//                   : p
//               ),
//             }
//           : store
//       )
//     );
//   };

//   const handleRemoveProduct = (storeId: string, productId: string) => {
//     setStores((prev) =>
//       prev
//         .map((store) =>
//           store.id === storeId
//             ? {
//                 ...store,
//                 products: store.products.filter((p) => p.id !== productId),
//               }
//             : store
//         )
//         .filter((store) => store.products.length > 0)
//     );
//   };

//   const handleRemoveStore = (storeId: string) => {
//     setStores((prev) => prev.filter((s) => s.id !== storeId));
//   };

//   const totalItems = (store: Store) =>
//     store.products.reduce((acc, p) => acc + p.quantity, 0);

//   const totalPrice = (store: Store) =>
//     store.products.reduce((acc, p) => acc + p.price * p.quantity, 0);

//   return (
//     <div className="mx-2 xs:mx-6 md:mx-36">
//       <Link href="/" className="flex items-center gap-2">
//         <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green">
//           <FaLeaf className="h-6 w-6 text-green_foreground " />
//         </div>
//         <span className="font-heading text-xl font-bold text-foreground">
//           سبد خرید
//         </span>
//       </Link>

//       {stores?.length !== 0 && (
//         <div className="my-12 flex flex-col lg:flex-row justify-between">
//           <div className="bg-gray-100 w-full lg:w-[55%] p-8 rounded-lg h-fit mb-5 lg:mb-0">
//             {stores?.map((store) => (
//               <div
//                 key={store.id}
//                 className="bg-white p-4 rounded-lg border-gray-300 space-y-3 border mb-4"
//               >
//                 <div className="flex items-center justify-between mb-8">
//                   <div>
//                     <h3 className="font-medium mb-2">{store.name}</h3>
//                     <p className="text-xs text-gray-400 mr-1">
//                       {totalItems(store)} کالا •{" "}
//                       {totalPrice(store).toLocaleString()} تومان
//                     </p>
//                   </div>
//                   <button onClick={() => handleRemoveStore(store.id)}>
//                     <BiTrash className="w-5 h-5 text-gray-400" />
//                   </button>
//                 </div>

//                 <div className="space-y-3">
//                   {store?.products.map((product) => (
//                     <div
//                       key={product.id}
//                       className="flex flex-col xs:flex-row text-center xs:text-right items-center justify-between border border-secondary-700 rounded-md p-2"
//                     >
//                       <div className="flex-1">
//                         <p className="text-sm mb-2">{product.name}</p>
//                         <p className="text-xs text-gray-500 mb-2">
//                           قیمت {product.price.toLocaleString()} تومان
//                         </p>
//                         <p className="text-xs text-gray-500 mb-2">
//                           موجود در انبار {product?.availableStock}
//                         </p>
//                       </div>

//                       <div className="flex items-center gap-2">
//                         <button
//                           className="w-6 h-6 bg-gray-100 rounded"
//                           onClick={() =>
//                             handleQuantityChange(store.id, product.id, -1)
//                           }
//                         >
//                           -
//                         </button>

//                         <span>{product.quantity}</span>

//                         <button
//                           className="w-6 h-6 bg-gray-100 rounded"
//                           onClick={() =>
//                             handleQuantityChange(store.id, product.id, 1)
//                           }
//                         >
//                           +
//                         </button>

//                         <button
//                           onClick={() =>
//                             handleRemoveProduct(store.id, product.id)
//                           }
//                         >
//                           <BiTrash className="w-5 h-5 text-gray-400" />
//                         </button>
//                       </div>
//                     </div>
//                   ))}
//                 </div>

//                 <div className="flex flex-col gap-2 mt-3">
//                   <Button>تکمیل خرید</Button>
//                   <button className="bg-gray-200 text-gray-700 py-1 h-12 mt-2 text-sm rounded font-semibold">
//                     مشاهده مزرعه
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>

//           <div className="sticky bottom-12 lg:top-24 bg-gray-100 shadow w-[90%] lg:w-[35%] p-4 rounded-lg h-fit mx-auto mb-5 lg:mb-0">
//             <h2 className="text-gray-800 text-xl border-b-2 border-gray-300 pb-4 mb-8">
//               قیمت کالا‌ها
//             </h2>
//             <div className="my-8 flex justify-between items-center text-lg">
//               <span>جمع کل:</span>
//               <span>21000</span>
//             </div>
//             <Button>تایید و تکمیل سفارش</Button>
//           </div>
//         </div>
//       )}
//       {stores?.length === 0 && (
//         <div className="flex flex-col justify-center items-center mt-20">
//           <BsEmojiFrownFill size={"80px"} />
//           <p className="text-center text-lg text-gray-400 mt-5">
//             سبد خرید شما خالی است
//           </p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CartPage;
