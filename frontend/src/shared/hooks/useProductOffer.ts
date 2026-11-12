"use client";
import { useEffect, useState } from "react";
import type { ProductOffer } from "@/shared/types/productOffer";

export default function useProductOffer(offer: ProductOffer) {
  const [now, setNow] = useState(() => Date.now());
  const end = offer.discountEndsAt ? new Date(offer.discountEndsAt).getTime() : 0;
  useEffect(() => {
    setNow(Date.now());
    if (!end || end <= Date.now()) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [end]);
  return !!offer.discountPercentage && offer.discountPercentage > 0 && end > now;
}
