import { isAxiosError } from "axios";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import type { Farm } from "@/design-system/organisms/platform/FarmsWorkspace";
import { request } from "@/lib/actions/platform";
import type { StoreProduct } from "@/shared/types/platform";
import { getImageUrl } from "@/shared/utils/getImageUrl";
import { publicDetailCode } from "@/shared/utils/public-detail-path";

async function loadDetail<T>(endpoint: string, code: string) {
  try {
    const detail = await request<T | null>(endpoint, { params: { code } });
    if (detail) return detail;
  } catch (error) {
    if (!isAxiosError(error) || error.response?.status !== 404) throw error;
  }
  notFound();
}

export const loadPublicFarm = cache((code: string) => loadDetail<Farm>("/Farm/GetByCode", code));
export const loadPublicProduct = cache((code: string) => loadDetail<StoreProduct>("/AgriculturalListing/GetByCode", code));

export function detailCodeOrNotFound(segment: string) {
  return publicDetailCode(segment) ?? notFound();
}

export function detailMetadata(title: string, description: string, path: string, image?: string): Metadata {
  const origin = process.env.WEB_ORIGIN || "https://aloogiyah.ir";
  const canonical = new URL(path, origin).toString();
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      locale: "fa_IR",
      ...(image && { images: [new URL(getImageUrl(image), origin)] }),
    },
  };
}
