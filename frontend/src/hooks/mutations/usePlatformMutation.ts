"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { errorMessage } from "@/lib/actions/platform";
// همه فرم‌ها از یک قرارداد مشترک خطا و invalidation استفاده می‌کنند.
export function usePlatformMutation<TVariables, TResult>(
  mutationFn: (variables: TVariables) => Promise<TResult>,
  keys: string[],
  message = "تغییرات با موفقیت ثبت شد",
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      toast.success(message);
      const legacyKeys: Record<string, string[]> = {
        wallet: ["wallet"],
        cart: ["userGetCart"],
        profile: ["userProfile"],
      };
      await Promise.all(
        keys.flatMap((key) =>
          (legacyKeys[key] || []).map((legacy) =>
            client.invalidateQueries({ queryKey: [legacy] }),
          ),
        ),
      );
      await Promise.all(
        keys.map((key) =>
          client.invalidateQueries({ queryKey: ["platform", key] }),
        ),
      );
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}
