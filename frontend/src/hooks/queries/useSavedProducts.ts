"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { request, errorMessage } from "@/lib/actions/platform";
import type { SavedProduct } from "@/shared/types/savedProduct";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
export function useSavedProducts() {
  const client = useQueryClient();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const query = useQuery({ queryKey: ["platform", "saved-products"], queryFn: () => request<SavedProduct[]>("/SavedListings"), enabled: mounted && !!Cookies.get("token") });
  const mutation = useMutation({
    mutationFn: ({ code, saved }: { code: string; saved: boolean }) => request(`/SavedListings/${encodeURIComponent(code)}`, { method: saved ? "PUT" : "DELETE" }),
    onSuccess: async (_, { saved }) => { await client.invalidateQueries({ queryKey: ["platform", "saved-products"] }); toast.success(saved ? "محصول ذخیره شد" : "محصول از ذخیره‌ها حذف شد"); },
    onError: (error) => toast.error(errorMessage(error)),
  });
  return { query, mutation };
}
