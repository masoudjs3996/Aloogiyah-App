"use client";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { TextAreaField, TextField } from "@/design-system/molecules/public";
import Button from "@/design-system/atoms/Button";
import * as yup from "yup";
import { useCreateComment } from "@/hooks/mutations/useAddComment";
import { isAxiosError } from "axios";
import Cookies from "js-cookie";
import { request } from "@/lib/actions/platform";

export const addCommentSchema = yup.object({
  content: yup
    .string()
    .required("متن کامنت الزامی است")
    .min(3, "حداقل ۳ کاراکتر وارد کنید")
    .max(500, "حداکثر ۵۰۰ کاراکتر مجاز است"),
  rating: yup.number().when([], {
    is: () => true,
    then: (schema) => schema.integer().min(1).max(5).required("امتیاز محصول را انتخاب کنید"),
  }),
});
type Props = {
  productID: number | string;
  parentCode?: string | null;
};
export type AddCommentFormValues = {
  content: string;
  rating: number;
};
type ExistingProductReview = {
  code: string;
  content: string;
  rating?: number | null;
  statusCode: string;
};
const AddCommentForm = ({ productID, parentCode }: Props) => {
  const queryClient = useQueryClient();
  const { createComment } = useCreateComment();
  const existingReview = useQuery({
    queryKey: ["my-product-review", productID],
    queryFn: () =>
      request<ExistingProductReview | null>("/Comment/GetMyProductReview", {
        params: { entityCode: String(productID), entityComment: "AgriculturalProduct" },
      }),
    enabled: !!Cookies.get("token") && !parentCode,
  });
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AddCommentFormValues>({
    resolver: yupResolver(addCommentSchema),
    defaultValues: { rating: 5 },
  });
  useEffect(() => {
    if (existingReview.data) {
      reset({ content: existingReview.data.content, rating: existingReview.data.rating ?? 5 });
    }
  }, [existingReview.data, reset]);

  const onSubmit = async (values: AddCommentFormValues) => {
    // Guest sessions use guestToken; only a user access token may create comments.
    if (!Cookies.get("token")) {
      toast.error("برای ثبت کامنت باید وارد سایت شوید. لطفاً ابتدا وارد حساب کاربری‌تان شوید.");
      return;
    }

    if (!parentCode && existingReview.data) {
      try {
        await request<boolean>("/Comment/Update", {
          method: "PUT",
          data: {
            code: existingReview.data.code,
            content: values.content,
            rating: values.rating,
            statusCode: existingReview.data.statusCode,
          },
        });
        toast.success("دیدگاه و امتیاز شما ویرایش شد و برای بررسی دوباره ارسال شد.");
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["getCommentsTree", productID] }),
          queryClient.invalidateQueries({ queryKey: ["product-rating-summary", productID] }),
          queryClient.invalidateQueries({ queryKey: ["my-product-review", productID] }),
        ]);
      } catch (error) {
        const serverMessage = isAxiosError(error) ? error.response?.data?.message : undefined;
        toast.error(serverMessage || "خطا در ویرایش دیدگاه");
      }
      return;
    }

    createComment.mutate(
      {
        content: values.content,
        rating: parentCode ? undefined : values.rating,
        entityCode: String(productID),
        parentCode: parentCode ?? "",
        entityComment: "AgriculturalProduct",
      },
      {
        onSuccess: (res) => {
          toast.success(
            "کامنت شما با موفقیت ثبت شد و پس از برسی و تایید منتشر خواهد شد ",
          );
          reset();
          queryClient.invalidateQueries({ queryKey: ["getCommentsTree", productID] });
          queryClient.invalidateQueries({ queryKey: ["my-product-review", productID] });
        },
        onError: (error) => {
          if (isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)) {
            toast.error("برای ثبت کامنت باید وارد سایت شوید. لطفاً ابتدا وارد حساب کاربری‌تان شوید.");
            return;
          }

          const serverMessage = isAxiosError(error)
            ? error.response?.data?.message
            : undefined;
          toast.error(serverMessage || "خطا در ثبت کامنت");
        },
      },
    );
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4 w-full min-w-0"
    >
      <TextAreaField
        label="متن کامنت"
        placeholder="نظر خود را بنویسید..."
        rows={4}
        {...register("content")}
        error={errors.content?.message}
      />

      {!parentCode && (
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-slate-700">امتیاز شما به محصول</legend>
          <div className="flex items-center gap-1" dir="ltr" role="radiogroup" aria-label="امتیاز محصول">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} type="button" role="radio" aria-checked={watch("rating") === star} aria-label={`${star} ستاره`}
                onClick={() => setValue("rating", star, { shouldValidate: true })}
                className={`text-3xl leading-none ${star <= (watch("rating") || 0) ? "text-amber-400" : "text-slate-300"}`}>
                ★
              </button>
            ))}
          </div>
          {errors.rating?.message && <p className="mt-1 text-xs text-red-600">{errors.rating.message}</p>}
        </fieldset>
      )}

      <Button type="submit" variant="success" disabled={existingReview.isLoading || createComment.isPending}>
        {existingReview.isLoading ? "در حال بررسی دیدگاه شما..." : existingReview.data ? "ویرایش دیدگاه و امتیاز" : parentCode ? "ارسال پاسخ" : "ارسال دیدگاه"}
      </Button>
    </form>
  );
};

export default AddCommentForm;
