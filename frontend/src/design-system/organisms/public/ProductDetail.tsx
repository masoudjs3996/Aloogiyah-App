"use client";

import Button from "@/design-system/atoms/Button";
<<<<<<< HEAD
=======
import { useCommentsTree } from "@/hooks/queries/useComments";
>>>>>>> 35a56bf7508fb1ac82778fe55f43c6436f5ae3e7
import { useProduct } from "@/hooks/queries/useProduct";
import { getImageUrl } from "@/shared/utils/getImageUrl";
import {
  ArrowRightIcon,
  MinusIcon,
  PlusIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { useEffect, useState } from "react";
import Modal from "./Modal";
import AddCommentForm from "../Home/AddCommentForm";

type Review = {
  id: number;
  name: string;
  date: string;
  text: string;
  isStoreReply?: boolean;
};

const ProductDetail = ({ productId }: { productId: string }) => {
  const { product, isLoading } = useProduct(productId);
  const { name, retailPrice, wholesalePrice, description, primaryImageUrl } =
    product.data ?? {};
  const { data: comments } = useCommentsTree();
  const formatDate = (isoDate: string) =>
    new Date(isoDate).toLocaleDateString("fa-IR");
  const [openCommentForm, setOpenCommentForm] = useState(false);
  const [parentCode, setParentCode] = useState<string | null>(null);
  useEffect(() => {
    console.log(parentCode);
  }, [parentCode]);
  return (
    <div className="mx-auto max-w-md min-h-screen bg-white">
      <div className="p-4 flex items-center justify-between">
        <ArrowRightIcon className="w-4 h-4" />
      </div>
      <div className="px-4 ">
        <div className="relative w-full h-72 bg-gray-500 rounded-2xl">
          <Image
            alt={name}
            src={getImageUrl(primaryImageUrl) ?? ""}
            fill
            className="absolute object-cover"
          />
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
            <span className="w-2 h-2 bg-white rounded-full opacity-100" />
            <span className="w-2 h-2 bg-white rounded-full opacity-50" />
            <span className="w-2 h-2 bg-white rounded-full opacity-50" />
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 text-sm">
          <StarIcon className="w-4 h-4" />
          <span>۴.۸</span>
          <span className="text-gray-400">(۳۸۸)</span>
        </div>
        <Button
          onClick={() => {
            setParentCode(null);
            setOpenCommentForm(true);
          }}
        >
          افزودن کامنت{" "}
        </Button>
        <h1 className="mt-2 text-base font-semibold">{name}</h1>

        <p className="mt-1 text-xs text-gray-400">{description}</p>

        <div className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">۵۰۰ گرم</span>
            <span className="font-semibold">{retailPrice}تومان</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">۱ کیلوگرم</span>
            <span className="font-semibold">{wholesalePrice}تومان</span>
          </div>
        </div>
      </div>

      {/* Quantity */}
      <div className="px-4 flex items-center gap-3">
        <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
          <MinusIcon className="w-4 h-4" />
        </button>
        <span>۱</span>
        <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
          <PlusIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Reviews */}
      <div className="p-4 mt-6">
        <h2 className="font-medium text-sm mb-4">نظرات دیگر کاربران</h2>

        <div className="space-y-4 ">
          {comments &&
            comments?.map((comment: any) => (
              <div key={comment.code} className="space-y-2">
                {/* Comment */}
                <div className="max-w-[85%] text-xs p-3 rounded-2xl leading-relaxed bg-gray-100 ml-auto">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{comment.name}</span>
                    <span className="text-[10px] text-gray-400">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p>{comment.content}</p>
                  <Button
                    onClick={() => {
                      setParentCode(comment?.parentCode);
                      setOpenCommentForm(true);
                    }}
                  >
                    پاسخ
                  </Button>
                </div>

                {/* Replies */}
                {comment.subComments?.map((reply: any) => (
                  <div
                    key={reply.code}
                    className="max-w-[85%] text-xs p-3 rounded-2xl leading-relaxed bg-emerald-50 mr-auto border border-emerald-200"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{reply.name}</span>
                      <span className="text-[10px] text-gray-400">
                        {formatDate(reply.createdAt)}
                      </span>
                    </div>
                    <p>{reply.content}</p>
                    <Button
                      onClick={() => {
                        setParentCode(reply?.parentCode);
                        setOpenCommentForm(true);
                      }}
                    >
                      پاسخ
                    </Button>
                  </div>
                ))}
              </div>
            ))}
        </div>
      </div>
      {/* Add to Cart */}
<<<<<<< HEAD
      <Button variant="secondary">افزودن به سبد خرید</Button>
=======
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-white border-t">
        <button className="w-full bg-emerald-500 text-white py-3 rounded-xl text-sm font-medium">
          افزودن به سبد خرید
        </button>
      </div>
      <Modal
        open={openCommentForm}
        onClose={() => setOpenCommentForm(false)}
        title="فرم ارسال کامنت"
      >
        <AddCommentForm productID={productId} parentCode={parentCode} />
      </Modal>
>>>>>>> 35a56bf7508fb1ac82778fe55f43c6436f5ae3e7
    </div>
  );
};

export default ProductDetail;
