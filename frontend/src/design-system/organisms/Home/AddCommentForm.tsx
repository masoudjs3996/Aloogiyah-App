"use client";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

import { TextAreaField, TextField } from "@/design-system/molecules/public";
import Button from "@/design-system/atoms/Button";
import * as yup from "yup";
import { useCreateComment } from "@/hooks/mutations/useAddComment";
import { useEffect } from "react";

export const addCommentSchema = yup.object({
  content: yup
    .string()
    .required("متن کامنت الزامی است")
    .min(3, "حداقل ۳ کاراکتر وارد کنید")
    .max(500, "حداکثر ۵۰۰ کاراکتر مجاز است"),
});
type Props = {
  productID: number | string;
  parentCode?: string | null;
};
export type AddCommentFormValues = {
  content: string;
};
const AddCommentForm = ({ productID, parentCode }: Props) => {
  const queryClient = useQueryClient();
  const { createComment } = useCreateComment();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddCommentFormValues>({
    resolver: yupResolver(addCommentSchema),
  });
  const onSubmit = (values: AddCommentFormValues) => {
    createComment.mutate(
      {
        content: values.content,
        rating: 5,
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
        },
        onError: () => {
          toast.error("خطا در ثبت کامنت");
        },
      },
    );
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4 min-w-[500px]"
    >
      <TextAreaField
        label="متن کامنت"
        placeholder="نظر خود را بنویسید..."
        rows={4}
        {...register("content")}
        error={errors.content?.message}
      />

      <Button type="submit" variant="success">
        ارسال کامنت
      </Button>
    </form>
  );
};

export default AddCommentForm;
